package com.shuyuan.backend;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BcryptTest {

    @Test
    void printHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("Admin@123");
        System.out.println("BCrypt(Admin@123)=" + hash);
        assertTrue(encoder.matches("Admin@123", hash));
        assertFalse(encoder.matches("Admin@123",
                "$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKVXTBCbAaIxkOR5FbcGGpC1rW6."));
    }
}
