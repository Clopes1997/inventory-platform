CREATE TABLE import_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(32) NOT NULL,
    installation VARCHAR(64) NOT NULL,
    entity_type VARCHAR(16) NOT NULL,
    legacy_id VARCHAR(64) NOT NULL,
    target_id BIGINT NOT NULL,
    fingerprint VARCHAR(64) NOT NULL,
    source_json TEXT NOT NULL,
    imported_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_import_identity UNIQUE (source, installation, entity_type, legacy_id)
);
