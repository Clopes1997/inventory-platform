package com.inventory.dashboard;

import com.inventory.catalog.CatalogQuery;
import com.inventory.catalog.ProductFilter;
import com.inventory.rawmaterial.RawMaterialRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.math.BigDecimal;

@ApplicationScoped
public class DashboardService {
    @Inject CatalogQuery catalog;
    @Inject RawMaterialRepository materials;

    public DashboardStatsDto getStats() {
        var totals = catalog.stats(new ProductFilter());
        var result = new DashboardStatsDto();
        result.productCount = ((Number) totals.get("productCount")).longValue();
        result.rawMaterialCount = materials.countAllActive();
        result.finishedStockUnits = ((Number) totals.get("finishedStockUnits")).longValue();
        result.finishedStockValue = new BigDecimal(totals.get("finishedStockValue").toString());
        return result;
    }
}
