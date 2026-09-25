package com.inventory.production;

import com.inventory.production.dto.ProductionSuggestionResponseDto;
import com.inventory.product.Product;
import com.inventory.product.ProductRepository;
import com.inventory.productrawmaterial.ProductRawMaterial;
import com.inventory.productrawmaterial.ProductRawMaterialRepository;
import com.inventory.rawmaterial.RawMaterial;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import io.quarkus.panache.common.Page;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@DisplayName("ProductionService")
class ProductionServiceTest {

    private ProductRepository productRepository;
    private ProductRawMaterialRepository productRawMaterialRepository;
    private ProductionService productionService;

    @BeforeEach
    void setUp() {
        productRepository = mock(ProductRepository.class);
        productRawMaterialRepository = mock(ProductRawMaterialRepository.class);
        productionService = new ProductionService(productRepository, productRawMaterialRepository);
    }

    @Test
    @DisplayName("getSuggestion returns products sorted by price desc and total value is sum of line values")
    void getSuggestion_sortsByPriceDesc_and_sumsTotalValue() {
        Product cheap = new Product();
        cheap.setId(1L);
        cheap.setCode("CHEAP");
        cheap.setName("Cheap");
        cheap.setPrice(new BigDecimal("5.00"));

        Product expensive = new Product();
        expensive.setId(2L);
        expensive.setCode("EXP");
        expensive.setName("Expensive");
        expensive.setPrice(new BigDecimal("100.00"));

        RawMaterial rm = new RawMaterial();
        rm.setId(1L);
        rm.setStockQuantity(new BigDecimal("50"));
        rm.setDeletedAt(null);

        ProductRawMaterial prm1 = new ProductRawMaterial();
        prm1.setProduct(cheap);
        prm1.setRawMaterial(rm);
        prm1.setRequiredQuantity(new BigDecimal("10"));

        ProductRawMaterial prm2 = new ProductRawMaterial();
        prm2.setProduct(expensive);
        prm2.setRawMaterial(rm);
        prm2.setRequiredQuantity(new BigDecimal("10"));

        when(productRepository.findActiveOrderByPriceDesc(any(Page.class)))
                .thenReturn(List.of(cheap, expensive))
                .thenReturn(Collections.emptyList());
        when(productRawMaterialRepository.findByProductIdsActive(anyList())).thenReturn(List.of(prm1, prm2));

        ProductionSuggestionResponseDto result = productionService.getSuggestion(500);

        assertThat(result.getItems()).hasSize(2);
        assertThat(result.getItems().get(0).getProductCode()).isEqualTo("EXP");
        assertThat(result.getItems().get(0).getMaxProducibleQuantity()).isEqualByComparingTo(BigDecimal.valueOf(5));
        assertThat(result.getItems().get(1).getProductCode()).isEqualTo("CHEAP");
        assertThat(result.getItems().get(1).getMaxProducibleQuantity()).isEqualByComparingTo(BigDecimal.valueOf(5));
        assertThat(result.getTotalProductionValue()).isEqualByComparingTo(new BigDecimal("525")); // 5*100 + 5*5
    }

    @Test
    @DisplayName("getSuggestion uses min of batches as max producible (bottleneck)")
    void getSuggestion_bottleneck_is_min_batches() {
        Product p = new Product();
        p.setId(1L);
        p.setCode("P");
        p.setName("P");
        p.setPrice(BigDecimal.ONE);

        RawMaterial r1 = new RawMaterial();
        r1.setId(1L);
        r1.setStockQuantity(new BigDecimal("100"));
        r1.setDeletedAt(null);
        RawMaterial r2 = new RawMaterial();
        r2.setId(2L);
        r2.setStockQuantity(new BigDecimal("3"));
        r2.setDeletedAt(null);

        ProductRawMaterial prm1 = new ProductRawMaterial();
        prm1.setProduct(p);
        prm1.setRawMaterial(r1);
        prm1.setRequiredQuantity(new BigDecimal("10"));
        ProductRawMaterial prm2 = new ProductRawMaterial();
        prm2.setProduct(p);
        prm2.setRawMaterial(r2);
        prm2.setRequiredQuantity(new BigDecimal("2"));

        when(productRepository.findActiveOrderByPriceDesc(any(Page.class)))
                .thenReturn(List.of(p))
                .thenReturn(Collections.emptyList());
        when(productRawMaterialRepository.findByProductIdsActive(anyList())).thenReturn(List.of(prm1, prm2));

        ProductionSuggestionResponseDto result = productionService.getSuggestion(500);

        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().get(0).getMaxProducibleQuantity()).isEqualByComparingTo(BigDecimal.ONE);
    }

    @Test
    @DisplayName("getSuggestion excludes product with no materials")
    void getSuggestion_excludes_product_with_no_materials() {
        Product p = new Product();
        p.setId(1L);
        p.setCode("NO_MAT");
        p.setName("No materials");
        p.setPrice(BigDecimal.TEN);

        when(productRepository.findActiveOrderByPriceDesc(any(Page.class)))
                .thenReturn(List.of(p))
                .thenReturn(Collections.emptyList());
        when(productRawMaterialRepository.findByProductIdsActive(anyList())).thenReturn(Collections.emptyList());

        ProductionSuggestionResponseDto result = productionService.getSuggestion(500);

        assertThat(result.getItems()).isEmpty();
        assertThat(result.getTotalCount()).isEqualTo(0);
        assertThat(result.getTotalProductionValue()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("getSuggestion excludes product when one material has zero stock")
    void getSuggestion_excludes_when_zero_stock() {
        Product p = new Product();
        p.setId(1L);
        p.setCode("ZERO");
        p.setName("Zero stock");
        p.setPrice(BigDecimal.ONE);

        RawMaterial rm = new RawMaterial();
        rm.setId(1L);
        rm.setStockQuantity(BigDecimal.ZERO);
        rm.setDeletedAt(null);

        ProductRawMaterial prm = new ProductRawMaterial();
        prm.setProduct(p);
        prm.setRawMaterial(rm);
        prm.setRequiredQuantity(BigDecimal.ONE);

        when(productRepository.findActiveOrderByPriceDesc(any(Page.class)))
                .thenReturn(List.of(p))
                .thenReturn(Collections.emptyList());
        when(productRawMaterialRepository.findByProductIdsActive(anyList())).thenReturn(List.of(prm));

        ProductionSuggestionResponseDto result = productionService.getSuggestion(500);

        assertThat(result.getItems()).isEmpty();
        assertThat(result.getTotalCount()).isEqualTo(0);
        assertThat(result.getTotalProductionValue()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("getSuggestion caps returned items to limit; totalCount is total found before cap")
    void getSuggestion_caps_to_limit_totalCount_is_full_found() {
        Product p1 = new Product();
        p1.setId(1L);
        p1.setCode("A");
        p1.setName("A");
        p1.setPrice(new BigDecimal("100"));
        Product p2 = new Product();
        p2.setId(2L);
        p2.setCode("B");
        p2.setName("B");
        p2.setPrice(new BigDecimal("50"));
        Product p3 = new Product();
        p3.setId(3L);
        p3.setCode("C");
        p3.setName("C");
        p3.setPrice(BigDecimal.ONE);

        RawMaterial rm = new RawMaterial();
        rm.setId(1L);
        rm.setStockQuantity(new BigDecimal("1000"));
        rm.setDeletedAt(null);

        ProductRawMaterial prm1 = new ProductRawMaterial();
        prm1.setProduct(p1);
        prm1.setRawMaterial(rm);
        prm1.setRequiredQuantity(BigDecimal.ONE);
        ProductRawMaterial prm2 = new ProductRawMaterial();
        prm2.setProduct(p2);
        prm2.setRawMaterial(rm);
        prm2.setRequiredQuantity(BigDecimal.ONE);
        ProductRawMaterial prm3 = new ProductRawMaterial();
        prm3.setProduct(p3);
        prm3.setRawMaterial(rm);
        prm3.setRequiredQuantity(BigDecimal.ONE);

        when(productRepository.findActiveOrderByPriceDesc(any(Page.class)))
                .thenReturn(List.of(p1, p2, p3))
                .thenReturn(Collections.emptyList());
        when(productRawMaterialRepository.findByProductIdsActive(anyList()))
                .thenReturn(List.of(prm1, prm2, prm3));

        ProductionSuggestionResponseDto result = productionService.getSuggestion(2);

        assertThat(result.getItems()).hasSize(2);
        assertThat(result.getTotalCount()).isEqualTo(3);
        assertThat(result.getItems().get(0).getProductCode()).isEqualTo("A");
        assertThat(result.getItems().get(1).getProductCode()).isEqualTo("B");
    }

    @Test
    @DisplayName("getSuggestion returns empty when catalog is empty")
    void getSuggestion_empty_when_no_products() {
        when(productRepository.findActiveOrderByPriceDesc(any(Page.class)))
                .thenReturn(Collections.emptyList());

        ProductionSuggestionResponseDto result = productionService.getSuggestion(500);

        assertThat(result.getItems()).isEmpty();
        assertThat(result.getTotalCount()).isEqualTo(0);
        assertThat(result.getTotalProductionValue()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void anInvalidRecipeLineDisqualifiesTheWholeProduct() {
        Product product = new Product(); product.setId(1L); product.setPrice(BigDecimal.ONE);
        RawMaterial material = new RawMaterial(); material.setStockQuantity(BigDecimal.TEN);
        ProductRawMaterial valid = new ProductRawMaterial(); valid.setProduct(product); valid.setRawMaterial(material); valid.setRequiredQuantity(BigDecimal.ONE);
        ProductRawMaterial invalid = new ProductRawMaterial(); invalid.setProduct(product); invalid.setRawMaterial(material); invalid.setRequiredQuantity(BigDecimal.ZERO);
        when(productRepository.findActiveOrderByPriceDesc(any(Page.class))).thenReturn(List.of(product));
        when(productRawMaterialRepository.findByProductIdsActive(anyList())).thenReturn(List.of(valid, invalid));
        assertThat(productionService.getSuggestion(10).getItems()).isEmpty();
    }

    @Test
    void truncatedCatalogDoesNotClaimACompleteCount() {
        var products = java.util.stream.LongStream.rangeClosed(1, 200).mapToObj(id -> {
            Product product = new Product(); product.setId(id); product.setPrice(BigDecimal.ONE); return product;
        }).toList();
        RawMaterial material = new RawMaterial(); material.setStockQuantity(BigDecimal.TEN);
        var recipes = products.stream().map(product -> {
            ProductRawMaterial recipe = new ProductRawMaterial(); recipe.setProduct(product); recipe.setRawMaterial(material);
            recipe.setRequiredQuantity(BigDecimal.ONE); return recipe;
        }).toList();
        when(productRepository.findActiveOrderByPriceDesc(any(Page.class))).thenReturn(products);
        when(productRawMaterialRepository.findByProductIdsActive(anyList())).thenReturn(recipes);
        var result = productionService.getSuggestion(1);
        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getTotalCount()).isNull();
    }
}
