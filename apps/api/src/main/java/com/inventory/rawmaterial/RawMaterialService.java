package com.inventory.rawmaterial;

import com.inventory.common.ConflictException;
import com.inventory.common.PageDto;
import com.inventory.rawmaterial.dto.RawMaterialRequestDto;
import com.inventory.rawmaterial.dto.RawMaterialResponseDto;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class RawMaterialService {

    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 100;

    private final RawMaterialRepository rawMaterialRepository;

    public RawMaterialService(RawMaterialRepository rawMaterialRepository) {
        this.rawMaterialRepository = rawMaterialRepository;
    }

    public List<RawMaterialResponseDto> findAll() {
        return rawMaterialRepository.findAllActive().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PageDto<RawMaterialResponseDto> findPage(int page, int size) {
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        int safePage = Math.max(0, page);
        Page p = Page.of(safePage, safeSize);
        List<RawMaterial> list = rawMaterialRepository.findAllActive(p);
        long total = rawMaterialRepository.countAllActive();
        int totalPages = (int) Math.ceil((double) total / safeSize);
        PageDto<RawMaterialResponseDto> dto = new PageDto<>();
        dto.setContent(list.stream().map(this::toResponse).collect(Collectors.toList()));
        dto.setTotalElements(total);
        dto.setTotalPages(totalPages);
        dto.setNumber(safePage);
        dto.setSize(safeSize);
        return dto;
    }

    public RawMaterialResponseDto findById(Long id) {
        RawMaterial r = rawMaterialRepository.findByIdActive(id)
                .orElseThrow(() -> new NotFoundException("Raw material not found: " + id));
        return toResponse(r);
    }

    @Transactional
    public RawMaterialResponseDto create(RawMaterialRequestDto dto) {
        if (rawMaterialRepository.existsByCodeExcludingId(dto.getCode(), null)) {
            throw new ConflictException("Raw material code already exists: " + dto.getCode());
        }
        RawMaterial r = new RawMaterial();
        r.setCode(dto.getCode());
        r.setName(dto.getName());
        r.setStockQuantity(dto.getStockQuantity() != null ? dto.getStockQuantity() : BigDecimal.ZERO);
        rawMaterialRepository.persist(r);
        return toResponse(r);
    }

    @Transactional
    public RawMaterialResponseDto update(Long id, RawMaterialRequestDto dto) {
        RawMaterial r = rawMaterialRepository.findByIdActive(id)
                .orElseThrow(() -> new NotFoundException("Raw material not found: " + id));
        if (rawMaterialRepository.existsByCodeExcludingId(dto.getCode(), id)) {
            throw new ConflictException("Raw material code already exists: " + dto.getCode());
        }
        r.setCode(dto.getCode());
        r.setName(dto.getName());
        r.setStockQuantity(dto.getStockQuantity() != null ? dto.getStockQuantity() : BigDecimal.ZERO);
        rawMaterialRepository.persist(r);
        return toResponse(r);
    }

    @Transactional
    public void softDelete(Long id) {
        RawMaterial r = rawMaterialRepository.findByIdActive(id)
                .orElseThrow(() -> new NotFoundException("Raw material not found: " + id));
        r.setDeletedAt(Instant.now());
        rawMaterialRepository.persist(r);
    }

    private RawMaterialResponseDto toResponse(RawMaterial r) {
        RawMaterialResponseDto dto = new RawMaterialResponseDto();
        dto.setId(r.getId());
        dto.setCode(r.getCode());
        dto.setName(r.getName());
        dto.setStockQuantity(r.getStockQuantity());
        return dto;
    }
}
