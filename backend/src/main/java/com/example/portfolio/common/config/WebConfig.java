package com.example.portfolio.common.config;

import java.nio.file.Path;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String uploadDir;
    private final String publicPath;

    public WebConfig(
        @Value("${app.storage.upload-dir}") String uploadDir,
        @Value("${app.storage.public-path}") String publicPath
    ) {
        this.uploadDir = uploadDir;
        this.publicPath = publicPath;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String pattern = publicPath.endsWith("/") ? publicPath + "**" : publicPath + "/**";
        String location = Path.of(uploadDir).toAbsolutePath().normalize().toUri().toString();
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        registry.addResourceHandler(pattern).addResourceLocations(location);
    }
}
