package com.example.portfolio.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    String storeThumbnail(Long userId, Long projectId, MultipartFile file);
}
