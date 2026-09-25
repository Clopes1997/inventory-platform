package com.inventory;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.junit.jupiter.api.Test;
import java.sql.DriverManager;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

class SchemaSafetyTest {
    private String database() { return "jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1"; }

    @Test
    void restartPreservesExistingProductsAndDoesNotSeedExamples() throws Exception {
        String url = database();
        var flyway = Flyway.configure().dataSource(url, "sa", "").locations("db/consolidated").load();
        flyway.migrate();
        try (var connection = DriverManager.getConnection(url, "sa", ""); var statement = connection.createStatement()) {
            try (var result = statement.executeQuery("SELECT COUNT(*) FROM product")) {
                result.next(); assertThat(result.getInt(1)).isZero();
            }
            statement.executeUpdate("INSERT INTO product(code,name,price) VALUES ('SAVED','Retained record',12.34)");
            flyway.migrate();
            try (var result = statement.executeQuery("SELECT name,price FROM product WHERE code='SAVED'")) {
                assertThat(result.next()).isTrue();
                assertThat(result.getString(1)).isEqualTo("Retained record");
                assertThat(result.getBigDecimal(2)).isEqualByComparingTo("12.34");
            }
        }
    }

    @Test
    void legacyDatabaseFailsValidationWithoutRunningItsPendingDestructiveSeed() throws Exception {
        String url = database();
        Flyway.configure().dataSource(url, "sa", "").locations("db/migration").target("3").load().migrate();
        try (var connection = DriverManager.getConnection(url, "sa", ""); var statement = connection.createStatement()) {
            statement.executeUpdate("INSERT INTO product(code,name,price) VALUES ('LEGACY','Original',7.50)");
            var target = Flyway.configure().dataSource(url, "sa", "").locations("db/consolidated").load();
            assertThatThrownBy(target::migrate).isInstanceOf(FlywayException.class);
            try (var result = statement.executeQuery("SELECT COUNT(*) FROM product WHERE code='LEGACY'")) {
                result.next(); assertThat(result.getInt(1)).isEqualTo(1);
            }
        }
    }
}
