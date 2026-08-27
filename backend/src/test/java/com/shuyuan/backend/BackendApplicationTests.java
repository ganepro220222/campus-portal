package com.shuyuan.backend;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * 全量上下文加载测试：依赖 MySQL/Redis，CI 当前未提供这两项服务故保持 @Disabled。
 * Mockito 单测不能替代 Bean 扫描与构造器依赖解析；构造器循环见 check-spring-bean-cycles。
 * 本地有 Docker 环境时可去掉 @Disabled 验证。
 */
@SpringBootTest
@Disabled("需 MySQL/Redis，见 EnrollServiceTest / Controller IT")
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
