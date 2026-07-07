package com.example.portfolio.api.health;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping({"/", "/api/health", "/actuator/health"})
    Map<String, String> health() {
        return Map.of(
            "service", "portfolio-web-api",
            "status", "UP",
            "version", "health-v2"
        );
    }
}
