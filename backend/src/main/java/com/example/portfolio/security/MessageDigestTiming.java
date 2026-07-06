package com.example.portfolio.security;

import java.security.MessageDigest;

final class MessageDigestTiming {

    private MessageDigestTiming() {
    }

    static boolean safeEquals(byte[] left, byte[] right) {
        return MessageDigest.isEqual(left, right);
    }
}
