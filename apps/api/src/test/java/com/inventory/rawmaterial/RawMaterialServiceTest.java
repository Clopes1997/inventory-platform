package com.inventory.rawmaterial;

import com.inventory.common.ConflictException;
import com.inventory.rawmaterial.dto.RawMaterialRequestDto;
import com.inventory.rawmaterial.dto.RawMaterialResponseDto;
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

@DisplayName("RawMaterialService")
class RawMaterialServiceTest {

    private RawMaterialRepository rawMaterialRepository;
    private RawMaterialService rawMaterialService;

    @BeforeEach
    void setUp() {
        rawMaterialRepository = mock(RawMaterialRepository.class);
        rawMaterialService = new RawMaterialService(rawMaterialRepository);
    }

    @Test
    @DisplayName("findAll returns list of all active raw materials as DTOs")
    void findAll_returns_list() {
        RawMaterial r1 = new RawMaterial();
        r1.setId(1L);
        r1.setCode("RM1");
        r1.setName("Steel");
        r1.setStockQuantity(new BigDecimal("100"));
        RawMaterial r2 = new RawMaterial();
        r2.setId(2L);
        r2.setCode("RM2");
        r2.setName("Copper");
        r2.setStockQuantity(new BigDecimal("50"));
        when(rawMaterialRepository.findAllActive()).thenReturn(List.of(r1, r2));

        List<RawMaterialResponseDto> result = rawMaterialService.findAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getCode()).isEqualTo("RM1");
        assertThat(result.get(1).getCode()).isEqualTo("RM2");
    }

    @Test
    @DisplayName("findAll returns empty list when no active raw materials")
    void findAll_returns_empty_when_none() {
        when(rawMaterialRepository.findAllActive()).thenReturn(List.of());

        List<RawMaterialResponseDto> result = rawMaterialService.findAll();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findPage returns PageDto with mapped content")
    void findPage_returns_pageDto() {
        RawMaterial r = new RawMaterial();
        r.setId(1L);
        r.setCode("RM1");
        r.setName("Steel");
        r.setStockQuantity(new BigDecimal("100.5"));
        when(rawMaterialRepository.findAllActive(any(Page.class))).thenReturn(List.of(r));
        when(rawMaterialRepository.countAllActive()).thenReturn(1L);

        var result = rawMaterialService.findPage(0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getCode()).isEqualTo("RM1");
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getNumber()).isZero();
        assertThat(result.getSize()).isEqualTo(20);
    }

    @Test
    @DisplayName("findById returns mapped DTO when found")
    void findById_returns_dto_when_found() {
        RawMaterial r = new RawMaterial();
        r.setId(1L);
        r.setCode("RM1");
        r.setName("Steel");
        r.setStockQuantity(new BigDecimal("50.25"));
        when(rawMaterialRepository.findByIdActive(1L)).thenReturn(Optional.of(r));

        RawMaterialResponseDto result = rawMaterialService.findById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getCode()).isEqualTo("RM1");
        assertThat(result.getStockQuantity()).isEqualByComparingTo(new BigDecimal("50.25"));
    }

    @Test
    @DisplayName("findById throws NotFoundException when not found")
    void findById_throws_when_not_found() {
        when(rawMaterialRepository.findByIdActive(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rawMaterialService.findById(999L))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("create persists and returns DTO")
    void create_persists_and_returns_dto() {
        when(rawMaterialRepository.existsByCodeExcludingId("NEW", null)).thenReturn(false);
        RawMaterial saved = new RawMaterial();
        saved.setId(1L);
        saved.setCode("NEW");
        saved.setName("New Raw");
        saved.setStockQuantity(new BigDecimal("10"));
        doAnswer(inv -> null).when(rawMaterialRepository).persist(any(RawMaterial.class));

        RawMaterialRequestDto dto = new RawMaterialRequestDto();
        dto.setCode("NEW");
        dto.setName("New Raw");
        dto.setStockQuantity(new BigDecimal("10"));

        RawMaterialResponseDto result = rawMaterialService.create(dto);

        assertThat(result.getCode()).isEqualTo("NEW");
        assertThat(result.getStockQuantity()).isEqualByComparingTo(new BigDecimal("10"));
        verify(rawMaterialRepository, atLeastOnce()).persist(argThat((RawMaterial r) -> true));
    }

    @Test
    @DisplayName("create throws ConflictException when code exists")
    void create_throws_conflict_when_code_exists() {
        when(rawMaterialRepository.existsByCodeExcludingId("DUP", null)).thenReturn(true);
        RawMaterialRequestDto dto = new RawMaterialRequestDto();
        dto.setCode("DUP");
        dto.setName("Dup");
        dto.setStockQuantity(BigDecimal.ONE);

        assertThatThrownBy(() -> rawMaterialService.create(dto))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already exists");
        verify(rawMaterialRepository, never()).persist(argThat((RawMaterial r) -> true));
    }

    @Test
    @DisplayName("update persists and returns DTO")
    void update_persists_and_returns_dto() {
        RawMaterial existing = new RawMaterial();
        existing.setId(1L);
        existing.setCode("OLD");
        existing.setName("Old");
        existing.setStockQuantity(BigDecimal.ONE);
        when(rawMaterialRepository.findByIdActive(1L)).thenReturn(Optional.of(existing));
        when(rawMaterialRepository.existsByCodeExcludingId("NEW", 1L)).thenReturn(false);

        RawMaterialRequestDto dto = new RawMaterialRequestDto();
        dto.setCode("NEW");
        dto.setName("Updated");
        dto.setStockQuantity(new BigDecimal("2.5"));

        RawMaterialResponseDto result = rawMaterialService.update(1L, dto);

        assertThat(result.getCode()).isEqualTo("NEW");
        assertThat(result.getStockQuantity()).isEqualByComparingTo(new BigDecimal("2.5"));
        verify(rawMaterialRepository, atLeastOnce()).persist(argThat((RawMaterial r) -> r == existing));
    }

    @Test
    @DisplayName("update throws NotFoundException when raw material not found")
    void update_throws_when_not_found() {
        when(rawMaterialRepository.findByIdActive(999L)).thenReturn(Optional.empty());
        RawMaterialRequestDto dto = new RawMaterialRequestDto();
        dto.setCode("X");
        dto.setName("X");
        dto.setStockQuantity(BigDecimal.ONE);

        assertThatThrownBy(() -> rawMaterialService.update(999L, dto))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("update throws ConflictException when code taken by another")
    void update_throws_conflict_when_code_taken() {
        RawMaterial existing = new RawMaterial();
        existing.setId(1L);
        when(rawMaterialRepository.findByIdActive(1L)).thenReturn(Optional.of(existing));
        when(rawMaterialRepository.existsByCodeExcludingId("TAKEN", 1L)).thenReturn(true);
        RawMaterialRequestDto dto = new RawMaterialRequestDto();
        dto.setCode("TAKEN");
        dto.setName("X");
        dto.setStockQuantity(BigDecimal.ONE);

        assertThatThrownBy(() -> rawMaterialService.update(1L, dto))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("softDelete sets deletedAt")
    void softDelete_sets_deletedAt() {
        RawMaterial r = new RawMaterial();
        r.setId(1L);
        when(rawMaterialRepository.findByIdActive(1L)).thenReturn(Optional.of(r));

        rawMaterialService.softDelete(1L);

        assertThat(r.getDeletedAt()).isNotNull();
        verify(rawMaterialRepository, atLeastOnce()).persist(argThat((RawMaterial x) -> x == r));
    }

    @Test
    @DisplayName("softDelete throws when not found")
    void softDelete_throws_when_not_found() {
        when(rawMaterialRepository.findByIdActive(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rawMaterialService.softDelete(999L))
                .isInstanceOf(NotFoundException.class);
    }
}
