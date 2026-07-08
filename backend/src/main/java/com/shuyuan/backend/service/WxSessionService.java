package com.shuyuan.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shuyuan.backend.common.exception.BusinessException;
import com.shuyuan.backend.config.ShuyuanProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * 微信小程序 code2session，换取 openid（生产环境关闭 dev-mode 后走此逻辑）
 */
@Service
@RequiredArgsConstructor
public class WxSessionService {

    private static final String CODE2SESSION_URL =
            "https://api.weixin.qq.com/sns/jscode2session";

    private final ShuyuanProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /** 根据 wx.login 返回的 code 解析 openid */
    public String resolveOpenid(String code) {
        if (properties.getWx().isDevMode()) {
            if (code == null || code.isBlank()) {
                throw new BusinessException(400, "微信授权码不能为空");
            }
            return "dev_" + code.trim();
        }
        return fetchOpenidFromWechat(code);
    }

    private String fetchOpenidFromWechat(String code) {
        if (code == null || code.isBlank()) {
            throw new BusinessException(400, "微信授权码不能为空");
        }
        String appid = properties.getWx().getAppid();
        String secret = properties.getWx().getSecret();
        if (appid == null || appid.isBlank() || secret == null || secret.isBlank()) {
            throw new BusinessException(500, "微信登录未配置，请联系管理员");
        }
        String url = CODE2SESSION_URL
                + "?appid=" + enc(appid)
                + "&secret=" + enc(secret)
                + "&js_code=" + enc(code.trim())
                + "&grant_type=authorization_code";
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new BusinessException(502, "微信服务暂时不可用，请稍后重试");
            }
            return parseOpenid(response.body());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(502, "微信登录失败，请稍后重试");
        }
    }

    /** 解析微信返回 JSON，提取 openid 或映射错误码为中文提示 */
    String parseOpenid(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            if (root.hasNonNull("openid") && !root.get("openid").asText().isBlank()) {
                return root.get("openid").asText();
            }
            int errcode = root.path("errcode").asInt(0);
            String errmsg = root.path("errmsg").asText("");
            throw toWxException(errcode, errmsg);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(502, "微信登录响应解析失败");
        }
    }

    private BusinessException toWxException(int errcode, String errmsg) {
        int httpCode;
        String message;
        switch (errcode) {
            case 40029 -> {
                httpCode = 400;
                message = "微信授权码无效或已过期，请重新登录";
            }
            case 40163 -> {
                httpCode = 400;
                message = "微信授权码已使用，请重新获取";
            }
            case 40226 -> {
                httpCode = 403;
                message = "当前账号存在风险，无法登录";
            }
            case 45011 -> {
                httpCode = 429;
                message = "微信登录过于频繁，请稍后再试";
            }
            case -1 -> {
                httpCode = 502;
                message = "微信服务繁忙，请稍后重试";
            }
            default -> {
                if (errcode > 0) {
                    httpCode = 400;
                    message = "微信登录失败：" + errmsg;
                } else {
                    httpCode = 502;
                    message = "微信登录失败，请稍后重试";
                }
            }
        }
        return new BusinessException(httpCode, message);
    }

    private String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
