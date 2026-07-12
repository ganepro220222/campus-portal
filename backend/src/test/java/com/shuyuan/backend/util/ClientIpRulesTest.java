package com.shuyuan.backend.util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClientIpRulesTest {

    private static final List<String> PRIVATE_CIDRS = List.of(
            "127.0.0.1",
            "10.0.0.0/8",
            "172.16.0.0/12",
            "192.168.0.0/16");

    @Test
    void resolve_ignoresForwardedHeadersWhenTrustDisabled() {
        assertEquals("203.0.113.9", ClientIpRules.resolve(
                "203.0.113.9",
                "198.51.100.1",
                "198.51.100.2",
                false,
                PRIVATE_CIDRS));
    }

    @Test
    void resolve_ignoresForwardedHeadersFromUntrustedRemote() {
        assertEquals("203.0.113.9", ClientIpRules.resolve(
                "203.0.113.9",
                "198.51.100.1",
                null,
                true,
                PRIVATE_CIDRS));
    }

    @Test
    void resolve_usesForwardedHeadersFromTrustedProxy() {
        assertEquals("198.51.100.1", ClientIpRules.resolve(
                "127.0.0.1",
                "198.51.100.1, 10.0.0.2",
                null,
                true,
                PRIVATE_CIDRS));
    }

    @Test
    void resolve_usesXRealIpWhenForwardedMissing() {
        assertEquals("198.51.100.8", ClientIpRules.resolve(
                "10.1.2.3",
                null,
                "198.51.100.8",
                true,
                PRIVATE_CIDRS));
    }

    @Test
    void isTrustedProxy_matchesCidrAndExact() {
        assertTrue(ClientIpRules.isTrustedProxy("10.20.30.40", PRIVATE_CIDRS));
        assertTrue(ClientIpRules.isTrustedProxy("127.0.0.1", PRIVATE_CIDRS));
        assertFalse(ClientIpRules.isTrustedProxy("203.0.113.1", PRIVATE_CIDRS));
    }
}
