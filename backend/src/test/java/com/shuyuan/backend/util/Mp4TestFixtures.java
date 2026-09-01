package com.shuyuan.backend.util;

/**
 * 构造最小 ISO BMFF，供编码门禁单测使用。
 */
public final class Mp4TestFixtures {

    private Mp4TestFixtures() {
    }

    public static byte[] isoBox(String type, byte[] payload) {
        int size = 8 + payload.length;
        byte[] out = new byte[size];
        out[0] = (byte) (size >>> 24);
        out[1] = (byte) (size >>> 16);
        out[2] = (byte) (size >>> 8);
        out[3] = (byte) size;
        byte[] four = type.getBytes();
        System.arraycopy(four, 0, out, 4, 4);
        System.arraycopy(payload, 0, out, 8, payload.length);
        return out;
    }

    public static byte[] concat(byte[]... parts) {
        int len = 0;
        for (byte[] part : parts) {
            len += part.length;
        }
        byte[] out = new byte[len];
        int pos = 0;
        for (byte[] part : parts) {
            System.arraycopy(part, 0, out, pos, part.length);
            pos += part.length;
        }
        return out;
    }

    public static byte[] ftypIsom() {
        return isoBox("ftyp", concat("isom".getBytes(), new byte[]{0, 0, 0, 0}, "mp41".getBytes()));
    }

    public static byte[] ftypHevc() {
        return isoBox("ftyp", concat("hev1".getBytes(), new byte[]{0, 0, 0, 0}, "isom".getBytes()));
    }

    public static byte[] sampleEntry(String codec) {
        return isoBox(codec, new byte[]{0, 0, 0, 0, 0, 0, 0, 1});
    }

    public static byte[] videoTrak(String codec) {
        byte[] stsd = isoBox("stsd", concat(new byte[]{0, 0, 0, 0, 0, 0, 0, 1}, sampleEntry(codec)));
        return isoBox("trak", isoBox("mdia", isoBox("minf", isoBox("stbl", stsd))));
    }

    public static byte[] videoMoov(String codec) {
        return isoBox("moov", videoTrak(codec));
    }

    /** moov 很大且 hvc1 在 moov 前部，最后 256KB 只有 free 填充。 */
    public static byte[] buriedHevcAfterLargeMdat() {
        return concat(
                ftypIsom(),
                isoBox("mdat", new byte[400_000]),
                isoBox("moov", concat(videoTrak("hvc1"), isoBox("free", new byte[300_000]))));
    }

    public static byte[] buriedAvcAfterLargeMdat() {
        return concat(
                ftypIsom(),
                isoBox("mdat", new byte[400_000]),
                isoBox("moov", concat(videoTrak("avc1"), isoBox("free", new byte[300_000]))));
    }
}
