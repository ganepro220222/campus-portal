package com.shuyuan.backend.service;

import com.alibaba.excel.EasyExcel;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.StatDaily;
import com.shuyuan.backend.mapper.StatDailyMapper;
import com.shuyuan.backend.vo.StatDailyExportRow;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * 管理后台统计看板（docs Phase 6）
 */
@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final AdminPermissionService adminPermissionService;
    private final StatsAggregationService statsAggregationService;
    private final StatDailyMapper statDailyMapper;

    public Map<String, Object> overview() {
        adminPermissionService.require("stats:view");
        return statsAggregationService.snapshotForDate(LocalDate.now());
    }

    public List<Map<String, Object>> trend(int days) {
        adminPermissionService.require("stats:view");
        return statsAggregationService.trend(days);
    }

    public List<Map<String, Object>> modules(int days) {
        adminPermissionService.require("stats:view");
        return statsAggregationService.moduleDistribution(days);
    }

    public List<Map<String, Object>> contentTop(String targetType, int limit) {
        adminPermissionService.require("stats:view");
        return statsAggregationService.contentTop(targetType, limit);
    }

    /** 导出指定月份每日汇总 Excel */
    public void exportMonth(String month, HttpServletResponse response) throws IOException {
        adminPermissionService.require("stats:view");
        YearMonth ym = parseMonth(month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<StatDaily> rows = statDailyMapper.selectList(new LambdaQueryWrapper<StatDaily>()
                .ge(StatDaily::getDate, start)
                .le(StatDaily::getDate, end)
                .orderByAsc(StatDaily::getDate));

        List<StatDailyExportRow> exportRows = rows.stream().map(r -> {
            StatDailyExportRow row = new StatDailyExportRow();
            row.setDate(r.getDate().toString());
            row.setPv(r.getPv());
            row.setUv(r.getUv());
            row.setDau(r.getDau());
            row.setNewMember(r.getNewMember());
            row.setEnrollCount(r.getEnrollCount());
            return row;
        }).toList();

        String fileName = URLEncoder.encode("统计月报_" + ym + ".xlsx", StandardCharsets.UTF_8);
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment;filename=" + fileName);
        EasyExcel.write(response.getOutputStream(), StatDailyExportRow.class)
                .sheet("每日汇总")
                .doWrite(exportRows);
    }

    private YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) {
            return YearMonth.now();
        }
        return YearMonth.parse(month.trim(), DateTimeFormatter.ofPattern("yyyy-MM"));
    }
}
