package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.shuyuan.backend.entity.KnowledgeChunk;
import com.shuyuan.backend.entity.KnowledgeDoc;
import com.shuyuan.backend.mapper.KnowledgeChunkMapper;
import com.shuyuan.backend.mapper.KnowledgeDocMapper;
import com.shuyuan.backend.util.TextChunker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * 内置知识库真的能被检索到吗？——拿真正的检索实现跑真正的内置文本。
 *
 * <p>这个测试有两个不能少的方向，缺一个都会留下坑：
 * <ul>
 *   <li><b>该命中的要命中</b>：内置的是「小程序怎么用」，学生问「怎么报名」「积分怎么来的」
 *       就必须能捞到对应那篇。捞不到，等于知识库白写。</li>
 *   <li><b>不该命中的要落空</b>：检索用的是 2–4 字的字符 n-gram，只要有一个 gram 重合
 *       score 就大于 0。语料一多，什么问题都能「命中」一点垃圾片段——那样
 *       「无命中不计次数」这条规则就永远不会触发，写了等于没写。</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BuiltinKnowledgeRetrievalTest {

    /** 测试工作目录是 backend/，源文件在仓库根的 sql/knowledge */
    private static final Path SRC_DIR = Path.of("..", "sql", "knowledge");

    @Mock
    private KnowledgeDocMapper knowledgeDocMapper;
    @Mock
    private KnowledgeChunkMapper knowledgeChunkMapper;
    @Mock
    private AdminPermissionService adminPermissionService;
    @Mock
    private OssMediaCleanupService ossMediaCleanupService;

    private KnowledgeService knowledgeService;
    /** chunkIndex 起始位置 -> 文档标题，用于断言命中了哪一篇 */
    private final List<String> chunkOwner = new ArrayList<>();

    @BeforeEach
    void setUp() {
        knowledgeService = new KnowledgeService(
                knowledgeDocMapper, knowledgeChunkMapper, adminPermissionService, ossMediaCleanupService);

        List<KnowledgeDoc> docs = new ArrayList<>();
        List<KnowledgeChunk> chunks = new ArrayList<>();
        long docId = 0;
        long chunkId = 0;

        try (Stream<Path> files = Files.list(SRC_DIR)) {
            List<Path> sorted = files.filter(p -> p.getFileName().toString().endsWith(".md")).sorted().toList();
            assertFalse(sorted.isEmpty(), "sql/knowledge 下没有 .md 源文件");
            for (Path file : sorted) {
                docId++;
                String raw = Files.readString(file, StandardCharsets.UTF_8).replace("\r\n", "\n");
                // 标题取正文首行的「# 」，不取文件名：Java 按 sun.jnu.encoding 读目录项，
                // 服务器上是 POSIX locale 时中文文件名会静默读成乱码
                int nl = raw.indexOf('\n');
                assertTrue(nl > 0 && raw.startsWith("# "), file + " 首行必须是「# 标题」");
                String title = raw.substring(2, nl).trim();
                String content = raw.substring(nl + 1).trim();

                KnowledgeDoc doc = new KnowledgeDoc();
                doc.setId(docId);
                doc.setTitle(title);
                doc.setStatus("ready");
                docs.add(doc);

                // 用真正的 TextChunker，和 patch-builtin-knowledge.sql 的生成口径一致
                for (String part : TextChunker.split(content)) {
                    KnowledgeChunk chunk = new KnowledgeChunk();
                    chunk.setId(++chunkId);
                    chunk.setDocId(docId);
                    chunk.setChunkText(part);
                    chunk.setChunkIndex(chunkOwner.size());
                    chunk.setKeywords(part.substring(0, Math.min(80, part.length())));
                    chunks.add(chunk);
                    chunkOwner.add(title);
                }
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }

        when(knowledgeDocMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(docs);
        when(knowledgeDocMapper.selectBatchIds(any())).thenReturn(docs);
        when(knowledgeChunkMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(chunks);
    }

    private List<KnowledgeChunk> ask(String question) {
        return knowledgeService.retrieve(question, 5);
    }

    /**
     * 检索命中的全部文档标题（按分数从高到低）。
     *
     * <p>断言用「在不在 Top-K 里」而不是「排不排第一」：模型拿到的是 Top-5 全部片段，
     * 排第几并不决定它能不能答上来。而且同一个事实可能同时写在两篇里——
     * 「展馆有多少个」排第一的是《小程序总览》，那篇里确实写了「共有 11 个展馆」，
     * 强求它排在《动态展馆与搜索》后面只是在迁就断言。
     */
    private List<String> hitDocTitles(String question) {
        List<KnowledgeChunk> hits = ask(question);
        assertFalse(hits.isEmpty(), "「" + question + "」什么也没检索到");
        return hits.stream().map(c -> chunkOwner.get(c.getChunkIndex())).toList();
    }

    // ---------- 该命中的 ----------

    @Test
    void 学生最常问的使用问题都能命中对应那篇() {
        record Case(String question, String expectDocKeyword) {}
        List<Case> cases = List.of(
                new Case("怎么报名活动", "活动报名"),
                new Case("怎么参加活动", "活动报名"),
                new Case("报名之后可以取消吗", "活动报名"),
                new Case("名额满了还能报名吗", "活动报名"),
                new Case("积分怎么获得", "积分与徽章"),
                new Case("为什么我的积分没有增加", "积分与徽章"),
                new Case("徽章怎么解锁", "积分与徽章"),
                new Case("忘记密码怎么办", "登录与账号"),
                new Case("怎么登录", "登录与账号"),
                new Case("学号可以绑定几个微信", "登录与账号"),
                new Case("怎么解绑微信", "登录与账号"),
                new Case("微信能解绑吗", "登录与账号"),
                new Case("解绑", "登录与账号"),
                new Case("积分", "积分与徽章"),
                new Case("收藏", "动态展馆与搜索"),
                new Case("密码", "登录与账号"),
                new Case("字幕", "课程与学习资源"),
                new Case("能取消吗", "活动报名"),
                new Case("换手机了怎么办", "登录与账号"),
                new Case("微信掉了怎么办", "登录与账号"),
                new Case("课程看到多少算完成", "课程与学习资源"),
                new Case("学习资源在哪里下载", "课程与学习资源"),
                new Case("怎么收藏一篇动态", "动态展馆与搜索"),
                new Case("展馆有多少个", "动态展馆与搜索"),
                new Case("消息中心在哪里", "个人中心与消息"),
                new Case("怎么看未读消息", "个人中心与消息"),
                new Case("首页铃铛为什么有红点", "个人中心与消息"),
                new Case("怎么提交意见反馈", "个人中心与消息"),
                new Case("反馈历史在哪里", "个人中心与消息"),
                new Case("在哪里查看反馈处理进度", "个人中心与消息"),
                new Case("书院助手每天能问多少次", "知识问答使用说明"),
                new Case("这个小程序有什么功能", "小程序总览"),
                new Case("牙舟陶怎么参观", "牙舟陶数字展厅"),
                new Case("交通博物馆是什么", "交通博物馆与校史馆"),
                new Case("哪些展馆没有全景", "线上展馆导览"));

        List<String> wrong = new ArrayList<>();
        for (Case c : cases) {
            List<String> actual = hitDocTitles(c.question());
            if (actual.stream().noneMatch(t -> t.contains(c.expectDocKeyword()))) {
                wrong.add("「" + c.question() + "」检索到的是" + actual + "，期望其中包含《" + c.expectDocKeyword() + "》");
            }
        }
        assertTrue(wrong.isEmpty(), String.join("\n", wrong));
    }

    /**
     * 命中哪一篇不够：学生看到的是 pickBest 那一段原文。
     * 消息/反馈这类导航问题必须把人领到「我的」，不能再把首页铃铛说成站内消息。
     */
    @Test
    void 消息与反馈摘录必须符合真实入口() {
        record Expect(String question, String mustContain, String mustNotContain) {}
        List<Expect> cases = List.of(
                new Expect("消息中心在哪里", "我的", "未读消息时会显示红点"),
                new Expect("怎么看未读消息", "消息中心", "首页右上角的铃铛图标有未读消息"),
                new Expect("首页铃铛为什么有红点", "动态", "消息中心入口"),
                new Expect("怎么提交意见反馈", "反馈历史", "不展示反馈历史"),
                new Expect("反馈历史在哪里", "反馈历史", "不展示反馈历史"));

        List<String> wrong = new ArrayList<>();
        for (Expect c : cases) {
            assertTrue(substantial(c.question()), "「" + c.question() + "」应算实质命中");
            KnowledgeChunk best = knowledgeService.pickBest(c.question(), ask(c.question()));
            String text = best == null || best.getChunkText() == null ? "" : best.getChunkText();
            if (!text.contains(c.mustContain())) {
                wrong.add("「" + c.question() + "」摘录未包含「" + c.mustContain() + "」：" + text);
            }
            if (text.contains(c.mustNotContain())) {
                wrong.add("「" + c.question() + "」摘录仍含错误指引「" + c.mustNotContain() + "」");
            }
        }
        assertTrue(wrong.isEmpty(), String.join("\n", wrong));
    }

    @Test
    void 解绑问法能命中登录篇并且说明不能自己解绑() {
        for (String q : List.of("微信能解绑吗", "解绑", "怎么解绑微信")) {
            assertTrue(substantial(q), "「" + q + "」应算实质命中");
            KnowledgeChunk best = knowledgeService.pickBest(q, ask(q));
            assertTrue(chunkOwner.get(best.getChunkIndex()).contains("登录与账号"),
                    "「" + q + "」应选中《登录与账号》，实际是《" + chunkOwner.get(best.getChunkIndex()) + "》");
            String text = best.getChunkText();
            assertTrue(text.contains("解绑"), "「" + q + "」摘录应谈到解绑");
            assertTrue(text.contains("管理员") || text.contains("不能"),
                    "「" + q + "」摘录应说明找管理员或不能自己解绑：" + text);
        }
    }

    @Test
    void 短词和口语问法要选对篇不能答偏() {
        record Case(String question, String expectDoc, String mustContain) {}
        List<Case> cases = List.of(
                new Case("积分", "积分与徽章", "积分"),
                new Case("收藏", "动态展馆与搜索", "收藏"),
                new Case("密码", "登录与账号", "密码"),
                new Case("字幕", "课程与学习资源", "字幕"),
                new Case("能取消吗", "活动报名", "取消"),
                new Case("点赞", "动态展馆与搜索", "点赞"),
                new Case("下载", "课程与学习资源", "下载"),
                new Case("铃铛", "个人中心与消息", "铃铛"),
                new Case("换手机了怎么办", "登录与账号", "换手机"),
                new Case("微信掉了怎么办", "登录与账号", "微信"));
        List<String> wrong = new ArrayList<>();
        for (Case c : cases) {
            if (!substantial(c.question())) {
                wrong.add("「" + c.question() + "」应算实质命中");
                continue;
            }
            KnowledgeChunk best = knowledgeService.pickBest(c.question(), ask(c.question()));
            String owner = chunkOwner.get(best.getChunkIndex());
            if (!owner.contains(c.expectDoc())) {
                wrong.add("「" + c.question() + "」选中《" + owner + "》，期望《" + c.expectDoc() + "》");
            }
            if (best.getChunkText() == null || !best.getChunkText().contains(c.mustContain())) {
                wrong.add("「" + c.question() + "」摘录未包含「" + c.mustContain() + "」");
            }
        }
        assertTrue(wrong.isEmpty(), String.join("\n", wrong));
    }

    @Test
    void 参加能扩到报名并选中活动篇() {
        String q = "怎么参加活动";
        assertTrue(substantial(q), "「怎么参加活动」应算实质命中");
        KnowledgeChunk best = knowledgeService.pickBest(q, ask(q));
        assertTrue(chunkOwner.get(best.getChunkIndex()).contains("活动报名"),
                "应选中《活动报名》，实际是《" + chunkOwner.get(best.getChunkIndex()) + "》");
    }

    // ---------- 不该命中的 ----------

    /**
     * 这一组决定了「检索无命中就不计次数」是不是一条活规则。
     *
     * <p>如果这些问题也能捞到片段，说明 n-gram 太松、判定永远不触发；
     * 那就不能只靠 chunks.isEmpty()，得另想办法（比如加最低命中分）。
     */
    /**
     * 把命中分数分布落到 target/kb-retrieval-scores.txt，供人工核对阈值是否还站得住。
     *
     * <p>阈值是从这份数据里读出来的，不是拍脑袋定的；日后改了语料或改了分词，
     * 重跑这个用例看一眼分布，比盯着一个魔数猜要可靠。
     * （不用 System.out：surefire 默认把测试标准输出吞掉，打了也看不见。）
     */
    @Test
    void 导出命中分数分布供人工核对() throws IOException {
        List<String> onTopic = List.of("怎么报名活动", "积分怎么获得", "忘记密码怎么办",
                "课程看到多少算完成", "展馆有多少个", "书院助手每天能问多少次", "怎么收藏一篇动态");
        List<String> offTopic = List.of("比利时的首都在哪", "美国的首都是哪里", "帮我写一段冒泡排序",
                "明天天气怎么样", "一加一等于几", "推荐几部科幻电影", "今天股市怎么样");

        /*
         * 泛化检验：这一组的措辞刻意不出现在语料的「常见问法」里。
         * 用调过内容的那批问题去验证阈值等于自证，必须另留一组没碰过的。
         */
        List<String> holdoutOn = List.of(
                "报名成功之后去哪里看凭证码",
                "我想退掉已经报名的活动",
                "视频看完了但是没有显示完成",
                "手机上怎么把资料保存下来",
                "提示学号已经绑定了别的微信",
                "书院一共有几个线上展厅",
                "有没有办法把内容发给同学",
                "刚注册的账号第一次进要做什么");
        List<String> holdoutOff = List.of(
                "怎么做红烧肉",
                "帮我翻译一句英文",
                "今天是星期几",
                "介绍一下量子力学",
                "我心情不好怎么办",
                "附近有什么好吃的");

        StringBuilder sb = new StringBuilder("=== 相关问题（应保留） ===\n");
        for (String q : onTopic) {
            sb.append("  ").append(q).append(" -> ").append(scoreLine(q)).append('\n');
        }
        sb.append("=== 无关问题（应滤掉） ===\n");
        for (String q : offTopic) {
            sb.append("  ").append(q).append(" -> ").append(scoreLine(q)).append('\n');
        }
        sb.append("=== 泛化检验·相关（措辞未调过） ===\n");
        for (String q : holdoutOn) {
            sb.append("  ").append(q).append(" -> ").append(scoreLine(q)).append('\n');
        }
        sb.append("=== 泛化检验·无关（措辞未调过） ===\n");
        for (String q : holdoutOff) {
            sb.append("  ").append(q).append(" -> ").append(scoreLine(q)).append('\n');
        }
        Path out = Path.of("target", "kb-retrieval-scores.txt");
        Files.createDirectories(out.getParent());
        Files.writeString(out, sb.toString(), StandardCharsets.UTF_8);
    }

    private String scoreLine(String q) {
        List<KnowledgeChunk> hits = ask(q);
        if (hits.isEmpty()) {
            return "无命中";
        }
        StringBuilder sb = new StringBuilder();
        int bestWeighted = 0;
        for (KnowledgeChunk c : hits) {
            bestWeighted = Math.max(bestWeighted, knowledgeService.weightedScore(c, tokensOf(q)));
        }
        sb.append("命中 ").append(hits.size()).append(" 段，原始最高分 ").append(hits.get(0).getScore())
                .append("，加权最高分 ").append(bestWeighted);
        return sb.toString();
    }

    /** 借检索本身的分词口径；这里只要一个与实现一致的查询词集合 */
    private java.util.Set<String> tokensOf(String q) {
        try {
            var m = KnowledgeService.class.getDeclaredMethod("queryTokens", String.class);
            m.setAccessible(true);
            @SuppressWarnings("unchecked")
            java.util.Set<String> tokens = (java.util.Set<String>) m.invoke(knowledgeService, q);
            return tokens;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }

    /** 与 application.yaml 的 shuyuan.ai.min-relevance-score 保持一致 */
    private static final int MIN_RELEVANCE = 4;

    private boolean substantial(String q) {
        return knowledgeService.hasSubstantialMatch(q, ask(q), MIN_RELEVANCE);
    }

    /**
     * 去壳之后，「比利时的首都在哪」不再靠「在哪」蹭到使用说明。
     * 捞没捞到片段都可以，但不能当成实质命中。
     */
    @Test
    void 完全无关的问题不能当成实质命中() {
        assertFalse(substantial("比利时的首都在哪"));
    }

    /**
     * 无关问题一律不算实质命中——「不扣次数」的闸门就架在这里。
     *
     * <p>这一组必须零漏网：漏一个，用户就要为一句「没有找到相关资料」付掉一次额度。
     */
    @Test
    void 与书院无关的问题都不算实质命中() {
        List<String> offTopic = List.of(
                "比利时的首都在哪", "美国的首都是哪里", "帮我写一段冒泡排序",
                "明天天气怎么样", "一加一等于几", "推荐几部科幻电影", "今天股市怎么样",
                // 以下措辞刻意没在语料里出现过，用来检验判定不是只对调过的问题有效
                "怎么做红烧肉", "帮我翻译一句英文", "今天是星期几",
                "介绍一下量子力学", "我心情不好怎么办", "附近有什么好吃的");

        List<String> leaked = new ArrayList<>();
        for (String q : offTopic) {
            if (substantial(q)) {
                leaked.add(q);
            }
        }
        assertTrue(leaked.isEmpty(),
                "以下无关问题被判成了实质命中，用户会被白扣一次：\n" + String.join("\n", leaked));
    }

    /** 真问题要能判成实质命中，否则「不扣次数」会退化成「几乎都不扣」，限流形同虚设 */
    @Test
    void 常见的真实问题都算实质命中() {
        List<String> real = List.of(
                "怎么报名活动", "怎么参加活动", "积分怎么获得", "忘记密码怎么办", "微信能解绑吗", "积分", "字幕", "课程看到多少算完成",
                "展馆有多少个", "书院助手每天能问多少次", "怎么收藏一篇动态",
                "牙舟陶怎么参观", "交通博物馆是什么",
                // 以下措辞未在语料里出现过
                "报名成功之后去哪里看凭证码", "我想退掉已经报名的活动", "视频看完了但是没有显示完成",
                "提示学号已经绑定了别的微信", "书院一共有几个线上展厅",
                "有没有办法把内容发给同学", "刚注册的账号第一次进要做什么");

        List<String> missed = new ArrayList<>();
        for (String q : real) {
            if (!substantial(q)) {
                missed.add(q);
            }
        }
        assertTrue(missed.isEmpty(), "以下真实问题没被判成实质命中：\n" + String.join("\n", missed));
    }

    @Test
    void 把资料保存下来应落到学习资源() {
        String q = "手机上怎么把资料保存下来";
        assertTrue(substantial(q), "「保存资料」应能对上学习资源下载");
        KnowledgeChunk best = knowledgeService.pickBest(q, ask(q));
        assertTrue(chunkOwner.get(best.getChunkIndex()).contains("课程与学习资源"),
                "应选中《课程与学习资源》，实际是《" + chunkOwner.get(best.getChunkIndex()) + "》");
    }
}
