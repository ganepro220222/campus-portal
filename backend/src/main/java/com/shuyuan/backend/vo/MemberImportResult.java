package com.shuyuan.backend.vo;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MemberImportResult {

    private int totalRows;
    private int successCount;
    private int skippedCount;
    private int failedCount;
    private List<String> errors;
    /** 结构化失败明细，可导出 Excel 核对 */
    private List<MemberImportErrorRow> errorRows;
}
