package com.inventory.productrawmaterial;

import com.inventory.common.ConflictException;
import com.inventory.product.Product;
import com.inventory.product.ProductRepository;
import com.inventory.rawmaterial.RawMaterial;
import com.inventory.rawmaterial.RawMaterialRepository;
import com.inventory.productrawmaterial.dto.ProductRawMaterialRequestDto;
import com.inventory.productrawmaterial.dto.ProductRawMaterialResponseDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class ProductRawMaterialService {

    private final ProductRawMaterialRepository productRawMaterialRepository;
    private final ProductRepository productRepository;
    private final RawMaterialRepository rawMaterialRepository;

    public ProductRawMaterialService(ProductRawMaterialRepository productRawMaterialRepository,
                                    ProductRepository productRepository,
                                    RawMaterialRepository rawMaterialRepository) {
        this.productRawMaterialRepository = productRawMaterialRepository;
        this.productRepository = productRepository;
        this.rawMaterialRepository = rawMaterialRepository;
    }

    public List<ProductRawMaterialResponseDto> findByProductId(Long productId) {
        ensureProductExists(productId);
        return productRawMaterialRepository.findByProductIdActive(productId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProductRawMaterialResponseDto findByIdAndProductId(Long id, Long productId) {
        ensureProductExists(productId);
        ProductRawMaterial prm = productRawMaterialRepository.findByIdAndProductIdActive(id, productId)
                .orElseThrow(() -> new NotFoundException("Product raw material not found: " + id));
        return toResponse(prm);
    }

    @Transactional
    public ProductRawMaterialResponseDto add(Long productId, ProductRawMaterialRequestDto dto) {
        Product product = productRepository.findByIdActive(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
        RawMaterial rawMaterial = rawMaterialRepository.findByIdActive(dto.getRawMaterialId())
                .orElseThrow(() -> new NotFoundException("Raw material not found: " + dto.getRawMaterialId()));
        if (productRawMaterialRepository.existsByProductAndRawMaterialExcludingId(productId, dto.getRawMaterialId(), null)) {
            throw new ConflictException("Product already has this raw material: " + dto.getRawMaterialId());
        }
        ProductRawMaterial prm = productRawMaterialRepository.findArchivedPair(productId, dto.getRawMaterialId())
                .orElseGet(ProductRawMaterial::new);
        prm.setDeletedAt(null);
        prm.setProduct(product);
        prm.setRawMaterial(rawMaterial);
        prm.setRequiredQuantity(dto.getRequiredQuantity() != null ? dto.getRequiredQuantity() : BigDecimal.ZERO);
        if (prm.getRequiredQuantity().signum() <= 0) {
            throw new IllegalArgumentException("requiredQuantity must be > 0");
        }
        productRawMaterialRepository.persist(prm);
        return toResponse(prm);
    }

    @Transactional
    public ProductRawMaterialResponseDto update(Long productId, Long id, ProductRawMaterialRequestDto dto) {
        ProductRawMaterial prm = productRawMaterialRepository.findByIdAndProductIdActive(id, productId)
                .orElseThrow(() -> new NotFoundException("Product raw material not found: " + id));
        if (dto.getRawMaterialId() != null && !dto.getRawMaterialId().equals(prm.getRawMaterial().getId())) {
            RawMaterial rawMaterial = rawMaterialRepository.findByIdActive(dto.getRawMaterialId())
                    .orElseThrow(() -> new NotFoundException("Raw material not found: " + dto.getRawMaterialId()));
            if (productRawMaterialRepository.existsByProductAndRawMaterialExcludingId(productId, dto.getRawMaterialId(), id)) {
                throw new ConflictException("Product already has this raw material: " + dto.getRawMaterialId());
            }
            prm.setRawMaterial(rawMaterial);
        }
        if (dto.getRequiredQuantity() != null && dto.getRequiredQuantity().signum() <= 0) {
            throw new IllegalArgumentException("requiredQuantity must be > 0");
        }
        prm.setRequiredQuantity(dto.getRequiredQuantity() != null ? dto.getRequiredQuantity() : prm.getRequiredQuantity());
        productRawMaterialRepository.persist(prm);
        return toResponse(prm);
    }

    @Transactional
    public void softDelete(Long productId, Long id) {
        ProductRawMaterial prm = productRawMaterialRepository.findByIdAndProductIdActive(id, productId)
                .orElseThrow(() -> new NotFoundException("Product raw material not found: " + id));
        prm.setDeletedAt(Instant.now());
        productRawMaterialRepository.persist(prm);
    }

    private void ensureProductExists(Long productId) {
        productRepository.findByIdActive(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
    }

    private ProductRawMaterialResponseDto toResponse(ProductRawMaterial prm) {
        ProductRawMaterialResponseDto dto = new ProductRawMaterialResponseDto();
        dto.setId(prm.getId());
        dto.setRawMaterialId(prm.getRawMaterial().getId());
        dto.setRawMaterialCode(prm.getRawMaterial().getCode());
        dto.setRawMaterialName(prm.getRawMaterial().getName());
        dto.setRequiredQuantity(prm.getRequiredQuantity());
        return dto;
    }
}
