package com.shuyuan.backend.service;

import com.shuyuan.backend.config.OssProperties;
import com.shuyuan.backend.mapper.OssMediaRefMapper;
import com.shuyuan.backend.util.OssManagedObjectKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 后台素材与 OSS 对象对齐：保存替换后删旧 key，回收站彻底删除后删对象，定时扫孤儿。
 *
 * <p>OSS 失败只记日志，不回滚业务删除。删除一律等事务提交后再做，避免回滚后库里还指着已删对象。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OssMediaCleanupService {

    private final OssService ossService;
    private final OssMediaRefMapper refMapper;
    private final OssProperties ossProperties;

    /** 保存成功后：新旧不是同一个可删 key 才尝试删旧的。 */
    public void afterReplace(String oldStored, String newStored) {
        String oldKey = OssManagedObjectKey.extractManaged(oldStored);
        String newKey = OssManagedObjectKey.extractManaged(newStored);
        if (oldKey == null || oldKey.equals(newKey)) {
            return;
        }
        afterCommit(() -> deleteIfUnreferenced(oldKey));
    }

    /** 彻底删除等场景：从已收集的存储值/HTML 里抽出 key，提交后再删仍无引用的。 */
    public void releaseStored(Collection<String> storedOrHtml) {
        Set<String> keys = OssManagedObjectKey.extractAllManaged(storedOrHtml);
        if (keys.isEmpty()) {
            return;
        }
        afterCommit(() -> {
            for (String key : keys) {
                deleteIfUnreferenced(key);
            }
        });
    }

    /** 彻底删除前读取该行（及子表）上的素材字段。必须在物理删行之前调用。 */
    public List<String> collectStoredFor(String type, Long id) {
        if (type == null || id == null) {
            return List.of();
        }
        List<String> blobs = new ArrayList<>();
        switch (type) {
            case "course" -> addMap(blobs, refMapper.findCourseMedia(id));
            case "resource" -> addMap(blobs, refMapper.findResourceMedia(id));
            case "news" -> addMap(blobs, refMapper.findNewsMedia(id));
            case "hall" -> {
                addMap(blobs, refMapper.findHallMedia(id));
                addAll(blobs, refMapper.findHallMediaUrls(id));
            }
            case "craft" -> {
                addMap(blobs, refMapper.findCraftMedia(id));
                addAll(blobs, refMapper.findCraftImageUrls(id));
            }
            case "activity" -> addMap(blobs, refMapper.findActivityMedia(id));
            case "banner" -> addMap(blobs, refMapper.findBannerMedia(id));
            case "college_app" -> addMap(blobs, refMapper.findCollegeAppMedia(id));
            case "announcement" -> addMap(blobs, refMapper.findAnnouncementMedia(id));
            default -> {
                // 分类 / 导航 / 角色 / 账号没有后台上传对象
            }
        }
        return blobs;
    }

    public void deleteIfUnreferenced(String objectKey) {
        if (!OssManagedObjectKey.isManaged(objectKey)) {
            return;
        }
        try {
            long refs = refMapper.countReferences(objectKey);
            if (refs > 0) {
                log.info("[oss-cleanup] skip referenced key={} refs={}", objectKey, refs);
                return;
            }
            boolean ok = ossService.deleteObjectQuietly(objectKey);
            log.info("[oss-cleanup] delete key={} ok={}", objectKey, ok);
        } catch (Exception e) {
            log.warn("[oss-cleanup] failed key={}", objectKey, e);
        }
    }

    /**
     * 三期：列出后台前缀下、超过最短存活时间、库中已无引用的对象。
     * 候选数超过熔断阈值则整轮不删，避免引用扫描 SQL 出错时误清桶。
     */
    public SweepReport sweepOrphans(boolean dryRun) {
        SweepReport report = new SweepReport();
        if (!ossService.isEnabled() || !ossProperties.isOrphanSweepEnabled()) {
            report.skippedReason = "disabled";
            return report;
        }
        int minAgeHours = Math.max(1, ossProperties.getOrphanMinAgeHours());
        int maxDeletes = Math.max(1, ossProperties.getOrphanSweepMaxDeletes());
        Instant cutoff = Instant.now().minus(minAgeHours, ChronoUnit.HOURS);

        List<OssService.ManagedObject> objects;
        try {
            objects = ossService.listManagedObjects();
        } catch (Exception e) {
            log.warn("[oss-cleanup] list objects failed", e);
            report.skippedReason = "list-failed";
            return report;
        }

        List<String> candidates = new ArrayList<>();
        for (OssService.ManagedObject obj : objects) {
            report.listed++;
            // 改时间拿不到就当还新：宁可漏删，也不要误清刚上传或元数据异常的对象
            if (obj.lastModified() == null || obj.lastModified().toInstant().isAfter(cutoff)) {
                report.tooNew++;
                continue;
            }
            long refs;
            try {
                refs = refMapper.countReferences(obj.key());
            } catch (Exception e) {
                log.warn("[oss-cleanup] count refs failed key={}", obj.key(), e);
                report.skippedReason = "count-failed";
                return report;
            }
            if (refs > 0) {
                report.referenced++;
                continue;
            }
            candidates.add(obj.key());
        }

        if (candidates.size() > maxDeletes) {
            log.error("[oss-cleanup] abort sweep: {} orphan candidates exceed cap {}",
                    candidates.size(), maxDeletes);
            report.skippedReason = "cap-exceeded";
            report.candidateCount = candidates.size();
            return report;
        }

        report.candidateCount = candidates.size();
        if (dryRun) {
            return report;
        }
        for (String key : candidates) {
            // 再数一次：扫描到删除之间若有人保存引用了这个 key，不能删
            long refsAgain = refMapper.countReferences(key);
            if (refsAgain > 0) {
                report.referenced++;
                continue;
            }
            if (ossService.deleteObjectQuietly(key)) {
                report.deleted++;
            }
        }
        log.info("[oss-cleanup] sweep listed={} tooNew={} referenced={} deleted={}",
                report.listed, report.tooNew, report.referenced, report.deleted);
        return report;
    }

    private void afterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
            return;
        }
        action.run();
    }

    private static void addMap(List<String> blobs, Map<String, Object> row) {
        if (row == null) {
            return;
        }
        for (Object value : row.values()) {
            if (value != null) {
                blobs.add(String.valueOf(value));
            }
        }
    }

    private static void addAll(List<String> blobs, List<String> values) {
        if (values == null) {
            return;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                blobs.add(value);
            }
        }
    }

    public static final class SweepReport {
        public int listed;
        public int tooNew;
        public int referenced;
        public int candidateCount;
        public int deleted;
        public String skippedReason;

        public Map<String, Object> toMap() {
            return Map.of(
                    "listed", listed,
                    "tooNew", tooNew,
                    "referenced", referenced,
                    "candidateCount", candidateCount,
                    "deleted", deleted,
                    "skippedReason", skippedReason == null ? "" : skippedReason);
        }
    }
}
