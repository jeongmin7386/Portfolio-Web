package com.example.portfolio.domain.theme;

import com.example.portfolio.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.LinkedHashMap;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "themes")
public class Theme extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> settings = new LinkedHashMap<>();

    protected Theme() {
    }

    public Theme(String name, Map<String, Object> settings) {
        this.name = name;
        this.settings = settings == null ? new LinkedHashMap<>() : new LinkedHashMap<>(settings);
    }

    public void update(String name, Map<String, Object> settings) {
        this.name = name;
        this.settings = settings == null ? new LinkedHashMap<>() : new LinkedHashMap<>(settings);
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Map<String, Object> getSettings() {
        return new LinkedHashMap<>(settings);
    }
}
