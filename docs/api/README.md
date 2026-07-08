# 接口文档（OpenAPI）

> 对照《工程化与准生产增强方案 V1.1》E2-4、《交付物与验收标准 V1.2》§一 交付物 §5

## 1. 访问方式

后端启动后（profile 为 `dev` / `docker` / `staging`，**非 prod**）：

| 用途 | 地址 |
|------|------|
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON（全量） | http://localhost:8080/v3/api-docs |
| 小程序 API 分组 | http://localhost:8080/v3/api-docs/miniapp |
| 管理后台 API 分组 | http://localhost:8080/v3/api-docs/admin |

生产环境（`application-prod`）默认 **关闭** Swagger，避免对外暴露接口结构。需要文档时从 staging 导出或 CI 产物获取。

## 2. 鉴权说明

需登录接口在 Swagger UI 右上角 **Authorize** 填入：

```
Bearer <token>
```

- 小程序 token：`POST /api/v1/auth/account-login` 或 `wx-login` 返回
- 管理端 token：`POST /api/v1/admin/auth/login` 返回

## 3. 导入 Apifox

1. 打开 Apifox → 导入 → OpenAPI
2. 填入 URL：`http://localhost:8080/v3/api-docs`（或下载 JSON 后本地导入）
3. 建议创建三个环境变量：`baseUrl`、`memberToken`、`adminToken`

## 4. 导出静态 JSON（归档用）

```bash
curl -s http://localhost:8080/v3/api-docs > openapi.json
curl -s http://localhost:8080/v3/api-docs/miniapp > openapi-miniapp.json
curl -s http://localhost:8080/v3/api-docs/admin > openapi-admin.json
```

交付前可在 staging 执行上述命令，将 JSON 附在测试报告或交付包中。

## 5. 维护约定

- 新增 Controller 后无需额外注解即可出现在文档中（SpringDoc 自动扫描）
- Controller 已标注 `@Tag(name = "中文模块名")`，Swagger UI 分组显示中文
- 变更路径或 breaking change 须同步更新 Apifox 回归集
- 统一响应格式：`{ "code": 200, "message": "success", "data": {} }`
