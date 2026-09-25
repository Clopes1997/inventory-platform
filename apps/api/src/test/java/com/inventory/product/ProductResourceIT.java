package com.inventory.product;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.*;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProductResourceIT {

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
    @DisplayName("GET /api/products returns 200 and empty list when no products exist")
    void list_empty() {
        given().auth().oauth2(token)
                .when().get("/api/products")
                .then()
                .statusCode(200)
                .body("content", hasSize(0));
    }

    @Test
    @Order(2)
    @DisplayName("POST /api/products returns 201 and created product with id")
    void create_returns_201_and_body() {
        var body = Map.of("code", "WIDGET", "name", "Widget", "price", 99.99);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .when().post("/api/products")
                .then()
                .statusCode(201)
                .body("id", notNullValue())
                .body("code", is("WIDGET"))
                .body("name", is("Widget"))
                .body("price", is(99.99f));
    }

    @Test
    @Order(3)
    @DisplayName("GET /api/products excludes soft-deleted products")
    void list_excludes_soft_deleted() {
        var body = Map.of("code", "P1", "name", "Product One", "price", 10.50);
        var id = given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .when().post("/api/products")
                .then().statusCode(201).extract().path("id");
        given().auth().oauth2(token).when().get("/api/products").then().statusCode(200).body("content", hasSize(2));
        given().auth().oauth2(token).when().delete("/api/products/" + id).then().statusCode(204);
        given().auth().oauth2(token).when().get("/api/products").then().statusCode(200).body("content", hasSize(1));
    }

    @Test
    @Order(4)
    @DisplayName("GET /api/products/{id} returns 200 and product body when found")
    void get_returns_200_and_body_when_found() {
        Long id = ((Number) given().auth().oauth2(token).when().get("/api/products")
                .then().statusCode(200).extract().path("content[0].id")).longValue();
        given().auth().oauth2(token).when().get("/api/products/" + id)
                .then()
                .statusCode(200)
                .body("id", is(id.intValue()))
                .body("code", notNullValue())
                .body("name", notNullValue())
                .body("price", notNullValue());
    }

    @Test
    @Order(5)
    @DisplayName("GET /api/products/{id} returns 404 when product not found")
    void get_returns_404_when_not_found() {
        given().auth().oauth2(token).when().get("/api/products/99999").then().statusCode(404);
    }

    @Test
    @Order(6)
    @DisplayName("PUT /api/products/{id} returns 200 and updated body")
    void update_returns_200_and_body() {
        Long id = ((Number) given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "UPD", "name", "To Update", "price", 5.0))
                .when().post("/api/products")
                .then().statusCode(201).extract().path("id")).longValue();
        given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "UPD", "name", "Updated Name", "price", 15.99))
                .when().put("/api/products/" + id)
                .then()
                .statusCode(200)
                .body("id", is(id.intValue()))
                .body("code", is("UPD"))
                .body("name", is("Updated Name"))
                .body("price", is(15.99f));
    }

    @Test
    @Order(7)
    @DisplayName("DELETE /api/products/{id} returns 204")
    void delete_returns_204() {
        Long id = ((Number) given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "DEL_" + System.currentTimeMillis(), "name", "To Delete", "price", 1.0))
                .when().post("/api/products")
                .then().statusCode(201).extract().path("id")).longValue();
        given().auth().oauth2(token).when().delete("/api/products/" + id).then().statusCode(204);
        given().auth().oauth2(token).when().get("/api/products/" + id).then().statusCode(404);
    }

    @Test
    @Order(8)
    @DisplayName("GET /api/products?all=true returns 200 and PageDto with all products")
    void list_with_all_true_returns_page_dto() {
        given().auth().oauth2(token)
                .when().get("/api/products?all=true")
                .then()
                .statusCode(200)
                .body("content", notNullValue())
                .body("totalElements", notNullValue())
                .body("totalPages", anyOf(is(0), is(1)))
                .body("number", is(0));
    }

    @Test
    @Order(9)
    @DisplayName("POST /api/products with blank code returns 400")
    void create_blank_code_returns_400() {
        var body = Map.of("code", "   ", "name", "A product", "price", 10.0);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .when().post("/api/products")
                .then()
                .statusCode(400)
                .body("message", notNullValue());
    }

    @Test
    @Order(10)
    @DisplayName("POST /api/products with negative price returns 400")
    void create_negative_price_returns_400() {
        var body = Map.of("code", "NEG", "name", "Negative", "price", -1.0);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .when().post("/api/products")
                .then()
                .statusCode(400)
                .body("message", notNullValue());
    }

    @Test
    @Order(11)
    @DisplayName("POST /api/products with duplicate code returns 409")
    void create_duplicate_code_returns_409() {
        var body = Map.of("code", "WIDGET", "name", "Another Widget", "price", 50.0);
        given().auth().oauth2(token).contentType(ContentType.JSON).body(body)
                .when().post("/api/products")
                .then()
                .statusCode(409)
                .body("message", containsString("already exists"));
    }

    @Test
    @Order(12)
    @DisplayName("GET /api/products/{id} with invalid id format returns 400")
    void get_invalid_id_returns_400() {
        given().auth().oauth2(token).when().get("/api/products/abc")
                .then()
                .statusCode(400)
                .body("message", notNullValue());
    }

    @Test
    @Order(13)
    @DisplayName("PUT /api/products/{id} with duplicate code returns 409")
    void update_duplicate_code_returns_409() {
        long p1Id = ((Number) given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "ALPHA", "name", "Alpha", "price", 1.0))
                .when().post("/api/products")
                .then().statusCode(201).extract().path("id")).longValue();
        long p2Id = ((Number) given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "BETA", "name", "Beta", "price", 2.0))
                .when().post("/api/products")
                .then().statusCode(201).extract().path("id")).longValue();
        given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("code", "ALPHA", "name", "Beta updated", "price", 2.0))
                .when().put("/api/products/" + p2Id)
                .then()
                .statusCode(409)
                .body("message", containsString("already exists"));
    }
}
