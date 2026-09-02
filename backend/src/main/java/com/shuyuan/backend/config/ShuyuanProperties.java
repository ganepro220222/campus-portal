package com.shuyuan.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "shuyuan")
public class ShuyuanProperties {

    private Jwt jwt = new Jwt();
    private Wx wx = new Wx();
    private Login login = new Login();
    private RateLimit rateLimit = new RateLimit();
    private Ai ai = new Ai();
    private Subscribe subscribe = new Subscribe();
    private Alert alert = new Alert();
    private Cors cors = new Cors();
    private Security security = new Security();
    private Asr asr = new Asr();
    private Retention retention = new Retention();

    @Data
    public static class Login {
        /** 连续失败多少次后锁定 */
        private int maxFailAttempts = 5;
        /** 锁定时长（分钟） */
        private int lockMinutes = 5;
        /** 失败计数窗口（分钟），超时未再失败则清零 */
        private int failWindowMinutes = 15;
    }

    @Data
    public static class Jwt {
        private String secret = "shuyuan-dev-jwt-secret";
        /** 小程序会员 Token 有效期（天） */
        private int expireDays = 7;
        /** 管理后台 Token 有效期（小时），默认 8 小时 */
        private int adminExpireHours = 8;
    }

    @Data
    public static class Wx {
        /** 开发模式：不调微信接口，code 直接换 token */
        private boolean devMode = true;
        private String appid = "";
        private String secret = "";
        /** 小程序码内存缓存最大条数 */
        private int wxacodeCacheMaxEntries = 64;
        /** 小程序码缓存 TTL（秒） */
        private int wxacodeCacheTtlSeconds = 3600;
    }

    /** 接口限流（Redis 固定窗口，E2-3） */
    @Data
    public static class RateLimit {
        private boolean enabled = true;
        /** 学号/账号登录：每 IP 每分钟 */
        private int loginPerMinute = 10;
        /** 微信登录：每 IP 每分钟 */
        private int wxLoginPerMinute = 20;
        /** 管理端登录：每 IP 每分钟 */
        private int adminLoginPerMinute = 10;
        /** 活动报名：每用户每分钟 */
        private int enrollPerMinute = 5;
        /** AI 问答（预留）：每用户每天 */
        private int aiPerDay = 20;
        /** 公开小程序码：每 IP 每分钟 */
        private int wxacodePerMinute = 30;
        /** 课程进度上报：每用户每分钟 */
        private int progressPerMinute = 60;
        /** 课程完成积分：每用户每小时最多完成门数（超出仍记完成但不发分） */
        private int courseCompletePerHour = 5;
        /** 意见反馈：每用户每分钟 */
        private int feedbackPerMinute = 3;
        /** 意见反馈：每用户每自然日 */
        private int feedbackPerDay = 20;
    }

    /** AI 问答（Phase 7） */
    @Data
    public static class Ai {
        /** fallback=无 Key 时基于知识库片段作答；zhipu=智谱 GLM */
        private String provider = "fallback";
        private String apiKey = "";
        private String baseUrl = "https://open.bigmodel.cn/api/paas/v4";
        private String model = "glm-4.5-flash";
        private int dailyLimit = 20;
        private int maxChunks = 5;
        /**
         * 判定「这次检索到的资料够不够回答」的加权分下限，只影响要不要扣用户次数，
         * 不影响是否回答与回答内容。取值依据见 BuiltinKnowledgeRetrievalTest 导出的分数分布。
         */
        private int minRelevanceScore = 4;
    }

    /** 微信订阅消息模板（生产环境在公众平台申请后填入） */
    @Data
    public static class Subscribe {
        private String enrollSuccessTemplateId = "";
        private String enrollApprovedTemplateId = "";
        private String activityRemindTemplateId = "";
        /** 公众平台模板关键词 field 名（因选用关键词不同须与后台「我的模板」一致） */
        private SubscribeTemplateFields enrollSuccessFields = SubscribeTemplateFields.enrollSuccessDefaults();
        private SubscribeTemplateFields enrollApprovedFields = SubscribeTemplateFields.enrollApprovedDefaults();
        private SubscribeTemplateFields activityRemindFields = SubscribeTemplateFields.activityRemindDefaults();
        /** 发件箱每轮最大处理条数 */
        private int outboxBatchSize = 50;
        /** 发件箱最大重试次数 */
        private int outboxMaxAttempts = 10;
        /** processing 超时（分钟）后重置为 pending */
        private int outboxStaleMinutes = 5;
        /** 重试退避基数（秒） */
        private int outboxRetryBaseSeconds = 30;
    }

    /** 订阅消息模板字段 key（对应微信 data 里的 key） */
    @Data
    public static class SubscribeTemplateFields {
        private String title = "thing1";
        private String startTime = "time3";
        private String phrase = "";

        static SubscribeTemplateFields enrollSuccessDefaults() {
            SubscribeTemplateFields f = new SubscribeTemplateFields();
            f.setTitle("thing1");
            f.setStartTime("time3");
            return f;
        }

        static SubscribeTemplateFields enrollApprovedDefaults() {
            SubscribeTemplateFields f = new SubscribeTemplateFields();
            f.setPhrase("phrase1");
            f.setTitle("thing8");
            f.setStartTime("time11");
            return f;
        }

        static SubscribeTemplateFields activityRemindDefaults() {
            SubscribeTemplateFields f = new SubscribeTemplateFields();
            f.setTitle("thing1");
            f.setPhrase("phrase2");
            f.setStartTime("time4");
            return f;
        }
    }

    /** E2-1 低成本告警：钉钉 / 企业微信 Webhook */
    @Data
    public static class Alert {
        /** 默认关闭；staging/prod 配置 webhook 后开启 */
        private boolean enabled = false;
        private String webhookUrl = "";
        /** 错误率统计窗口（分钟），与定时任务周期一致 */
        private int windowMinutes = 5;
        /** 5xx 错误率阈值（百分比） */
        private double errorRatePercent = 1.0;
        /** 窗口内最少请求数，低于此值不告警（避免低流量误报） */
        private int minSampleSize = 20;
        /** 同类告警冷却时间（分钟） */
        private int cooldownMinutes = 15;
    }

    /** staging/prod CORS 白名单（dev 仍允许 *） */
    @Data
    public static class Cors {
        private java.util.List<String> allowedOriginPatterns = java.util.List.of();
    }

    /** 反代与客户端 IP 解析 */
    @Data
    public static class Security {
        /** 为 true 且 remoteAddr 属于 trustedProxies 时才读取转发头 */
        private boolean trustForwardedHeaders = false;
        private java.util.List<String> trustedProxies = java.util.List.of(
                "127.0.0.1",
                "::1",
                "10.0.0.0/8",
                "172.16.0.0/12",
                "192.168.0.0/16");
    }

    /** 课程字幕 ASR（阿里云录音文件识别） */
    @Data
    public static class Asr {
        /** none | aliyun */
        private String provider = "none";
        private String accessKeyId = "";
        private String accessKeySecret = "";
        private String appKey = "";
        private String region = "cn-shanghai";
        /** 每轮 ASR 轮询最大任务数 */
        private int pollBatchSize = 50;
        /** processing 超时（小时）后自动 failed */
        private int pollTimeoutHours = 24;
    }

    /**
     * 日志类数据保留策略。
     *
     * <p>这三张表此前只写不删，会一直长到把库撑满；其中 event_log 是学生端每次浏览/点赞/
     * 收藏/分享/下载/报名/播放都写一行，是主要增长源。明细的统计价值在 StatsDailyJob
     * 每日聚合进 stat_daily 之后就基本用尽了，超过保留期的行只占地方。
     *
     * <p>天数设 0 或负数 = 该表不清理（留给甲方按合规要求自行放开）。
     */
    @Data
    public static class Retention {
        /** 总开关：关掉后清理任务只记日志不删数据 */
        private boolean enabled = true;
        /** 行为事件日志保留天数；明细已聚合进 stat_daily，季度环比够用 */
        private int eventLogDays = 90;
        /** 后台操作日志保留天数；有审计属性且量小，默认留一年 */
        private int sysLogDays = 365;
        /** 发件箱已发送成功记录保留天数；成功的没有排查价值 */
        private int outboxSentDays = 30;
        /** 发件箱失败/跳过记录保留天数；要留着追溯「为什么没收到通知」 */
        private int outboxFailedDays = 180;
        /** 单条 DELETE 的行数上限，避免长事务锁表 */
        private int batchSize = 1000;
        /** 单表单轮最多删几批，防止一次运行无限占用数据库 */
        private int maxBatchesPerRun = 200;
    }
}
