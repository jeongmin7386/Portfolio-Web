package com.example.portfolio.domain.block;

import com.example.portfolio.common.BaseTimeEntity;
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
    @JoinColumn(name = "page_id", nullable = false)
    private SitePage page;

    @Enumerated(EnumType.STRING)
    @Column(name = "block_type", nullable = false, length = 60)
    private BlockType blockType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> content = new LinkedHashMap<>();

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected Block() {
    }

    public Block(SitePage page, BlockType blockType, Map<String, Object> content, int sortOrder) {
        this.page = page;
        this.blockType = blockType == null ? BlockType.TEXT : blockType;
        this.content = content == null ? new LinkedHashMap<>() : new LinkedHashMap<>(content);
        this.sortOrder = sortOrder;
    }

    public void update(BlockType blockType, Map<String, Object> content, int sortOrder) {
        this.blockType = blockType == null ? BlockType.TEXT : blockType;
        this.content = content == null ? new LinkedHashMap<>() : new LinkedHashMap<>(content);
        this.sortOrder = sortOrder;
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

    public BlockType getBlockType() {
        return blockType;
    }

    public Map<String, Object> getContent() {
        return new LinkedHashMap<>(content);
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
