package com.example.portfolio.common.env;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String explicitSpringUrl = System.getenv("SPRING_DATASOURCE_URL");
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (hasText(explicitSpringUrl) || !hasText(databaseUrl)) {
            return;
        }

        URI uri = URI.create(databaseUrl);
        if (!"postgres".equals(uri.getScheme()) && !"postgresql".equals(uri.getScheme())) {
            return;
        }

        Map<String, Object> properties = new HashMap<>();
        String port = uri.getPort() < 0 ? "" : ":" + uri.getPort();
        String query = uri.getRawQuery() == null ? "" : "?" + uri.getRawQuery();
        properties.put("spring.datasource.url", "jdbc:postgresql://" + uri.getHost() + port + uri.getPath() + query);

        String userInfo = uri.getRawUserInfo();
        if (hasText(userInfo)) {
            String[] parts = userInfo.split(":", 2);
            properties.put("spring.datasource.username", decode(parts[0]));
            if (parts.length > 1) {
                properties.put("spring.datasource.password", decode(parts[1]));
            }
        }

        environment.getPropertySources().addFirst(new MapPropertySource("renderDatabaseUrl", properties));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
