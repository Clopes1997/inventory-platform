package com.inventory.product;

import com.inventory.common.ConflictException;
import com.inventory.product.dto.ProductRequestDto;
import com.inventory.product.dto.ProductResponseDto;
import io.quarkus.panache.common.Page;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import jakarta.ws.rs.NotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@DisplayName("ProductService")
class ProductServiceTest {

    private ProductRepository productRepository;
    private ProductService productService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        productService = new ProductService(productRepository);
    }

    @Test
    @DisplayName("findPage returns PageDto with mapped content")
    void findPage_returns_pageDto() {
        Product p = new Product();
        p.setId(1L);
        p.setCode("P1");
        p.setName("Product 1");
        p.setPrice(new BigDecimal("10.00"));
        when(productRepository.findAllActive(any(Page.class))).thenReturn(List.of(p));
        when(productRepository.countAllActive()).thenReturn(1L);

        var result = productService.findPage(0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getCode()).isEqualTo("P1");
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getNumber()).isZero();
        assertThat(result.getSize()).isEqualTo(20);
    }

    @Test
    @DisplayName("findById returns mapped DTO when found")
    void findById_returns_dto_when_found() {
        Product p = new Product();
        p.setId(1L);
        p.setCode("P1");
        p.setName("Product 1");
        p.setPrice(new BigDecimal("5.50"));
        when(productRepository.findByIdActive(1L)).thenReturn(Optional.of(p));

        ProductResponseDto result = productService.findById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getCode()).isEqualTo("P1");
        assertThat(result.getPrice()).isEqualByComparingTo(new BigDecimal("5.50"));
    }

    @Test
    @DisplayName("findById throws NotFoundException when not found")
    void findById_throws_when_not_found() {
        when(productRepository.findByIdActive(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.findById(999L))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("create persists and returns DTO")
    void create_persists_and_returns_dto() {
        when(productRepository.existsByCodeExcludingId("NEW", null)).thenReturn(false);
        Product saved = new Product();
        saved.setId(1L);
        saved.setCode("NEW");
        saved.setName("New Product");
        saved.setPrice(new BigDecimal("99.00"));
        doAnswer(inv -> {
            Product p = inv.getArgument(0);
            return null;
        }).when(productRepository).persist(any(Product.class));

        ProductRequestDto dto = new ProductRequestDto();
        dto.setCode("NEW");
        dto.setName("New Product");
        dto.setPrice(new BigDecimal("99.00"));

        ProductResponseDto result = productService.create(dto);

        assertThat(result.getCode()).isEqualTo("NEW");
        assertThat(result.getPrice()).isEqualByComparingTo(new BigDecimal("99.00"));
        verify(productRepository, atLeastOnce()).persist(argThat((Product p) -> true));
    }

    @Test
    @DisplayName("create throws ConflictException when code exists")
    void create_throws_conflict_when_code_exists() {
        when(productRepository.existsByCodeExcludingId("DUP", null)).thenReturn(true);
        ProductRequestDto dto = new ProductRequestDto();
        dto.setCode("DUP");
        dto.setName("Dup");
        dto.setPrice(BigDecimal.ONE);

        assertThatThrownBy(() -> productService.create(dto))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already exists");
        verify(productRepository, never()).persist(argThat((Product p) -> true));
    }

    @Test
    @DisplayName("update persists and returns DTO")
    void update_persists_and_returns_dto() {
        Product existing = new Product();
        existing.setId(1L);
        existing.setCode("OLD");
        existing.setName("Old");
        existing.setPrice(BigDecimal.ONE);
        when(productRepository.findByIdActive(1L)).thenReturn(Optional.of(existing));
        when(productRepository.existsByCodeExcludingId("NEW", 1L)).thenReturn(false);

        ProductRequestDto dto = new ProductRequestDto();
        dto.setCode("NEW");
        dto.setName("Updated");
        dto.setPrice(new BigDecimal("2.00"));

        ProductResponseDto result = productService.update(1L, dto);

        assertThat(result.getCode()).isEqualTo("NEW");
        assertThat(result.getPrice()).isEqualByComparingTo(new BigDecimal("2.00"));
        verify(productRepository, atLeastOnce()).persist(argThat((Product p) -> p == existing));
    }

    @Test
    @DisplayName("update throws NotFoundException when product not found")
    void update_throws_when_not_found() {
        when(productRepository.findByIdActive(999L)).thenReturn(Optional.empty());
        ProductRequestDto dto = new ProductRequestDto();
        dto.setCode("X");
        dto.setName("X");
        dto.setPrice(BigDecimal.ONE);

        assertThatThrownBy(() -> productService.update(999L, dto))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("update throws ConflictException when code taken by another")
    void update_throws_conflict_when_code_taken() {
        Product existing = new Product();
        existing.setId(1L);
        when(productRepository.findByIdActive(1L)).thenReturn(Optional.of(existing));
        when(productRepository.existsByCodeExcludingId("TAKEN", 1L)).thenReturn(true);
        ProductRequestDto dto = new ProductRequestDto();
        dto.setCode("TAKEN");
        dto.setName("X");
        dto.setPrice(BigDecimal.ONE);

        assertThatThrownBy(() -> productService.update(1L, dto))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("softDelete sets deletedAt")
    void softDelete_sets_deletedAt() {
        Product p = new Product();
        p.setId(1L);
        when(productRepository.findByIdActive(1L)).thenReturn(Optional.of(p));

        productService.softDelete(1L);

        assertThat(p.getDeletedAt()).isNotNull();
        verify(productRepository, atLeastOnce()).persist(argThat((Product x) -> x == p));
    }

    @Test
    @DisplayName("softDelete throws when not found")
    void softDelete_throws_when_not_found() {
        when(productRepository.findByIdActive(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.softDelete(999L))
                .isInstanceOf(NotFoundException.class);
    }
}
