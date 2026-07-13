package com.shuyuan.backend.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminSaveRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void hallCreate_requiresName() {
        HallSaveRequest req = new HallSaveRequest();
        Set<ConstraintViolation<HallSaveRequest>> violations = validator.validate(req, ValidationGroups.Create.class);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getMessage().contains("展馆名称")));
    }

    @Test
    void hallUpdate_allowsPartialPayload() {
        HallSaveRequest req = new HallSaveRequest();
        req.setIntro("更新简介");
        Set<ConstraintViolation<HallSaveRequest>> violations = validator.validate(req, ValidationGroups.Update.class);
        assertTrue(violations.isEmpty());
    }

    @Test
    void activityCreate_requiresTitle() {
        ActivitySaveRequest req = new ActivitySaveRequest();
        Set<ConstraintViolation<ActivitySaveRequest>> violations = validator.validate(req, ValidationGroups.Create.class);
        assertFalse(violations.isEmpty());
    }

    @Test
    void courseCreate_requiresName() {
        CourseSaveRequest req = new CourseSaveRequest();
        Set<ConstraintViolation<CourseSaveRequest>> violations = validator.validate(req, ValidationGroups.Create.class);
        assertFalse(violations.isEmpty());
    }

    @Test
    void resourceCreate_requiresCoreFields() {
        ResourceSaveRequest req = new ResourceSaveRequest();
        Set<ConstraintViolation<ResourceSaveRequest>> violations = validator.validate(req, ValidationGroups.Create.class);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("name")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("fileUrl")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("fileType")));
    }

    @Test
    void adminUserCreate_requiresUsernameAndRole() {
        AdminUserSaveRequest req = new AdminUserSaveRequest();
        Set<ConstraintViolation<AdminUserSaveRequest>> violations = validator.validate(req, ValidationGroups.Create.class);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("username")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("roleId")));
    }

    @Test
    void adminUserUpdate_allowsPasswordOmitted() {
        AdminUserSaveRequest req = new AdminUserSaveRequest();
        req.setUsername("ops01");
        req.setRoleId(2L);
        Set<ConstraintViolation<AdminUserSaveRequest>> violations = validator.validate(req, ValidationGroups.Update.class);
        assertTrue(violations.isEmpty());
    }
}
