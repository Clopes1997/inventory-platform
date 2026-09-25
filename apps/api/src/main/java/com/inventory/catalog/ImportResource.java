package com.inventory.catalog;

import com.inventory.common.Roles;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

@Path("/api/imports") @Produces(MediaType.APPLICATION_JSON) @Consumes(MediaType.APPLICATION_JSON)
public class ImportResource {
    @Inject InventoryImporter importer;
    @Inject ReconciliationExport reconciliation;
    @Context SecurityContext security;
    @GET @Path("/snapshot")
    public ReconciliationExport.Snapshot snapshot(@QueryParam("source") String source, @QueryParam("installation") String installation) {
        Roles.requireAdmin(security);
        if (source == null || installation == null || source.length() > 64 || installation.length() > 64)
            throw new BadRequestException("Source and installation required");
        return reconciliation.export(source, installation);
    }
    @POST @Path("/preview")
    public InventoryImporter.Preview preview(@Valid ImportBundle bundle) {
        Roles.requireAdmin(security); return importer.preview(bundle);
    }
    @POST @Path("/apply")
    public InventoryImporter.Preview apply(@Valid ImportBundle bundle) {
        Roles.requireAdmin(security); return importer.apply(bundle, Roles.currentUsername(security));
    }
}
