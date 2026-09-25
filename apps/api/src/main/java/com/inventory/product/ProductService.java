package com.inventory.product;

import com.inventory.common.ConflictException;
import com.inventory.common.PageDto;
import com.inventory.product.dto.ProductRequestDto;
import com.inventory.product.dto.ProductResponseDto;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class ProductService {

    @jakarta.inject.Inject
    jakarta.persistence.EntityManager em;

    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 100;

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductResponseDto> findAll() {
        return productRepository.findAllActive().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public PageDto<ProductResponseDto> findPage(int page, int size) {
        int safeSize = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        int safePage = Math.max(0, page);
        Page p = Page.of(safePage, safeSize);
        List<Product> list = productRepository.findAllActive(p);
        long total = productRepository.countAllActive();
        int totalPages = (int) Math.ceil((double) total / safeSize);
        PageDto<ProductResponseDto> dto = new PageDto<>();
        dto.setContent(list.stream().map(this::toResponse).collect(Collectors.toList()));
        dto.setTotalElements(total);
        dto.setTotalPages(totalPages);
        dto.setNumber(safePage);
        dto.setSize(safeSize);
        return dto;
    }

    public ProductResponseDto findById(Long id) {
        Product p = productRepository.findByIdActive(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        return toResponse(p);
    }

    @Transactional
    public ProductResponseDto create(ProductRequestDto dto) {
        return create(dto, null);
    }

    @Transactional
    public ProductResponseDto create(ProductRequestDto dto, String actor) {
        if (productRepository.existsByCodeExcludingId(dto.getCode(), null)) {
            throw new ConflictException("Product code already exists: " + dto.getCode());
        }
        Product p = new Product();
        p.setCode(dto.getCode());
        p.setName(dto.getName());
        p.setPrice(dto.getPrice() != null ? dto.getPrice() : BigDecimal.ZERO);
        applyCatalog(p, dto);
        productRepository.persist(p);
        if (p.getFinishedStock() != 0) recordAdjustment(p, 0, dto.adjustmentReason, actor);
        productRepository.flush();
        return toResponse(p);
    }

    @Transactional
    public ProductResponseDto update(Long id, ProductRequestDto dto) {
        return update(id, dto, null);
    }

    @Transactional
    public ProductResponseDto update(Long id, ProductRequestDto dto, String actor) {
        Product p = productRepository.findByIdActive(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        if (dto.version != null && dto.version != p.getVersion()) {
            throw new ConflictException("Product changed since it was loaded. Reload before saving.");
        }
        if (productRepository.existsByCodeExcludingId(dto.getCode(), id)) {
            throw new ConflictException("Product code already exists: " + dto.getCode());
        }
        p.setCode(dto.getCode());
        p.setName(dto.getName());
        p.setPrice(dto.getPrice() != null ? dto.getPrice() : BigDecimal.ZERO);
        long previousStock = p.getFinishedStock();
        applyCatalog(p, dto);
        if (p.getFinishedStock() != previousStock) recordAdjustment(p, previousStock, dto.adjustmentReason, actor);
        productRepository.persist(p);
        productRepository.flush();
        return toResponse(p);
    }

    @Transactional
    public void softDelete(Long id) {
        Product p = productRepository.findByIdActive(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
        if (p.getFinishedStock() != 0) throw new ConflictException("Only products with zero finished stock can be archived");
        p.setDeletedAt(Instant.now());
        productRepository.persist(p);
        productRepository.flush();
    }

    private ProductResponseDto toResponse(Product p) {
        ProductResponseDto dto = new ProductResponseDto();
        dto.setId(p.getId());
        dto.setCode(p.getCode());
        dto.setName(p.getName());
        dto.setPrice(p.getPrice());
        dto.description = p.getDescription();
        dto.categoryPath = p.getCategoryPath();
        dto.available = p.isAvailable();
        dto.finishedStock = p.getFinishedStock();
        dto.brandId = p.getBrandId();
        dto.cityId = p.getCityId();
        dto.version = p.getVersion();
        return dto;
    }

    private void applyCatalog(Product product, ProductRequestDto dto) {
        if (dto.brandId != null && em.find(com.inventory.catalog.Brand.class, dto.brandId) == null)
            throw new jakarta.ws.rs.BadRequestException("Unknown brand");
        if (dto.cityId != null && em.find(com.inventory.catalog.City.class, dto.cityId) == null)
            throw new jakarta.ws.rs.BadRequestException("Unknown city");
        product.setDescription(dto.description);
        product.setCategoryPath(dto.categoryPath);
        product.setBrandId(dto.brandId);
        product.setCityId(dto.cityId);
        if (dto.available != null) product.setAvailable(dto.available);
        if (dto.finishedStock != null) product.setFinishedStock(dto.finishedStock);
    }

    private void recordAdjustment(Product product, long previousStock, String reason, String actor) {
        em.createNativeQuery("INSERT INTO stock_adjustment(product_id,quantity_before,quantity_after,reason,created_at,actor) VALUES (?1,?2,?3,?4,?5,?6)")
                .setParameter(1, product.getId()).setParameter(2, previousStock).setParameter(3, product.getFinishedStock())
                .setParameter(4, reason == null || reason.isBlank() ? "Manual balance update" : reason)
                .setParameter(5, java.sql.Timestamp.from(Instant.now())).setParameter(6, actor).executeUpdate();
    }
}
