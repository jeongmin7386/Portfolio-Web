package com.example.portfolio.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LocalStorageService implements StorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    private final Path uploadRoot;
    private final String publicPath;

    public LocalStorageService(
        @Value("${app.storage.upload-dir}") String uploadDir,
        @Value("${app.storage.public-path}") String publicPath
    ) {
        this.uploadRoot = Path.of(uploadDir);
        this.publicPath = publicPath;
    }

    @Override
    public String storeThumbnail(Long userId, Long projectId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }

        String extension = extension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only jpg, png, webp, and gif images are allowed");
        }

        try {
            Path directory = uploadRoot.resolve("users").resolve(String.valueOf(userId)).resolve("projects");
            Files.createDirectories(directory);
            String timestamp = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
            String filename = "project-" + projectId + "-" + timestamp + "." + extension;
            Path target = directory.resolve(filename).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return publicPath + "/users/" + userId + "/projects/" + filename;
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store image");
        }
    }

    private String extension(String filename) {
        if (!StringUtils.hasText(filename) || !filename.contains(".")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file extension is required");
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
