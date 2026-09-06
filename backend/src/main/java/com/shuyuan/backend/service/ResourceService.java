package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.common.context.MemberContext;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.entity.DownloadRecord;
import com.shuyuan.backend.entity.Resource;
import com.shuyuan.backend.mapper.DownloadRecordMapper;
import com.shuyuan.backend.mapper.ResourceMapper;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResourceService {

    static final int MAX_FILE_CHUNK_BYTES = 4 * 1024 * 1024;
    static final Duration DOWNLOAD_TICKET_TTL = Duration.ofMinutes(30);
    static final Duration DOWNLOAD_TICKET_USED_TTL = Duration.ofHours(24);
    static final String DOWNLOAD_TICKET_PREFIX = "download:ticket:";
    static final String DOWNLOAD_TICKET_USED_PREFIX = "download:ticket:used:";

    private final ResourceMapper resourceMapper;
    private final DownloadRecordMapper downloadRecordMapper;
    private final CategoryService categoryService;
    private final EventLogService eventLogService;
    private final PointService pointService;
    private final OssService ossService;
    private final FavoriteService favoriteService;
    private final StringRedisTemplate redis;

    public List<Map<String, Object>> list(String category, String fileType) {
        CategoryService.CategoryFilter filter = categoryService.resolveFilter("resource", category);
        if (filter.isInvalid()) {
            return List.of();
        }

        Map<Long, String> catMap = categoryService.nameMap("resource");
        LambdaQueryWrapper<Resource> qw = new LambdaQueryWrapper<Resource>()
                .eq(Resource::getStatus, 1)
                .orderByDesc(Resource::getCreateTime);
        if (filter.shouldFilter()) {
            qw.eq(Resource::getCategoryId, filter.categoryId());
        }
        if (fileType != null && !fileType.isBlank() && !"全部".equals(fileType)) {
            qw.eq(Resource::getFileType, fileType);
        }
        List<Map<String, Object>> list = new ArrayList<>(resourceMapper.selectList(qw).stream()
                .map(r -> toListItem(r, catMap))
                .toList());
        favoriteService.enrichListCollected(list, "resource");
        return list;
    }

    public Map<String, Object> detail(Long id) {
        Resource resource = requireResource(id);
        Map<Long, String> catMap = categoryService.nameMap("resource");
        eventLogService.record("view", "resource", id);
        Map<String, Object> m = toDetailVo(resource, catMap);
        favoriteService.enrichCollected(m, "resource", id);
        return m;
    }

    /**
     * 准备下载：签发短时一次性凭证并返回签名地址。
     * 此时不写下载记录、不加次数、不发积分；等客户端确认打开或开播成功后再 complete。
     */
    public Map<String, Object> download(Long id) {
        Long memberId = requireMemberId();
        Resource resource = requireResource(id);
        String token = issueDownloadTicket(memberId, id);

        Map<String, Object> m = new HashMap<>();
        m.put("fileUrl", ossService.signMediaUrl(resource.getFileUrl()));
        m.put("previewUrl", ossService.signMediaUrl(resource.getPreviewUrl()));
        m.put("fileType", resource.getFileType());
        m.put("name", resource.getName());
        m.put("id", id);
        m.put("fileSizeKb", resource.getFileSizeKb());
        m.put("token", token);
        return m;
    }

    /**
     * 客户端在文档打开成功或音视频进入可播放后调用。同一凭证只确认一次。
     */
    @Transactional
    public Map<String, Object> completeDownload(Long id, String token) {
        Long memberId = requireMemberId();
        Resource resource = requireResource(id);
        TicketConsume consume = consumeDownloadTicket(token, memberId, id);
        if (consume == TicketConsume.ALREADY) {
            return Map.of("recorded", false);
        }
        if (consume != TicketConsume.OK) {
            throw new BusinessException(400, "下载凭证无效或已过期");
        }

        DownloadRecord record = new DownloadRecord();
        record.setMemberId(memberId);
        record.setResourceId(id);
        record.setFileName(resource.getName());
        record.setDownloadedAt(LocalDateTime.now());
        downloadRecordMapper.insert(record);
        eventLogService.record("download", "resource", id);
        pointService.award(memberId, "download_resource");

        int affected = resourceMapper.incrDownloadCount(id);
        if (affected == 0) {
            throw new BusinessException(404, "资源不存在");
        }
        return Map.of("recorded", true);
    }

    private String issueDownloadTicket(Long memberId, Long resourceId) {
        String token = UUID.randomUUID().toString().replace("-", "");
        try {
            redis.opsForValue().set(
                    DOWNLOAD_TICKET_PREFIX + token,
                    memberId + ":" + resourceId,
                    DOWNLOAD_TICKET_TTL);
        } catch (Exception e) {
            throw new BusinessException(503, "服务繁忙，请稍后重试");
        }
        return token;
    }

    private TicketConsume consumeDownloadTicket(String token, Long memberId, Long resourceId) {
        if (token == null || !token.matches("[a-fA-F0-9]{32}")) {
            return TicketConsume.INVALID;
        }
        String expected = memberId + ":" + resourceId;
        String ticketKey = DOWNLOAD_TICKET_PREFIX + token;
        String usedKey = DOWNLOAD_TICKET_USED_PREFIX + token;
        try {
            String bound = redis.opsForValue().getAndDelete(ticketKey);
            if (bound != null) {
                redis.opsForValue().set(usedKey, "1", DOWNLOAD_TICKET_USED_TTL);
                return expected.equals(bound) ? TicketConsume.OK : TicketConsume.INVALID;
            }
            return Boolean.TRUE.equals(redis.hasKey(usedKey)) ? TicketConsume.ALREADY : TicketConsume.INVALID;
        } catch (Exception e) {
            throw new BusinessException(503, "服务繁忙，请稍后重试");
        }
    }

    private enum TicketConsume {
        OK,
        ALREADY,
        INVALID
    }

    /** 登录后按资源 ID 读文件字节（不重复记下载次数） */
    public void writeFile(Long id, HttpServletResponse response) {
        requireMemberId();
        Resource resource = requireResource(id);
        if (!StringUtils.hasText(resource.getFileUrl())) {
            throw new BusinessException(404, "文件不存在");
        }
        ossService.writeObject(resource.getFileUrl(), response);
    }

    /** 登录后分块读取资料，供小程序用 wx.request 低内存下载大文档。 */
    public void writeFileChunk(Long id, long offset, int size, HttpServletResponse response) {
        requireMemberId();
        if (offset < 0 || size <= 0 || size > MAX_FILE_CHUNK_BYTES) {
            throw new BusinessException(400, "分块参数无效");
        }
        Resource resource = requireResource(id);
        if (!StringUtils.hasText(resource.getFileUrl())) {
            throw new BusinessException(404, "文件不存在");
        }
        ossService.writeObjectRange(resource.getFileUrl(), offset, size, response);
    }

    private Resource requireResource(Long id) {
        Resource resource = resourceMapper.selectById(id);
        if (resource == null || resource.getStatus() == null || resource.getStatus() != 1) {
            throw new BusinessException(404, "资源不存在");
        }
        return resource;
    }

    private Map<String, Object> toListItem(Resource r, Map<Long, String> catMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", r.getId());
        m.put("name", r.getName());
        m.put("fileType", r.getFileType());
        m.put("fileSizeKb", r.getFileSizeKb());
        m.put("fileSizeText", formatFileSize(r.getFileSizeKb()));
        m.put("downloadCount", r.getDownloadCount());
        m.put("categoryName", categoryService.getName(r.getCategoryId(), catMap));
        return m;
    }

    private Map<String, Object> toDetailVo(Resource r, Map<Long, String> catMap) {
        Map<String, Object> m = toListItem(r, catMap);
        m.put("hasFile", StringUtils.hasText(r.getFileUrl()));
        m.put("hasPreview", StringUtils.hasText(r.getPreviewUrl()));
        return m;
    }

    private String formatFileSize(Integer kb) {
        if (kb == null || kb <= 0) {
            return "";
        }
        if (kb >= 1024) {
            return String.format("%.1f MB", kb / 1024.0);
        }
        return kb + " KB";
    }

    private Long requireMemberId() {
        Long memberId = MemberContext.getMemberId();
        if (memberId == null) {
            throw new BusinessException(401, "请先登录");
        }
        return memberId;
    }
}
