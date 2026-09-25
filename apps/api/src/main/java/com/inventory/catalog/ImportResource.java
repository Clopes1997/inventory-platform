package com.inventory.catalog;

import com.inventory.common.Roles;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;

@Path("/api/imports") @Produces(MediaType.APPLICATION_JSON) @Consumes(MediaType.APPLICATION_JSON)
public class ImportResource {
    @Inject InventoryImporter importer;
    @Context SecurityContext security;
    @POST @Path("/preview")
    public InventoryImporter.Preview preview(@Valid ImportBundle bundle) {
        Roles.requireAdmin(security); return importer.preview(bundle);
    }
    @POST @Path("/apply")
    public InventoryImporter.Preview apply(@Valid ImportBundle bundle) {
        Roles.requireAdmin(security); return importer.apply(bundle, Roles.currentUsername(security));
    }
}
