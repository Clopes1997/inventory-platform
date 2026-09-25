package com.inventory.product;

import com.inventory.common.Roles;
import com.inventory.productrawmaterial.ProductRawMaterialService;
import com.inventory.productrawmaterial.dto.ProductRawMaterialRequestDto;
import com.inventory.productrawmaterial.dto.ProductRawMaterialResponseDto;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;

@Path("/api/products/{productId}/materials")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductMaterialResource {

    private final ProductRawMaterialService productRawMaterialService;

    @jakarta.ws.rs.core.Context
    SecurityContext securityContext;

    public ProductMaterialResource(ProductRawMaterialService productRawMaterialService) {
        this.productRawMaterialService = productRawMaterialService;
    }

    @GET
    public List<ProductRawMaterialResponseDto> list(@PathParam("productId") Long productId) {
        return productRawMaterialService.findByProductId(productId);
    }

    @GET
    @Path("/{id}")
    public ProductRawMaterialResponseDto get(@PathParam("productId") Long productId, @PathParam("id") Long id) {
        return productRawMaterialService.findByIdAndProductId(id, productId);
    }

    @POST
    public Response add(@PathParam("productId") Long productId, @Valid ProductRawMaterialRequestDto dto) {
        Roles.requireOperatorOrAdmin(securityContext);
        ProductRawMaterialResponseDto created = productRawMaterialService.add(productId, dto);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public ProductRawMaterialResponseDto update(@PathParam("productId") Long productId,
                                                @PathParam("id") Long id,
                                                @Valid ProductRawMaterialRequestDto dto) {
        Roles.requireOperatorOrAdmin(securityContext);
        return productRawMaterialService.update(productId, id, dto);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("productId") Long productId, @PathParam("id") Long id) {
        Roles.requireOperatorOrAdmin(securityContext);
        productRawMaterialService.softDelete(productId, id);
        return Response.noContent().build();
    }
}
