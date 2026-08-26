package com.shuyuan.backend.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.mockito.ArgumentCaptor;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 针对 LambdaUpdateWrapper 的断言工具。
 *
 * <p>为什么不直接 {@code verify(mapper).updateById(...)} 了事：MyBatis-Plus 的 updateStrategy
 * 默认是 NOT_NULL，{@code setXxx(null)} + updateById 里那一列根本不会进 SET 子句。
 * 「mapper 被调用过」是真的，「字段被清空了」是假的——只有校验 SET 子句文本才拦得住这类回归。
 *
 * <p>所以凡是需要把列写成 NULL 的地方，生产代码一律走 LambdaUpdateWrapper，
 * 测试一律用这里的 {@link #assertSetsColumn} 断言到列级。
 */
final class UpdateWrapperAssertions {

    private UpdateWrapperAssertions() {
    }

    /**
     * 初始化实体的 TableInfo 缓存。
     *
     * <p>LambdaUpdateWrapper 解析 {@code Entity::getXxx} 方法引用要靠这份缓存，
     * 正常由 MyBatis 启动时注册；纯 Mockito 单测没有 MyBatis 上下文，必须手动初始化，
     * 否则会抛 “can not find lambda cache for this entity”。
     */
    static void initEntityCache(Class<?>... entities) {
        for (Class<?> entity : entities) {
            TableInfoHelper.initTableInfo(
                    new MapperBuilderAssistant(new MybatisConfiguration(), entity.getName()), entity);
        }
    }

    /** 抓取传给 {@code mapper.update(null, wrapper)} 的 wrapper */
    @SuppressWarnings("unchecked")
    static <T> ArgumentCaptor<LambdaUpdateWrapper<T>> updateCaptor() {
        return (ArgumentCaptor<LambdaUpdateWrapper<T>>) (ArgumentCaptor<?>)
                ArgumentCaptor.forClass(LambdaUpdateWrapper.class);
    }

    /**
     * 断言 SET 子句里确实有这一列，且绑定值符合预期（{@code expected} 传 null 即断言写 NULL）。
     *
     * <p>SET 子句形如 {@code student_no=#{ew.paramNameValuePairs.MPGENVAL2}}，
     * 真实值要回查 paramNameValuePairs——NULL 同样登记在里面，所以能区分
     * 「这一列绑了 NULL」和「这一列压根没进 SET」。
     */
    static void assertSetsColumn(LambdaUpdateWrapper<?> wrapper, String column, Object expected) {
        String key = requireBoundKey(wrapper, column);
        Map<String, Object> params = wrapper.getParamNameValuePairs();
        assertTrue(params.containsKey(key), "参数表缺少 " + key);
        if (expected == null) {
            assertNull(params.get(key), "列 " + column + " 应绑定 NULL，实际是 " + params.get(key));
        } else {
            assertEquals(expected, params.get(key), "列 " + column + " 绑定值不符");
        }
    }

    /** 取 SET 子句里某一列实际绑定的值（列不在 SET 子句里会直接断言失败） */
    static Object boundValue(LambdaUpdateWrapper<?> wrapper, String column) {
        return wrapper.getParamNameValuePairs().get(requireBoundKey(wrapper, column));
    }

    /** 断言某列被写入了非 NULL 值（不关心具体值，如时间戳） */
    static void assertSetsNonNullColumn(LambdaUpdateWrapper<?> wrapper, String column) {
        assertNotNull(boundValue(wrapper, column), "列 " + column + " 应写入非 NULL 值");
    }

    /** 断言 SET 子句里没有这一列（用于确认某字段被刻意保留、不做改动） */
    static void assertDoesNotSetColumn(LambdaUpdateWrapper<?> wrapper, String column) {
        String sqlSet = wrapper.getSqlSet();
        assertFalse(sqlSet != null && sqlSet.contains(column + "="),
                "SET 子句不该包含列 " + column + "：" + sqlSet);
    }

    private static String requireBoundKey(LambdaUpdateWrapper<?> wrapper, String column) {
        String sqlSet = wrapper.getSqlSet();
        assertTrue(sqlSet != null && sqlSet.contains(column + "="),
                "SET 子句缺少列 " + column + "：" + sqlSet);
        String marker = column + "=#{ew.paramNameValuePairs.";
        int start = sqlSet.indexOf(marker);
        assertTrue(start >= 0, "列 " + column + " 不是参数绑定形式：" + sqlSet);
        start += marker.length();
        return sqlSet.substring(start, sqlSet.indexOf('}', start));
    }
}
