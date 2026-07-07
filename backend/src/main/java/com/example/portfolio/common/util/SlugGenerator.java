package com.example.portfolio.common.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class SlugGenerator {

    public String from(String value) {
        if (!StringUtils.hasText(value)) {
            return "item";
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");

        return StringUtils.hasText(normalized) ? normalized : "item";
    }

    public String unique(String value, Predicate<String> exists) {
        String base = from(value);
        String candidate = base;
        int suffix = 2;
        while (exists.test(candidate)) {
            candidate = base + "-" + suffix;
            suffix++;
        }
        return candidate;
    }
}
