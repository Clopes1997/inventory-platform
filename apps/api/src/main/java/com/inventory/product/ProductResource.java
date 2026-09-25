package com.inventory.product;

import com.inventory.common.PageDto;
import com.inventory.common.Roles;
import com.inventory.product.dto.ProductRequestDto;
import com.inventory.product.dto.ProductResponseDto;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;

@Path("/api/products")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProductResource {

    private final ProductService productService;

    @jakarta.ws.rs.core.Context
    SecurityContext securityContext;

    public ProductResource(ProductService productService) {
        this.productService = productService;
    }

    @GET
    public PageDto<ProductResponseDto> list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("50") int size,
            @QueryParam("all") @DefaultValue("false") boolean all) {
        if (all) {
            List<ProductResponseDto> content = productService.findAll();
            PageDto<ProductResponseDto> dto = new PageDto<>();
            dto.setContent(content);
            dto.setTotalElements(content.size());
            dto.setTotalPages(content.isEmpty() ? 0 : 1);
            dto.setNumber(0);
            dto.setSize(content.size());
            return dto;
        }
        return productService.findPage(page, size);
    }

    @GET
    @Path("/{id}")
    public ProductResponseDto get(@PathParam("id") Long id) {
        return productService.findById(id);
    }

    @POST
    public Response create(@Valid ProductRequestDto dto) {
        Roles.requireOperatorOrAdmin(securityContext);
        ProductResponseDto created = productService.create(dto, Roles.currentUsername(securityContext));
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public ProductResponseDto update(@PathParam("id") Long id, @Valid ProductRequestDto dto) {
        Roles.requireOperatorOrAdmin(securityContext);
        return productService.update(id, dto, Roles.currentUsername(securityContext));
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        Roles.requireOperatorOrAdmin(securityContext);
        productService.softDelete(id);
        return Response.noContent().build();
    }
}
