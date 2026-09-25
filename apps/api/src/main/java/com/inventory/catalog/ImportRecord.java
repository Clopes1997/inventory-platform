package com.inventory.catalog;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name = "import_record")
public class ImportRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    public String source;
    public String installation;
    @Column(name = "entity_type") public String entityType;
    @Column(name = "legacy_id") public String legacyId;
    @Column(name = "target_id") public Long targetId;
    public String fingerprint;
    @Column(name = "source_json", columnDefinition = "TEXT") public String sourceJson;
    @Column(name = "imported_at") public Instant importedAt;
}
