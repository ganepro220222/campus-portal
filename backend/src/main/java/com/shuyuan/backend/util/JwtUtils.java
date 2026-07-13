package com.shuyuan.backend.util;

import com.shuyuan.backend.config.ShuyuanProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

    private final SecretKey key;
    private final long expireMs;
    private final long adminExpireMs;

    public JwtUtils(ShuyuanProperties properties) {
        String secret = properties.getJwt().getSecret();
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expireMs = properties.getJwt().getExpireDays() * 24L * 60 * 60 * 1000;
        this.adminExpireMs = properties.getJwt().getAdminExpireHours() * 60L * 60 * 1000;
    }

    public String createToken(Long memberId, String openid, int tokenVersion) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(memberId))
                .claim("type", "member")
                .claim("openid", openid)
                .claim("tokenVersion", tokenVersion)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expireMs))
                .signWith(key)
                .compact();
    }

    /** 微信绑定短期凭证（仅含 openid，有效期 10 分钟） */
    public String createWxBindToken(String openid) {
        Date now = new Date();
        return Jwts.builder()
                .subject("wx_bind")
                .claim("type", "wx_bind")
                .claim("openid", openid)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 10L * 60 * 1000))
                .signWith(key)
                .compact();
    }

    public String parseWxBindOpenid(String token) {
        Claims claims = parse(token);
        if (!"wx_bind".equals(claims.get("type", String.class))) {
            return null;
        }
        String openid = claims.get("openid", String.class);
        return openid == null || openid.isBlank() ? null : openid.trim();
    }

    /** 管理员 JWT（payload 含 adminId、roleId、tokenVersion） */
    public String createAdminToken(Long adminId, Long roleId, int tokenVersion) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(adminId))
                .claim("type", "admin")
                .claim("roleId", roleId)
                .claim("tokenVersion", tokenVersion)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + adminExpireMs))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long getMemberId(String token) {
        Claims claims = parse(token);
        if ("admin".equals(claims.get("type", String.class))) {
            return null;
        }
        return Long.parseLong(claims.getSubject());
    }

    public Long getAdminId(String token) {
        Claims claims = parse(token);
        if (!"admin".equals(claims.get("type", String.class))) {
            return null;
        }
        return Long.parseLong(claims.getSubject());
    }

    public Long getAdminRoleId(String token) {
        Claims claims = parse(token);
        Object roleId = claims.get("roleId");
        if (roleId == null) {
            return null;
        }
        return Long.valueOf(roleId.toString());
    }

    /** 无 claim 时视为 0，兼容历史 token */
    public int getTokenVersion(String token) {
        Claims claims = parse(token);
        Object version = claims.get("tokenVersion");
        if (version == null) {
            return 0;
        }
        return Integer.parseInt(version.toString());
    }
}
