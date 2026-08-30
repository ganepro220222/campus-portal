package com.shuyuan.backend.asr;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AliyunFileAsrProviderTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void filetransHost_usesRegion() {
        assertEquals("filetrans.cn-shanghai.aliyuncs.com", AliyunFileAsrProvider.filetransHost("cn-shanghai"));
        assertEquals("filetrans.cn-shanghai.aliyuncs.com", AliyunFileAsrProvider.filetransHost(""));
        assertEquals("filetrans.cn-beijing.aliyuncs.com", AliyunFileAsrProvider.filetransHost("cn-beijing"));
    }

    @Test
    void buildTaskJson_matchesOfficialFiletransBody() throws Exception {
        String json = AliyunFileAsrProvider.buildTaskJson(
                mapper, "app-key-1", "https://oss.example.com/videos/a.mp4?sig=1");
        var node = mapper.readTree(json);
        assertEquals("app-key-1", node.path("appkey").asText());
        assertEquals("https://oss.example.com/videos/a.mp4?sig=1", node.path("file_link").asText());
        assertEquals("4.0", node.path("version").asText());
        assertTrue(node.path("enable_sample_rate_adaptive").asBoolean());
        assertEquals(22, node.path("sentence_max_length").asInt());
    }

    @Test
    void parseQueryResult_readsObjectResult() throws Exception {
        var root = mapper.readTree("""
                {"StatusText":"SUCCESS","Result":{"Sentences":[{"BeginTime":0,"EndTime":1000,"Text":"你好"}]}}
                """);
        AsrJobResult result = AliyunFileAsrProvider.parseQueryResult(root);
        assertEquals(AsrJobState.SUCCESS, result.state());
        assertTrue(result.vttContent().contains("你好"));
    }

    @Test
    void parseQueryResult_readsStringResult() throws Exception {
        var root = mapper.readTree("""
                {"StatusText":"SUCCESS","Result":"{\\"Sentences\\":[{\\"BeginTime\\":0,\\"EndTime\\":1000,\\"Text\\":\\"世界\\"}]}"}
                """);
        AsrJobResult result = AliyunFileAsrProvider.parseQueryResult(root);
        assertEquals(AsrJobState.SUCCESS, result.state());
        assertTrue(result.vttContent().contains("世界"));
    }

    @Test
    void parseQueryResult_mapsQueueingToProcessing() throws Exception {
        var root = mapper.readTree("{\"StatusText\":\"QUEUEING\"}");
        assertEquals(AsrJobState.PROCESSING, AliyunFileAsrProvider.parseQueryResult(root).state());
    }

    @Test
    void parseQueryResult_includesStatusCodeOnFailure() throws Exception {
        var root = mapper.readTree("{\"StatusText\":\"FAILED\",\"StatusCode\":41050002}");
        AsrJobResult result = AliyunFileAsrProvider.parseQueryResult(root);
        assertEquals(AsrJobState.FAILED, result.state());
        assertTrue(result.errorMessage().contains("41050002"));
    }
}
