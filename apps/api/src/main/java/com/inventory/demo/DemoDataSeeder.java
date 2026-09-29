package com.inventory.demo;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.inventory.auth.User;
import com.inventory.auth.UserRepository;
import com.inventory.product.Product;
import com.inventory.product.ProductRepository;
import com.inventory.productrawmaterial.ProductRawMaterial;
import com.inventory.productrawmaterial.ProductRawMaterialRepository;
import com.inventory.rawmaterial.RawMaterial;
import com.inventory.rawmaterial.RawMaterialRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.math.BigDecimal;

/**
 * Creates disposable data for local development only. The feature is disabled by
 * default and enabled exclusively by the {@code dev} profile configuration.
 */
@ApplicationScoped
public class DemoDataSeeder {

    static final String DEMO_USERNAME = "test";
    static final String DEMO_PASSWORD = "test";

    @ConfigProperty(name = "inventory.demo.seed.enabled", defaultValue = "false")
    boolean demoSeedEnabled;

    @Transactional
    void onStart(@Observes StartupEvent event,
                 UserRepository userRepository,
                 ProductRepository productRepository,
                 RawMaterialRepository rawMaterialRepository,
                 ProductRawMaterialRepository productRawMaterialRepository) {
        if (!demoSeedEnabled) {
            return;
        }

        createDemoUserIfMissing(userRepository);

        // Never mix the disposable catalog into an existing development catalog.
        if (productRepository.count() != 0 || rawMaterialRepository.count() != 0) {
            return;
        }

        RawMaterial canvas = rawMaterial("DEMO-CANVAS", "Demo canvas", "40.0000");
        RawMaterial thread = rawMaterial("DEMO-THREAD", "Demo thread", "250.0000");
        rawMaterialRepository.persist(canvas);
        rawMaterialRepository.persist(thread);

        Product tote = product(
                "DEMO-TOTE",
                "Demo tote bag",
                "89.90",
                "A reusable canvas tote used to exercise catalog, BOM, and stock screens.",
                "Demo/Accessories",
                12);
        Product pouch = product(
                "DEMO-POUCH",
                "Demo zipper pouch",
                "39.90",
                "A small canvas pouch used to exercise production feasibility.",
                "Demo/Accessories",
                20);
        productRepository.persist(tote);
        productRepository.persist(pouch);

        productRawMaterialRepository.persist(recipe(tote, canvas, "1.2500"));
        productRawMaterialRepository.persist(recipe(tote, thread, "10.0000"));
        productRawMaterialRepository.persist(recipe(pouch, canvas, "0.4000"));
        productRawMaterialRepository.persist(recipe(pouch, thread, "4.0000"));
    }

    private void createDemoUserIfMissing(UserRepository userRepository) {
        if (userRepository.findByUsername(DEMO_USERNAME).isPresent()) {
            return;
        }

        User user = new User();
        user.setUsername(DEMO_USERNAME);
        user.setPasswordHash(BCrypt.withDefaults().hashToString(10, DEMO_PASSWORD.toCharArray()));
        user.setRole("ADMIN");
        userRepository.persist(user);
    }

    private RawMaterial rawMaterial(String code, String name, String stockQuantity) {
        RawMaterial rawMaterial = new RawMaterial();
        rawMaterial.setCode(code);
        rawMaterial.setName(name);
        rawMaterial.setStockQuantity(new BigDecimal(stockQuantity));
        return rawMaterial;
    }

    private Product product(String code, String name, String price, String description, String categoryPath, long finishedStock) {
        Product product = new Product();
        product.setCode(code);
        product.setName(name);
        product.setPrice(new BigDecimal(price));
        product.setDescription(description);
        product.setCategoryPath(categoryPath);
        product.setFinishedStock(finishedStock);
        product.setAvailable(true);
        return product;
    }

    private ProductRawMaterial recipe(Product product, RawMaterial rawMaterial, String requiredQuantity) {
        ProductRawMaterial productRawMaterial = new ProductRawMaterial();
        productRawMaterial.setProduct(product);
        productRawMaterial.setRawMaterial(rawMaterial);
        productRawMaterial.setRequiredQuantity(new BigDecimal(requiredQuantity));
        return productRawMaterial;
    }
}
