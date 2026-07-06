package com.example.portfolio.domain.block;

import com.example.portfolio.common.BaseTimeEntity;
import com.example.portfolio.domain.builderproject.BuilderProject;
import com.example.portfolio.domain.page.SitePage;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.LinkedHashMap;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "blocks")
public class Block extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "page_id")
    private SitePage page;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private BuilderProject project;

    @Enumerated(EnumType.STRING)
    @Column(name = "block_type", nullable = false, length = 60)
    private BlockType blockType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> content = new LinkedHashMap<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> settings = new LinkedHashMap<>();

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "is_visible", nullable = false)
    private boolean visible = true;

    protected Block() {
    }

    public Block(SitePage page, BlockType blockType, Map<String, Object> content, int sortOrder) {
        this.page = page;
        this.blockType = blockType == null ? BlockType.TEXT : blockType;
        this.content = content == null ? new LinkedHashMap<>() : new LinkedHashMap<>(content);
        this.sortOrder = sortOrder;
    }

    public Block(BuilderProject project, BlockType blockType, Map<String, Object> content, int sortOrder) {
        this.project = project;
        this.blockType = blockType == null ? BlockType.TEXT : blockType;
        this.content = content == null ? new LinkedHashMap<>() : new LinkedHashMap<>(content);
        this.sortOrder = sortOrder;
    }

    public void update(BlockType blockType, Map<String, Object> content, Map<String, Object> settings, int sortOrder, boolean visible) {
        this.blockType = blockType == null ? BlockType.TEXT : blockType;
        this.content = content == null ? new LinkedHashMap<>() : new LinkedHashMap<>(content);
        this.settings = settings == null ? new LinkedHashMap<>() : new LinkedHashMap<>(settings);
        this.sortOrder = sortOrder;
        this.visible = visible;
    }

    public void updateSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Long getId() {
        return id;
    }

    public SitePage getPage() {
        return page;
    }

    public BuilderProject getProject() {
        return project;
    }

    public BlockType getBlockType() {
        return blockType;
    }

    public Map<String, Object> getContent() {
        return new LinkedHashMap<>(content);
    }

    public Map<String, Object> getSettings() {
        return new LinkedHashMap<>(settings);
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public boolean isVisible() {
        return visible;
    }
}
