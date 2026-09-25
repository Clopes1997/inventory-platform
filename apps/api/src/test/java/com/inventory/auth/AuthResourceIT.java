package com.inventory.auth;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class AuthResourceIT {

    @Test
    @DisplayName("POST /api/auth/login with valid credentials returns 200 and token")
    void login_success() {
        given().contentType(ContentType.JSON)
                .body(Map.of("username", "inventory", "password", "inventory-test-password"))
                .when().post("/api/auth/login")
                .then()
                .statusCode(200)
                .body("token", notNullValue());
    }

    @Test
    @DisplayName("POST /api/auth/login with invalid password returns 401")
    void login_invalid_password() {
        given().contentType(ContentType.JSON)
                .body(Map.of("username", "inventory", "password", "wrong"))
                .when().post("/api/auth/login")
                .then()
                .statusCode(401)
                .body("message", notNullValue());
    }

    @Test
    @DisplayName("GET /api/products without token returns 401")
    void api_without_token_returns_401() {
        given()
                .when().get("/api/products")
                .then()
                .statusCode(401);
    }

    @Test
    @DisplayName("POST /api/products as VIEWER returns 403 Forbidden")
    void viewer_cannot_create_product_returns_403() {
        String adminToken = given().contentType(ContentType.JSON)
                .body(Map.of("username", "inventory", "password", "inventory-test-password"))
                .when().post("/api/auth/login")
                .then().statusCode(200).extract().path("token");

        given().auth().oauth2(adminToken).contentType(ContentType.JSON)
                .body(Map.of("username", "viewer_403_test", "password", "viewer123", "role", "VIEWER"))
                .when().post("/api/users")
                .then()
                .statusCode(anyOf(equalTo(201), equalTo(409)));

        String viewerToken = given().contentType(ContentType.JSON)
                .body(Map.of("username", "viewer_403_test", "password", "viewer123"))
                .when().post("/api/auth/login")
                .then().statusCode(200).extract().path("token");

        given().auth().oauth2(viewerToken).contentType(ContentType.JSON)
                .body(Map.of("code", "VW", "name", "Viewer Product", "price", 10.0))
                .when().post("/api/products")
                .then()
                .statusCode(403)
                .body("message", notNullValue());
    }
}
