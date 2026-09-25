package com.inventory.auth;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class UserResourceIT {

    private static String adminToken() {
        return given().contentType(ContentType.JSON)
                .body(Map.of("username", "inventory", "password", "inventory-test-password"))
                .when().post("/api/auth/login")
                .then().statusCode(200).extract().path("token");
    }

    @Test
    @DisplayName("GET /api/users/me returns current user (admin)")
    void me_returns_current_user() {
        String token = adminToken();
        given().auth().oauth2(token)
                .when().get("/api/users/me")
                .then()
                .statusCode(200)
                .body("username", is("inventory"))
                .body("role", is("ADMIN"))
                .body("id", notNullValue());
    }

    @Test
    @DisplayName("GET /api/users requires admin and returns list")
    void list_returns_users_for_admin() {
        String token = adminToken();
        given().auth().oauth2(token)
                .when().get("/api/users")
                .then()
                .statusCode(200)
                .body("", hasSize(greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("POST /api/users creates user when admin")
    void create_user_when_admin() {
        String token = adminToken();
        given().auth().oauth2(token).contentType(ContentType.JSON)
                .body(Map.of("username", "newuser", "password", "password123", "role", "VIEWER"))
                .when().post("/api/users")
                .then()
                .statusCode(201)
                .body("username", is("newuser"))
                .body("role", is("VIEWER"))
                .body("id", notNullValue());
    }
}
