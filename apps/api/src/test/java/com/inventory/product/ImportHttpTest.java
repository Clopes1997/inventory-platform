package com.inventory.product;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.assertj.core.api.Assertions.assertThat;

@QuarkusTest
class ImportHttpTest {
    @Inject EntityManager em;
    private String token() {
        return given().contentType(ContentType.JSON).body(Map.of("username", "inventory", "password", "inventory-test-password"))
                .post("/api/auth/login").then().statusCode(200).extract().path("token");
    }

    @Test
    void previewDoesNotWriteAndRepeatedImportPreservesIdentityAndReferences() {
        String token = token();
        var bundle = Map.of("schemaVersion", 1, "source", "product-manager", "installation", "fixture-a", "entries", List.of(
            Map.of("type", "brand", "legacyId", "99", "name", "Import brand", "manufacturer", "Factory"),
            Map.of("type", "city", "legacyId", "99", "name", "Import city"),
            Map.of("type", "product", "legacyId", "99", "name", "Import product", "price", "12.34", "stock", 3,
                "available", true, "brand", "99", "city", "99")
        ));
        given().auth().oauth2(token).contentType(ContentType.JSON).body(bundle).post("/api/imports/preview")
                .then().statusCode(200).body("newRecords", is(3)).body("errors", empty());
        assertThat(count("select count(*) from import_record where installation='fixture-a'")).isZero();
        given().auth().oauth2(token).contentType(ContentType.JSON).body(bundle).post("/api/imports/apply")
                .then().statusCode(200).body("newRecords", is(3));
        given().auth().oauth2(token).contentType(ContentType.JSON).body(bundle).post("/api/imports/apply")
                .then().statusCode(200).body("alreadyImported", is(3)).body("newRecords", is(0));
        assertThat(count("select count(*) from stock_adjustment where reason like 'Imported opening%'")).isEqualTo(1);
        given().auth().oauth2(token).queryParam("source","product-manager").queryParam("installation","fixture-a")
                .get("/api/imports/snapshot").then().statusCode(200)
                .body("entries",hasSize(3)).body("entries.find { it.type == 'product' }.price",is("12.34"))
                .body("entries.find { it.type == 'product' }.stock",is("3"))
                .body("entries.find { it.type == 'product' }.brand",is("99"));
        given().auth().oauth2(token).queryParam("name", "Import product").queryParam("minPrice", "12.00").queryParam("available", true)
                .get("/api/catalog/products").then().statusCode(200).body("content", hasSize(1)).body("content[0].finishedStock", is(3));
        given().auth().oauth2(token).queryParam("name", "Import product").queryParam("maxPrice", "12.50")
                .get("/api/catalog/stats").then().statusCode(200).body("productCount", is(1)).body("finishedStockValue", is(37.02f));
        given().auth().oauth2(token).queryParam("minPrice", 10).queryParam("maxPrice", 1)
                .get("/api/catalog/products").then().statusCode(400);
    }

    @Test
    void invalidReferencesRejectTheEntireImport() {
        var bundle = Map.of("source", "arquivel", "installation", "fixture-reject", "entries", List.of(
                Map.of("type", "city", "legacyId", "1", "name", "Must not be inserted"),
                Map.of("type", "product", "legacyId", "1", "name", "Invalid", "price", "1.00", "stock", 0, "available", true, "brand", "missing")
        ));
        given().auth().oauth2(token()).contentType(ContentType.JSON).body(bundle).post("/api/imports/apply")
                .then().statusCode(409);
        assertThat(count("select count(*) from city where name='Must not be inserted'")).isZero();
        assertThat(count("select count(*) from import_record where installation='fixture-reject'")).isZero();
    }

    private long count(String sql) { return ((Number) em.createNativeQuery(sql).getSingleResult()).longValue(); }
}
