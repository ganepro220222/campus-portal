package com.shuyuan.backend.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("course_resource")
public class CourseResource {

    private Long courseId;
    private Long resourceId;
    private Integer sort;
}
