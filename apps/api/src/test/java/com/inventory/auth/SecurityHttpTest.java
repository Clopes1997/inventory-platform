package com.inventory.auth;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static io.restassured.RestAssured.given;

@QuarkusTest
class SecurityHttpTest {
    @Inject UserRepository users;

    private String login(String username, String password) {
        return given().contentType(ContentType.JSON).body(Map.of("username", username, "password", password))
                .post("/api/auth/login").then().statusCode(200).extract().path("token");
    }

    @Test
    void permissionsAndDeletedIdentityAreEnforcedOverHttp() {
        given().get("/api/products").then().statusCode(401);
        String admin = login("inventory", "inventory-test-password");
        given().auth().oauth2(admin).contentType(ContentType.JSON)
                .body(Map.of("username", "http-viewer", "password", "viewer-test-password", "role", "VIEWER"))
                .post("/api/users").then().statusCode(201);
        String viewer = login("http-viewer", "viewer-test-password");
        given().auth().oauth2(viewer).get("/api/products").then().statusCode(200);
        given().get("/api/imports/snapshot?source=autoflex&installation=fixture").then().statusCode(401);
        given().auth().oauth2(viewer).get("/api/imports/snapshot?source=autoflex&installation=fixture").then().statusCode(403);
        given().auth().oauth2(viewer).contentType(ContentType.JSON)
                .body(Map.of("code", "FORBIDDEN", "name", "Blocked", "price", 1))
                .post("/api/products").then().statusCode(403);
        QuarkusTransaction.requiringNew().run(() -> users.delete(users.findByUsername("http-viewer").orElseThrow()));
        given().auth().oauth2(viewer).get("/api/products").then().statusCode(401);
    }
}
