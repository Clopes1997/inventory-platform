package com.inventory.rawmaterial;

import com.inventory.common.PageDto;
import com.inventory.common.Roles;
import com.inventory.rawmaterial.dto.RawMaterialRequestDto;
import com.inventory.rawmaterial.dto.RawMaterialResponseDto;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;

import java.util.List;


@Path("/api/raw-materials")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RawMaterialResource {

    private final RawMaterialService rawMaterialService;

    @jakarta.ws.rs.core.Context
    SecurityContext securityContext;

    public RawMaterialResource(RawMaterialService rawMaterialService) {
        this.rawMaterialService = rawMaterialService;
    }

    /**
     * Paginated list. Use ?all=true to return all active raw materials in a single page (PageDto shape).
     * Use ?all=true for dropdowns/selection (e.g. when adding materials to a product).
     */
    @GET
    public PageDto<RawMaterialResponseDto> list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("50") int size,
            @QueryParam("all") @DefaultValue("false") boolean all) {
        if (all) {
            List<RawMaterialResponseDto> content = rawMaterialService.findAll();
            PageDto<RawMaterialResponseDto> dto = new PageDto<>();
            dto.setContent(content);
            dto.setTotalElements(content.size());
            dto.setTotalPages(content.isEmpty() ? 0 : 1);
            dto.setNumber(0);
            dto.setSize(content.size());
            return dto;
        }
        return rawMaterialService.findPage(page, size);
    }

    @GET
    @Path("/{id}")
    public RawMaterialResponseDto get(@PathParam("id") Long id) {
        return rawMaterialService.findById(id);
    }

    @POST
    public Response create(@Valid RawMaterialRequestDto dto) {
        Roles.requireOperatorOrAdmin(securityContext);
        RawMaterialResponseDto created = rawMaterialService.create(dto);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public RawMaterialResponseDto update(@PathParam("id") Long id, @Valid RawMaterialRequestDto dto) {
        Roles.requireOperatorOrAdmin(securityContext);
        return rawMaterialService.update(id, dto);
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        Roles.requireOperatorOrAdmin(securityContext);
        rawMaterialService.softDelete(id);
        return Response.noContent().build();
    }
}
