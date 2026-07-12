package com.shuyuan.backend.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiChatRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void question_withinLimit_isValid() {
        AiChatRequest req = new AiChatRequest();
        req.setQuestion("阳明文化是什么？");
        Set<ConstraintViolation<AiChatRequest>> violations = validator.validate(req);
        assertTrue(violations.isEmpty());
    }

    @Test
    void question_over500_isRejected() {
        AiChatRequest req = new AiChatRequest();
        req.setQuestion("a".repeat(501));
        Set<ConstraintViolation<AiChatRequest>> violations = validator.validate(req);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("500")));
    }
}
