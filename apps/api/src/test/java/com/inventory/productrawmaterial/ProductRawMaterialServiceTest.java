package com.inventory.productrawmaterial;

import com.inventory.common.ConflictException;
import com.inventory.product.Product;
import com.inventory.product.ProductRepository;
import com.inventory.rawmaterial.RawMaterial;
import com.inventory.rawmaterial.RawMaterialRepository;
import com.inventory.productrawmaterial.dto.ProductRawMaterialRequestDto;
import com.inventory.productrawmaterial.dto.ProductRawMaterialResponseDto;
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

@DisplayName("ProductRawMaterialService")
class ProductRawMaterialServiceTest {

    private ProductRawMaterialRepository productRawMaterialRepository;
    private ProductRepository productRepository;
    private RawMaterialRepository rawMaterialRepository;
    private ProductRawMaterialService productRawMaterialService;

    @BeforeEach
    void setUp() {
        productRawMaterialRepository = mock(ProductRawMaterialRepository.class);
        productRepository = mock(ProductRepository.class);
        rawMaterialRepository = mock(RawMaterialRepository.class);
        productRawMaterialService = new ProductRawMaterialService(
                productRawMaterialRepository, productRepository, rawMaterialRepository);
    }

    @Test
    @DisplayName("findByProductId returns list when product exists")
    void findByProductId_returns_list_when_product_exists() {
        Product p = new Product();
        p.setId(1L);
        when(productRepository.findByIdActive(1L)).thenReturn(Optional.of(p));
        ProductRawMaterial prm = new ProductRawMaterial();
        prm.setId(1L);
        prm.setProduct(p);
        RawMaterial rm = new RawMaterial();
        rm.setId(10L);
        rm.setCode("RM1");
        rm.setName("Steel");
        prm.setRawMaterial(rm);
        prm.setRequiredQuantity(new BigDecimal("5"));
        when(productRawMaterialRepository.findByProductIdActive(1L)).thenReturn(List.of(prm));

        List<ProductRawMaterialResponseDto> result = productRawMaterialService.findByProductId(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getRawMaterialCode()).isEqualTo("RM1");
        assertThat(result.get(0).getRequiredQuantity()).isEqualByComparingTo(new BigDecimal("5"));
    }

    @Test
    @DisplayName("findByProductId throws when product not found")
    void findByProductId_throws_when_product_not_found() {
        when(productRepository.findByIdActive(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productRawMaterialService.findByProductId(999L))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("findByIdAndProductId returns DTO when found")
    void findByIdAndProductId_returns_dto_when_found() {
        Product p = new Product();
        p.setId(1L);
        when(productRepository.findByIdActive(1L)).thenReturn(Optional.of(p));
        ProductRawMaterial prm = new ProductRawMaterial();
        prm.setId(10L);
        prm.setProduct(p);
        RawMaterial rm = new RawMaterial();
        rm.setId(2L);
        rm.setCode("RM2");
        rm.setName("Copper");
        prm.setRawMaterial(rm);
        prm.setRequiredQuantity(new BigDecimal("3"));
        when(productRawMaterialRepository.findByIdAndProductIdActive(10L, 1L)).thenReturn(Optional.of(prm));

        ProductRawMaterialResponseDto result = productRawMaterialService.findByIdAndProductId(10L, 1L);

        assertThat(result.getRawMaterialCode()).isEqualTo("RM2");
        assertThat(result.getRequiredQuantity()).isEqualByComparingTo(new BigDecimal("3"));
    }

    @Test
    @DisplayName("add persists and returns DTO")
    void add_persists_and_returns_dto() {
        Product p = new Product();
        p.setId(1L);
        RawMaterial rm = new RawMaterial();
        rm.setId(2L);
        rm.setCode("RM");
        rm.setName("Raw");
        when(productRepository.findByIdActive(1L)).thenReturn(Optional.of(p));
        when(rawMaterialRepository.findByIdActive(2L)).thenReturn(Optional.of(rm));
        when(productRawMaterialRepository.existsByProductAndRawMaterialExcludingId(1L, 2L, null)).thenReturn(false);
        doAnswer(inv -> null).when(productRawMaterialRepository).persist(argThat((ProductRawMaterial prm) -> true));

        ProductRawMaterialRequestDto dto = new ProductRawMaterialRequestDto();
        dto.setRawMaterialId(2L);
        dto.setRequiredQuantity(new BigDecimal("10"));

        ProductRawMaterialResponseDto result = productRawMaterialService.add(1L, dto);

        assertThat(result.getRawMaterialCode()).isEqualTo("RM");
        assertThat(result.getRequiredQuantity()).isEqualByComparingTo(new BigDecimal("10"));
        verify(productRawMaterialRepository, atLeastOnce()).persist(argThat((ProductRawMaterial x) -> true));
    }

    @Test
    @DisplayName("add throws when product not found")
    void add_throws_when_product_not_found() {
        when(productRepository.findByIdActive(999L)).thenReturn(Optional.empty());
        ProductRawMaterialRequestDto dto = new ProductRawMaterialRequestDto();
        dto.setRawMaterialId(1L);
        dto.setRequiredQuantity(BigDecimal.ONE);

        assertThatThrownBy(() -> productRawMaterialService.add(999L, dto))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("add throws when raw material not found")
    void add_throws_when_raw_material_not_found() {
        Product p = new Product();
        p.setId(1L);
        when(productRepository.findByIdActive(1L)).thenReturn(Optional.of(p));
        when(rawMaterialRepository.findByIdActive(999L)).thenReturn(Optional.empty());
        ProductRawMaterialRequestDto dto = new ProductRawMaterialRequestDto();
        dto.setRawMaterialId(999L);
        dto.setRequiredQuantity(BigDecimal.ONE);

        assertThatThrownBy(() -> productRawMaterialService.add(1L, dto))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("add throws ConflictException when product already has this raw material")
    void add_throws_conflict_when_duplicate() {
        Product p = new Product();
        p.setId(1L);
        when(productRepository.findByIdActive(1L)).thenReturn(Optional.of(p));
        when(rawMaterialRepository.findByIdActive(2L)).thenReturn(Optional.of(new RawMaterial()));
        when(productRawMaterialRepository.existsByProductAndRawMaterialExcludingId(1L, 2L, null)).thenReturn(true);
        ProductRawMaterialRequestDto dto = new ProductRawMaterialRequestDto();
        dto.setRawMaterialId(2L);
        dto.setRequiredQuantity(BigDecimal.ONE);

        assertThatThrownBy(() -> productRawMaterialService.add(1L, dto))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already has");
        verify(productRawMaterialRepository, never()).persist(argThat((ProductRawMaterial x) -> true));
    }

    @Test
    @DisplayName("add throws when requiredQuantity <= 0")
    void add_throws_when_requiredQuantity_invalid() {
        Product p = new Product();
        p.setId(1L);
        RawMaterial rm = new RawMaterial();
        rm.setId(2L);
        when(productRepository.findByIdActive(1L)).thenReturn(Optional.of(p));
        when(rawMaterialRepository.findByIdActive(2L)).thenReturn(Optional.of(rm));
        when(productRawMaterialRepository.existsByProductAndRawMaterialExcludingId(1L, 2L, null)).thenReturn(false);
        ProductRawMaterialRequestDto dto = new ProductRawMaterialRequestDto();
        dto.setRawMaterialId(2L);
        dto.setRequiredQuantity(BigDecimal.ZERO);

        assertThatThrownBy(() -> productRawMaterialService.add(1L, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("requiredQuantity");
    }

    @Test
    @DisplayName("update persists and returns DTO")
    void update_persists_and_returns_dto() {
        Product p = new Product();
        p.setId(1L);
        RawMaterial rm = new RawMaterial();
        rm.setId(2L);
        rm.setCode("RM");
        rm.setName("Raw");
        ProductRawMaterial prm = new ProductRawMaterial();
        prm.setId(10L);
        prm.setProduct(p);
        prm.setRawMaterial(rm);
        prm.setRequiredQuantity(new BigDecimal("5"));
        when(productRawMaterialRepository.findByIdAndProductIdActive(10L, 1L)).thenReturn(Optional.of(prm));

        ProductRawMaterialRequestDto dto = new ProductRawMaterialRequestDto();
        dto.setRequiredQuantity(new BigDecimal("8"));

        ProductRawMaterialResponseDto result = productRawMaterialService.update(1L, 10L, dto);

        assertThat(result.getRequiredQuantity()).isEqualByComparingTo(new BigDecimal("8"));
        verify(productRawMaterialRepository, atLeastOnce()).persist(argThat((ProductRawMaterial x) -> x == prm));
    }

    @Test
    @DisplayName("update throws when association not found")
    void update_throws_when_not_found() {
        when(productRawMaterialRepository.findByIdAndProductIdActive(99L, 1L)).thenReturn(Optional.empty());
        ProductRawMaterialRequestDto dto = new ProductRawMaterialRequestDto();
        dto.setRequiredQuantity(BigDecimal.ONE);

        assertThatThrownBy(() -> productRawMaterialService.update(1L, 99L, dto))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("softDelete sets deletedAt")
    void softDelete_sets_deletedAt() {
        ProductRawMaterial prm = new ProductRawMaterial();
        prm.setId(10L);
        when(productRawMaterialRepository.findByIdAndProductIdActive(10L, 1L)).thenReturn(Optional.of(prm));

        productRawMaterialService.softDelete(1L, 10L);

        assertThat(prm.getDeletedAt()).isNotNull();
        verify(productRawMaterialRepository, atLeastOnce()).persist(argThat((ProductRawMaterial x) -> x == prm));
    }

    @Test
    @DisplayName("softDelete throws when not found")
    void softDelete_throws_when_not_found() {
        when(productRawMaterialRepository.findByIdAndProductIdActive(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productRawMaterialService.softDelete(1L, 99L))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void addingArchivedPairRestoresItsIdentityInsteadOfViolatingUniqueConstraint() {
        Product product = new Product(); product.setId(1L);
        RawMaterial material = new RawMaterial(); material.setId(2L);
        ProductRawMaterial archived = new ProductRawMaterial(); archived.setId(3L);
        archived.setDeletedAt(java.time.Instant.now());
        when(productRepository.findByIdActive(1L)).thenReturn(Optional.of(product));
        when(rawMaterialRepository.findByIdActive(2L)).thenReturn(Optional.of(material));
        when(productRawMaterialRepository.findArchivedPair(1L, 2L)).thenReturn(Optional.of(archived));
        ProductRawMaterialRequestDto input = new ProductRawMaterialRequestDto();
        input.setRawMaterialId(2L); input.setRequiredQuantity(new BigDecimal("1.2500"));
        var restored = productRawMaterialService.add(1L, input);
        assertThat(restored.getId()).isEqualTo(3L);
        assertThat(archived.getDeletedAt()).isNull();
        assertThat(archived.getRequiredQuantity()).isEqualByComparingTo("1.25");
    }
}
