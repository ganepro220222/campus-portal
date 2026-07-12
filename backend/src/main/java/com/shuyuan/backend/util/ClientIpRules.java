package com.shuyuan.backend.util;

import java.net.InetAddress;
import java.util.List;

/**
 * 客户端 IP 解析：仅在请求来自可信反代时读取 X-Forwarded-For / X-Real-IP。
 */
public final class ClientIpRules {

    private ClientIpRules() {
    }

    public static String resolve(String remoteAddr,
                                 String xForwardedFor,
                                 String xRealIp,
                                 boolean trustForwardedHeaders,
                                 List<String> trustedProxies) {
        String remote = normalize(remoteAddr);
        if (!trustForwardedHeaders || !isTrustedProxy(remote, trustedProxies)) {
            return remote;
        }
        String fromForwarded = firstForwardedClient(xForwardedFor);
        if (fromForwarded != null) {
            return fromForwarded;
        }
        String fromRealIp = normalize(xRealIp);
        if (fromRealIp != null) {
            return fromRealIp;
        }
        return remote;
    }

    static boolean isTrustedProxy(String remoteAddr, List<String> trustedProxies) {
        if (remoteAddr == null || remoteAddr.isBlank()) {
            return false;
        }
        if (trustedProxies == null || trustedProxies.isEmpty()) {
            return false;
        }
        String remote = remoteAddr.trim();
        for (String entry : trustedProxies) {
            if (entry == null || entry.isBlank()) {
                continue;
            }
            String rule = entry.trim();
            if (rule.contains("/")) {
                if (matchesCidr(remote, rule)) {
                    return true;
                }
            } else if (remote.equalsIgnoreCase(rule)) {
                return true;
            }
        }
        return false;
    }

    private static String firstForwardedClient(String xForwardedFor) {
        if (xForwardedFor == null || xForwardedFor.isBlank()) {
            return null;
        }
        int comma = xForwardedFor.indexOf(',');
        String first = (comma > 0 ? xForwardedFor.substring(0, comma) : xForwardedFor).trim();
        return normalize(first);
    }

    private static String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static boolean matchesCidr(String ip, String cidr) {
        int slash = cidr.indexOf('/');
        if (slash <= 0 || slash >= cidr.length() - 1) {
            return false;
        }
        String network = cidr.substring(0, slash).trim();
        int prefix;
        try {
            prefix = Integer.parseInt(cidr.substring(slash + 1).trim());
        } catch (NumberFormatException e) {
            return false;
        }
        if (prefix < 0 || prefix > 128) {
            return false;
        }
        try {
            InetAddress address = InetAddress.getByName(ip);
            InetAddress networkAddress = InetAddress.getByName(network);
            byte[] addressBytes = address.getAddress();
            byte[] networkBytes = networkAddress.getAddress();
            if (addressBytes.length != networkBytes.length) {
                return false;
            }
            int fullBytes = prefix / 8;
            int remainingBits = prefix % 8;
            for (int i = 0; i < fullBytes; i++) {
                if (addressBytes[i] != networkBytes[i]) {
                    return false;
                }
            }
            if (remainingBits == 0) {
                return true;
            }
            int mask = 0xFF << (8 - remainingBits);
            return (addressBytes[fullBytes] & mask) == (networkBytes[fullBytes] & mask);
        } catch (Exception e) {
            return false;
        }
    }
}
