package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class UploadContentInspectorTest {

    @Test
    void inspect_acceptsJpegMagic() {
        byte[] jpeg = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10};
        assertEquals("image/jpeg", UploadContentInspector.inspect("jpg", jpeg));
    }

    @Test
    void inspect_rejectsHtmlDisguisedAsJpeg() {
        byte[] html = "<html>".getBytes();
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> UploadContentInspector.inspect("jpg", html));
        assertEquals(400, ex.getCode());
    }

    @Test
    void inspect_acceptsPdfMagic() {
        byte[] pdf = "%PDF-1.4".getBytes();
        assertEquals("application/pdf", UploadContentInspector.inspect("pdf", pdf));
    }

    @Test
    void inspect_rejectsNonPdfWithPdfExtension() {
        byte[] html = "<!DOCTYPE html>".getBytes();
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> UploadContentInspector.inspect("pdf", html));
        assertEquals(400, ex.getCode());
    }

    @Test
    void inspect_acceptsLegacyAndOpenXmlExcelMagic() {
        byte[] xls = new byte[]{
                (byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0,
                (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1
        };
        byte[] xlsx = new byte[]{0x50, 0x4B, 0x03, 0x04, 0x14, 0x00};

        assertEquals("application/vnd.ms-excel",
                UploadContentInspector.inspect("xls", xls));
        assertEquals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                UploadContentInspector.inspect("xlsx", xlsx));
    }

    @Test
    void inspect_rejectsExcelExtensionWithWrongContainer() {
        byte[] xls = new byte[]{
                (byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0,
                (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1
        };

        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> UploadContentInspector.inspect("xlsx", xls));
        assertEquals(400, ex.getCode());
    }

    @Test
    void inspect_acceptsAdtsAacAndRejectsHtml() {
        byte[] adts = new byte[]{(byte) 0xFF, (byte) 0xF1, 0x50, (byte) 0x80};
        assertEquals("audio/aac", UploadContentInspector.inspect("aac", adts));

        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> UploadContentInspector.inspect("aac", "<html>".getBytes()));
        assertEquals(400, ex.getCode());
    }

    @Test
    void inspectVideoPlayability_rejectsHevcFtypBrand() {
        byte[] head = isoBox("ftyp", concat("hev1".getBytes(), new byte[]{0, 0, 0, 0}, "isom".getBytes()));
        var ex = assertThrows(com.shuyuan.backend.common.exception.BusinessException.class,
                () -> UploadContentInspector.inspectVideoPlayability(head, null));
        assertEquals(400, ex.getCode());
        org.junit.jupiter.api.Assertions.assertTrue(ex.getMessage().contains("H.265"));
    }

    @Test
    void inspectVideoPlayability_acceptsAvcFtypAndWarnsWhenMoovAtTail() {
        byte[] head = isoBox("ftyp", concat("isom".getBytes(), new byte[]{0, 0, 0, 0}, "mp41".getBytes()));
        byte[] tail = isoBox("moov", new byte[0]);
        assertEquals("", UploadContentInspector.inspectVideoPlayability(
                concat(head, isoBox("moov", new byte[0])), null));

        String warning = UploadContentInspector.inspectVideoPlayability(head, tail);
        org.junit.jupiter.api.Assertions.assertTrue(warning.contains("Fast Start"));
    }

    private static byte[] isoBox(String type, byte[] payload) {
        int size = 8 + payload.length;
        byte[] out = new byte[size];
        out[0] = (byte) (size >>> 24);
        out[1] = (byte) (size >>> 16);
        out[2] = (byte) (size >>> 8);
        out[3] = (byte) size;
        byte[] four = type.getBytes();
        System.arraycopy(four, 0, out, 4, 4);
        System.arraycopy(payload, 0, out, 8, payload.length);
        return out;
    }

    private static byte[] concat(byte[]... parts) {
        int len = 0;
        for (byte[] part : parts) {
            len += part.length;
        }
        byte[] out = new byte[len];
        int pos = 0;
        for (byte[] part : parts) {
            System.arraycopy(part, 0, out, pos, part.length);
            pos += part.length;
        }
        return out;
    }
}
