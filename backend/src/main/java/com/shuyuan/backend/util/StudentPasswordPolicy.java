package com.shuyuan.backend.util;

import com.shuyuan.backend.common.exception.BusinessException;

/** 师生导入初始密码：优先身份证后 6 位，否则学号后 6 位 */
public final class StudentPasswordPolicy {

    private StudentPasswordPolicy() {
    }

    public static String resolveInitialPassword(String studentNo, String idCard) {
        String id = MemberNoRule.normalize(idCard);
        if (id != null && !id.isEmpty()) {
            String problem = idCardProblem(id);
            if (problem != null) {
                throw new BusinessException(400, problem);
            }
            return extractIdCardSuffix(id);
        }
        if (studentNo == null || studentNo.isBlank()) {
            throw new BusinessException(400, "学号不能为空，无法生成初始密码");
        }
        /*
         * 优先取纯数字后 6 位；数字不够 6 位时，回退到「字母数字」清洗后的整串。
         *
         * <p>原来的回退条件是「一个数字都没有」，于是同样 6 位的学号，纯字母的 ABCDEF 能用，
         * 含 1–5 个数字的 AB1234 反而被拒——数字被单独拎出来只剩 4 位，又不肯退回整串。
         * 教师工号常是字母加数字的混合格式，这一条会直接把整批人挡在导入之外。
         */
        String digits = studentNo.replaceAll("\\D", "");
        String source = digits.length() >= 6 ? digits : studentNo.replaceAll("[^A-Za-z0-9]", "");
        if (source.length() < 6) {
            throw new BusinessException(400, "学号过短且未提供身份证号，无法生成初始密码");
        }
        return source.substring(source.length() - 6);
    }

    private static final int[] ID_WEIGHTS = {7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2};
    private static final String ID_CHECK = "10X98765432";

    /**
     * 身份证号按 GB 11643 核校验位；合格返回 null。
     *
     * <p>身份证列在 Excel 里是数字格式时只留 15 位有效数字，末 3 位变成 000，
     * 算出的初始密码是错的，导入也不报错，学生拿真号后 6 位登不上。
     * 校验位只能拦下约 10/11，剩下的会悄悄导进去，所以末 3 位是 000 的单独拦。
     * 原因里不写号码本身：身份证号不入库，也不该出现在失败明细里。
     */
    static String idCardProblem(String id) {
        String v = id.toUpperCase();
        if (v.matches("\\d(\\.\\d+)?E[+-]?\\d+")) {
            return "身份证号被 Excel 改成了科学计数法，后几位已经丢了。"
                    + "把身份证列设为文本格式，重新粘贴原始号码；没有身份证的留空";
        }
        if (!v.matches("\\d{17}[\\dX]")) {
            return "身份证号应为 18 位（末位可以是 X）。没有身份证的留空，会改用学号 / 工号后 6 位";
        }
        if (v.endsWith("000")) {
            return "身份证号末 3 位是 000，多半是 Excel 当成数字截掉了。把身份证列设为文本格式，重新粘贴原始号码；"
                    + "核对原件确实是 000 的，这一格留空，改用学号 / 工号后 6 位";
        }
        int sum = 0;
        for (int i = 0; i < 17; i++) {
            sum += (v.charAt(i) - '0') * ID_WEIGHTS[i];
        }
        if (ID_CHECK.charAt(sum % 11) != v.charAt(17)) {
            return "身份证号校验位不对，可能抄错了，请核对原件。没有身份证的留空";
        }
        return null;
    }

    static String extractIdCardSuffix(String idCard) {
        if (idCard == null || idCard.isBlank()) {
            return null;
        }
        String normalized = idCard.trim().toUpperCase();
        String digits = normalized.replaceAll("[^0-9X]", "");
        if (digits.length() < 6) {
            return null;
        }
        return digits.substring(digits.length() - 6);
    }

    /** 导入账号占位 openid，绑定微信后替换为真实 openid */
    public static String placeholderOpenid(String studentNo) {
        return "acct:" + studentNo.trim();
    }

    public static boolean isPlaceholderOpenid(String openid) {
        return openid != null && openid.startsWith("acct:");
    }
}
