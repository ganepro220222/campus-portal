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
}
