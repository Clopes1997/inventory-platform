package com.inventory.rawmaterial;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class RawMaterialResourceIT {

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
    @DisplayName("GET /api/raw-materials returns 200 and empty list when none exist")
    void list_empty() {
        given().auth().oauth2(token)
                .when().get("/api/raw-materials")
                .then()
                .statusCode(200)
                .body("content", hasSize(0));
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/raw-materials returns 201 and created raw material")
    void create_returns_201_and_body() {
        var body = Map.of("code", "STEEL", "name", "Steel", "stockQuantity", 100.5);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .when().post("/api/raw-materials")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("code", is("STEEL"))
                .body("name", is("Steel"))
                .body("stockQuantity", is(100.5f));
    }

    @Test
    @Order(3)
    @DisplayName("GET /api/raw-materials excludes soft-deleted")
    void list_excludes_soft_deleted() {
        var bodyA = Map.of("code", "RM_SOFT_A", "name", "Soft A", "stockQuantity", 50.0);
        var bodyB = Map.of("code", "RM_SOFT_B", "name", "Soft B", "stockQuantity", 25.0);
        var idA = given().auth().oauth2(token).contentType(ContentType.JSON).body(bodyA)
                .when().post("/api/raw-materials")
                .then().statusCode(201).extract().path("id");
        var idB = given().auth().oauth2(token).contentType(ContentType.JSON).body(bodyB)
                .when().post("/api/raw-materials")
                .then().statusCode(201).extract().path("id");
        int countBefore = given().auth().oauth2(token).when().get("/api/raw-materials")
                .then().statusCode(200).extract().path("content.size()");
        given().auth().oauth2(token).when().delete("/api/raw-materials/" + idB).then().statusCode(204);
        given().auth().oauth2(token).when().get("/api/raw-materials")
                .then().statusCode(200).body("content.size()", is(countBefore - 1));
        given().auth().oauth2(token).when().delete("/api/raw-materials/" + idA).then().statusCode(204);
    }

    @Test
    @Order(4)
    @DisplayName("GET /api/raw-materials?all=true returns 200 and PageDto with all active raw materials")
    void list_with_all_true_returns_page_dto() {
        given().auth().oauth2(token)
                .when().get("/api/raw-materials?all=true")
                .then()
                .statusCode(200)
                .body("content", notNullValue())
                .body("totalElements", notNullValue())
                .body("totalPages", anyOf(is(0), is(1)))
                .body("number", is(0));
    }

    @Test
    @Order(5)
    @DisplayName("GET /api/raw-materials/{id} returns 404 when not found")
    void get_returns_404_when_not_found() {
        given().auth().oauth2(token).when().get("/api/raw-materials/99999").then().statusCode(404);
    }

    @Test
    @Order(6)
    @DisplayName("POST /api/raw-materials with blank code returns 400")
    void create_blank_code_returns_400() {
        var body = Map.of("code", "   ", "name", "A raw", "stockQuantity", 10.0);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .when().post("/api/raw-materials")
                .then()
                .statusCode(400)
                .body("message", notNullValue());
    }

    @Test
    @Order(7)
    @DisplayName("POST /api/raw-materials with negative stockQuantity returns 400")
    void create_negative_stock_returns_400() {
        var body = Map.of("code", "NEGSTOCK", "name", "Negative", "stockQuantity", -5.0);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .when().post("/api/raw-materials")
                .then()
                .statusCode(400)
                .body("message", notNullValue());
    }

    @Test
    @Order(8)
    @DisplayName("POST /api/raw-materials with duplicate code returns 409")
    void create_duplicate_code_returns_409() {
        var code = "RM_DUP_" + System.currentTimeMillis();
        var body = Map.of("code", code, "name", "First", "stockQuantity", 10.0);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .when().post("/api/raw-materials")
                .then().statusCode(201);
        var duplicate = Map.of("code", code, "name", "Second", "stockQuantity", 20.0);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(duplicate)
                .when().post("/api/raw-materials")
                .then()
                .statusCode(409)
                .body("message", containsString("already exists"));
    }
}
