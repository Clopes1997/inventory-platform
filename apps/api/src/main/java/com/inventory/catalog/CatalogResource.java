package com.inventory.catalog;

import com.inventory.common.Roles;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import java.util.List;

@Path("/api/catalog")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CatalogResource {
    @Inject EntityManager em;
    @Inject CatalogQuery catalogQuery;
    @Context SecurityContext security;

    public record BrandInput(@NotBlank @Size(max = 255) String name, @Size(max = 255) String manufacturer) { }
    public record CityInput(@NotBlank @Size(max = 255) String name) { }

    @GET @Path("/products")
    public com.inventory.common.PageDto<com.inventory.product.dto.ProductResponseDto> products(
            @Valid @BeanParam ProductFilter filter, @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return catalogQuery.search(filter, page, size);
    }

    @GET @Path("/stats")
    public java.util.Map<String, Object> stats(@Valid @BeanParam ProductFilter filter) { return catalogQuery.stats(filter); }

    @GET @Path("/brands")
    public List<Brand> brands() { return em.createQuery("from Brand order by name, id", Brand.class).getResultList(); }

    @GET @Path("/cities")
    public List<City> cities() { return em.createQuery("from City order by name, id", City.class).getResultList(); }

    @POST @Path("/brands") @Transactional
    public Response createBrand(@Valid BrandInput input) {
        Roles.requireOperatorOrAdmin(security);
        Brand brand = new Brand(); brand.name = input.name().trim(); brand.manufacturer = input.manufacturer();
        em.persist(brand);
        return Response.status(201).entity(brand).build();
    }

    @POST @Path("/cities") @Transactional
    public Response createCity(@Valid CityInput input) {
        Roles.requireOperatorOrAdmin(security);
        City city = new City(); city.name = input.name().trim(); em.persist(city);
        return Response.status(201).entity(city).build();
    }
}
