package com.inventory.production;

import com.inventory.production.dto.ProductionSuggestionResponseDto;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

@Path("/api/production")
@Produces(MediaType.APPLICATION_JSON)
public class ProductionResource {

    private final ProductionService productionService;

    public ProductionResource(ProductionService productionService) {
        this.productionService = productionService;
    }

    /**
     * Returns a production suggestion: which products can be produced with current stock,
     * maximum producible quantity per product, ordered by unit price descending.
     * <p>
     * Max quantity is per product assuming all stock is available for that product;
     * shared raw materials are not allocated across products (per-product view, not global optimal).
     * <p>
     * Route: GET /api/production/suggestion
     * Query: limit (optional, default 500) — cap on the number of items returned.
     * This endpoint is read-only. Authentication (JWT) is required; no role restriction
     * is applied — any authenticated user (including VIEWER) may call it.
     */
    @GET
    @Path("/suggestion")
    public ProductionSuggestionResponseDto getSuggestion(
            @QueryParam("limit") @DefaultValue("500") int limit) {
        return productionService.getSuggestion(limit);
    }
}
