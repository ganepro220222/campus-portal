package com.shuyuan.backend;

import com.alibaba.excel.EasyExcel;
import com.shuyuan.backend.vo.MemberImportRow;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class MemberImportTemplateTest {

    /** 模板应为「单行表头 + 1 行示例」，共 2 行。 */
    @Test
    void templateHasSingleHeaderRow() {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        List<List<String>> head = new ArrayList<>();
        for (String h : MemberImportRow.TEMPLATE_HEADERS) head.add(List.of(h));
        EasyExcel.write(out).head(head).sheet("师生账号")
                .doWrite(List.of(List.of("2024001", "示例学生", "示例学院", "2024", "13800000000", "520101200001011234")));

        List<Map<Integer, String>> back = EasyExcel.read(new ByteArrayInputStream(out.toByteArray()))
                .sheet().headRowNumber(0).doReadSync();
        assertEquals(2, back.size(), "模板应只有 1 行表头 + 1 行示例");
        assertEquals("学号", back.get(0).get(0));
        assertEquals("姓名", back.get(0).get(1));
        assertEquals("身份证号", back.get(0).get(5));
        assertEquals("2024001", back.get(1).get(0));
    }

    /** 用「别名表头」+ 8 行数据，验证别名匹配且一行不丢。 */
    @Test
    void importReadsAllRowsWithAliasHeaders() {
        // 别名表头：学生学号 / 学生姓名 / 院系 / 入学年级 / 手机 / 身份证
        List<List<String>> data = new ArrayList<>();
        data.add(List.of("学生学号", "学生姓名", "院系", "入学年级", "手机", "身份证"));
        for (int i = 1; i <= 8; i++) {
            data.add(List.of("S" + i, "学生" + i, "示例学院", "2024", "1380000000" + (i % 10), "52010120000101123" + i));
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        List<List<String>> head = List.of(List.of("A")); // header written as data via headRowNumber(0) read
        // write raw (no head) so the alias header row is row 0
        EasyExcel.write(out).head(new ArrayList<>()).sheet("s").doWrite(data);

        List<Map<Integer, String>> rows = EasyExcel.read(new ByteArrayInputStream(out.toByteArray()))
                .sheet().headRowNumber(0).doReadSync();

        Map<Integer, String> colToField = new HashMap<>();
        rows.get(0).forEach((idx, header) -> {
            String f = MemberImportRow.HEADER_ALIAS.get(MemberImportRow.normalizeHeader(header));
            if (f != null) colToField.put(idx, f);
        });
        assertTrue(colToField.containsValue("studentNo"), "应识别到学号列");
        assertTrue(colToField.containsValue("realName"), "应识别到姓名列");

        int read = 0;
        for (int i = 1; i < rows.size(); i++) {
            Map<Integer, String> r = rows.get(i);
            String sno = null, name = null;
            for (Map.Entry<Integer, String> e : r.entrySet()) {
                String f = colToField.get(e.getKey());
                if ("studentNo".equals(f)) sno = e.getValue();
                if ("realName".equals(f)) name = e.getValue();
            }
            assertNotNull(sno);
            assertNotNull(name);
            read++;
        }
        assertEquals(8, read, "8 行数据应全部读到，不能被当成表头吞掉");
        System.out.println("PROBE_OK template=2rows, importedAllRows=" + read);
    }
}
