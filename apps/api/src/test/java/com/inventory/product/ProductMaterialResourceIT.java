package com.inventory.product;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProductMaterialResourceIT {

    private static String token;
    private static Long productId;
    private static Long rawMaterialId;

    @BeforeAll
    static void obtainToken() {
        token = given().contentType(ContentType.JSON)
                .body(Map.of("username", "inventory", "password", "inventory-test-password"))
                .when().post("/api/auth/login")
                .then().statusCode(200).extract().path("token");
    }

    @Test
    @Order(1)
    @DisplayName("Create product and raw material for material association tests")
    void setup() {
        productId = ((Number) given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "PROD1", "name", "Product 1", "price", 10.0))
                .when().post("/api/products")
                .then().statusCode(201).extract().path("id")).longValue();
        rawMaterialId = ((Number) given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "RM1", "name", "Raw 1", "stockQuantity", 100.0))
                .when().post("/api/raw-materials")
                .then().statusCode(201).extract().path("id")).longValue();
    }

    @Test
    @Order(2)
    @DisplayName("GET /api/products/{productId}/materials returns 200 and empty list")
    void list_empty() {
        given().auth().oauth2(token)
                .when().get("/api/products/" + productId + "/materials")
                .then()
                .statusCode(200)
                .body("", hasSize(0));
    }

    @Test
    @Order(3)
    @DisplayName("POST /api/products/{productId}/materials returns 201 and created association")
    void add_returns_201() {
        var body = Map.of("rawMaterialId", rawMaterialId, "requiredQuantity", 5.5);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .when().post("/api/products/" + productId + "/materials")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("rawMaterialId", is(rawMaterialId.intValue()))
                .body("requiredQuantity", is(5.5f));
    }

    @Test
    @Order(4)
    @DisplayName("GET /api/products/{productId}/materials/{id} returns 200 and body when found")
    void get_by_id_returns_200() {
        var id = given().auth().oauth2(token).when().get("/api/products/" + productId + "/materials")
                .then().statusCode(200).extract().path("[0].id");
        given().auth().oauth2(token).when().get("/api/products/" + productId + "/materials/" + id)
                .then()
                .statusCode(200)
                .body("id", is(id))
                .body("rawMaterialId", is(rawMaterialId.intValue()))
                .body("requiredQuantity", notNullValue());
    }

    @Test
    @Order(5)
    @DisplayName("PUT /api/products/{productId}/materials/{id} returns 200 and updated body")
    void update_returns_200() {
        var id = given().auth().oauth2(token).when().get("/api/products/" + productId + "/materials")
                .then().statusCode(200).extract().path("[0].id");
        given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("rawMaterialId", rawMaterialId, "requiredQuantity", 12.5))
                .when().put("/api/products/" + productId + "/materials/" + id)
                .then()
                .statusCode(200)
                .body("id", is(id))
                .body("requiredQuantity", is(12.5f));
    }

    @Test
    @Order(6)
    @DisplayName("GET list excludes soft-deleted associations")
    void list_excludes_soft_deleted() {
        given().auth().oauth2(token).when().get("/api/products/" + productId + "/materials")
                .then().statusCode(200).body("", hasSize(1));
        var id = given().auth().oauth2(token).when().get("/api/products/" + productId + "/materials")
                .then().extract().path("[0].id");
        given().auth().oauth2(token).when().delete("/api/products/" + productId + "/materials/" + id)
                .then().statusCode(204);
        given().auth().oauth2(token).when().get("/api/products/" + productId + "/materials")
                .then().statusCode(200).body("", hasSize(0));
    }

    @Test
    @Order(7)
    @DisplayName("GET /api/products/{productId}/materials/{id} returns 404 when not found")
    void get_returns_404_when_not_found() {
        given().auth().oauth2(token).when().get("/api/products/" + productId + "/materials/99999")
                .then().statusCode(404);
    }

    @Test
    @Order(8)
    @DisplayName("GET /api/products/{productId}/materials with invalid productId returns 400")
    void get_with_invalid_product_id_returns_400() {
        given().auth().oauth2(token).when().get("/api/products/abc/materials")
                .then()
                .statusCode(400)
                .body("message", notNullValue());
    }

    @Test
    @Order(9)
    @DisplayName("POST /api/products/{productId}/materials with requiredQuantity <= 0 returns 400")
    void add_invalid_required_quantity_returns_400() {
        var body = Map.of("rawMaterialId", rawMaterialId, "requiredQuantity", 0);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .when().post("/api/products/" + productId + "/materials")
                .then()
                .statusCode(400)
                .body("message", notNullValue());
    }

    @Test
    @Order(10)
    @DisplayName("POST /api/products/{productId}/materials duplicate (product, rawMaterial) returns 409")
    void add_duplicate_association_returns_409() {
        given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("rawMaterialId", rawMaterialId, "requiredQuantity", 5.5))
                .when().post("/api/products/" + productId + "/materials")
                .then().statusCode(201);
        given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("rawMaterialId", rawMaterialId, "requiredQuantity", 10.0))
                .when().post("/api/products/" + productId + "/materials")
                .then()
                .statusCode(409)
                .body("message", containsString("already has this raw material"));
    }
}
