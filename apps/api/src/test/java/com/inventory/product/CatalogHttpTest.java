package com.inventory.product;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import java.util.HashMap;
import java.util.Map;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.assertj.core.api.Assertions.assertThat;

@QuarkusTest
class CatalogHttpTest {
    @Inject EntityManager em;
    private String token() {
        return given().contentType(ContentType.JSON)
                .body(Map.of("username", "inventory", "password", "inventory-test-password"))
                .post("/api/auth/login").then().statusCode(200).extract().path("token");
    }

    @Test
    void catalogAndStockSurviveEditsAndNonzeroStockCannotBeArchived() {
        String token = token();
        Number brand = given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("name", "Imported brand", "manufacturer", "Original manufacturer"))
                .post("/api/catalog/brands").then().statusCode(201).extract().path("id");
        Number city = given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("name", "Imported city"))
                .post("/api/catalog/cities").then().statusCode(201).extract().path("id");
        var body = new HashMap<String, Object>(Map.of("code", "CATALOG-TEST", "name", "Same names are allowed",
                "price", "12.34", "finishedStock", 4, "brandId", brand, "cityId", city,
                "description", "<script>plain text</script>", "categoryPath", "legacy/category", "available", false));
        Number id = given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .post("/api/products").then().statusCode(201).body("finishedStock", is(4))
                .body("available", is(false)).body("description", is("<script>plain text</script>"))
                .extract().path("id");
        given().auth().oauth2(token).delete("/api/products/" + id).then().statusCode(409);
        body.put("finishedStock", 0); body.put("version", 0);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .put("/api/products/" + id).then().statusCode(200).body("version", is(1));
        body.put("finishedStock", 100);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .put("/api/products/" + id).then().statusCode(409);
        Number adjustments = (Number) em.createNativeQuery("SELECT COUNT(*) FROM stock_adjustment WHERE product_id=?1")
                .setParameter(1, id.longValue()).getSingleResult();
        assertThat(adjustments.longValue()).isEqualTo(2);
        given().auth().oauth2(token).delete("/api/products/" + id).then().statusCode(204);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .post("/api/products").then().statusCode(409);
    }

    @Test
    void fractionalStockAndExcessPricePrecisionAreRejected() {
        String token = token();
        given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "FRACTION", "name", "Invalid", "price", 1, "finishedStock", 1.5))
                .post("/api/products").then().statusCode(400);
        given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "PRECISION", "name", "Invalid", "price", "1.001"))
                .post("/api/products").then().statusCode(400);
    }
}
