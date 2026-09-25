/**
 * API response and DTO types for the inventory backend.
 * Use these types in components and slices for typed API responses.
 * Backend uses BigDecimal for price/quantities; JSON serialization yields number.
 */

/** Monetary value (backend: BigDecimal). Use number in TS; validate min 0 in forms. */
export type Monetary = number;

/** Non-negative quantity (backend: BigDecimal). Use number in TS; validate in forms. */
export type Quantity = number;

export interface ProductDto {
  id: number;
  code: string;
  name: string;
  /** Unit price (backend BigDecimal). */
  price: Monetary;
  description?: string | null;
  categoryPath?: string | null;
  available?: boolean;
  finishedStock?: number;
  brandId?: number | null;
  cityId?: number | null;
  version?: number;
  adjustmentReason?: string;
}

export interface CatalogLookup { id: number; name: string; manufacturer?: string | null }

export interface RawMaterialDto {
  id: number;
  code: string;
  name: string;
  /** Stock on hand (backend BigDecimal). */
  stockQuantity: Quantity;
}

export interface ProductMaterialDto {
  id: number;
  rawMaterialId: number;
  rawMaterialCode: string;
  rawMaterialName: string;
  /** Required amount per product (backend BigDecimal). */
  requiredQuantity: Quantity;
}

export interface ProductionSuggestionItemDto {
  productId: number;
  productCode: string;
  productName: string;
  maxProducibleQuantity: Quantity;
  unitPrice: Monetary;
  lineValue: Monetary;
}

export interface ProductionSuggestionResponseDto {
  /** How the suggestion is computed: PER_PRODUCT_FEASIBILITY (per-product; no global allocation). */
  calculationMode?: string;
  items: ProductionSuggestionItemDto[];
  totalCount: number | null;
  totalProductionValue: Monetary;
}

export interface PageDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface UserDto {
  id: number;
  username: string;
  role: string;
}

export interface AuthResponseDto {
  token: string;
}

export interface ErrorResponseDto {
  message: string;
}

export interface DashboardStatsDto {
  productCount: number;
  rawMaterialCount: number;
  finishedStockUnits: number;
  finishedStockValue: number;
}
