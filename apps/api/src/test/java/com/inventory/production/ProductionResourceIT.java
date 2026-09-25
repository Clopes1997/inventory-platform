package com.inventory.production;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProductionResourceIT {

    private static String token;

    @BeforeAll
    static void obtainToken() {
        token = given().contentType(ContentType.JSON)
                .body(Map.of("username", "inventory", "password", "inventory-test-password"))
                .when().post("/api/auth/login")
                .then().statusCode(200).extract().path("token");
    }

    @Test
    @Order(1)
    @DisplayName("GET /api/production/suggestion returns 200 and empty list when no products producible")
    void suggestion_empty() {
        given().auth().oauth2(token)
                .when().get("/api/production/suggestion")
                .then()
                .statusCode(200)
                .body("items", hasSize(0))
                .body("totalProductionValue", anyOf(is(0), is(0.0f)));
    }

    @Test
    @Order(2)
    @DisplayName("GET /api/production/suggestion returns producible products sorted by price desc")
    void suggestion_returns_sorted_and_total_value() {
        long productId = ((Number) given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "CHEAP", "name", "Cheap", "price", 5.0))
                .when().post("/api/products").then().statusCode(201).extract().path("id")).longValue();
        long expensiveProductId = ((Number) given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "EXP", "name", "Expensive", "price", 100.0))
                .when().post("/api/products").then().statusCode(201).extract().path("id")).longValue();
        long rawId = ((Number) given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "R", "name", "Raw", "stockQuantity", 50.0))
                .when().post("/api/raw-materials").then().statusCode(201).extract().path("id")).longValue();
        given().auth().oauth2(token).contentType(ContentType.JSON).body(Map.of("rawMaterialId", rawId, "requiredQuantity", 10.0))
                .when().post("/api/products/" + productId + "/materials").then().statusCode(201);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(Map.of("rawMaterialId", rawId, "requiredQuantity", 10.0))
                .when().post("/api/products/" + expensiveProductId + "/materials").then().statusCode(201);
        given().auth().oauth2(token)
                .when().get("/api/production/suggestion")
                .then()
                .statusCode(200)
                .body("items", hasSize(2))
                .body("items[0].productCode", is("EXP"))
                .body("items[0].maxProducibleQuantity", is(5))
                .body("items[1].productCode", is("CHEAP"))
                .body("items[1].maxProducibleQuantity", is(5))
                .body("totalProductionValue", is(525.0f));  // 5*100 + 5*5 = 525
    }
}
