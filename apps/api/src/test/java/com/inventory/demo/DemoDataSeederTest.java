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
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DemoDataSeederTest {

    @Test
    void doesNothingWhenTheDevelopmentSeedIsDisabled() {
        DemoDataSeeder seeder = new DemoDataSeeder();
        seeder.demoSeedEnabled = false;

        UserRepository users = mock(UserRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        RawMaterialRepository materials = mock(RawMaterialRepository.class);
        ProductRawMaterialRepository recipes = mock(ProductRawMaterialRepository.class);

        seeder.onStart(null, users, products, materials, recipes);

        verify(users, never()).persist(any(User.class));
        verify(products, never()).persist(any(Product.class));
        verify(materials, never()).persist(any(RawMaterial.class));
        verify(recipes, never()).persist(any(ProductRawMaterial.class));
    }

    @Test
    void seedsTheTestAdminAndSampleCatalogForAnEmptyDevelopmentDatabase() {
        DemoDataSeeder seeder = new DemoDataSeeder();
        seeder.demoSeedEnabled = true;

        UserRepository users = mock(UserRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        RawMaterialRepository materials = mock(RawMaterialRepository.class);
        ProductRawMaterialRepository recipes = mock(ProductRawMaterialRepository.class);
        when(users.findByUsername("test")).thenReturn(Optional.empty());
        when(products.count()).thenReturn(0L);
        when(materials.count()).thenReturn(0L);

        seeder.onStart(null, users, products, materials, recipes);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(users).persist(userCaptor.capture());
        User user = userCaptor.getValue();
        assertThat(user.getUsername()).isEqualTo("test");
        assertThat(user.getRole()).isEqualTo("ADMIN");
        assertThat(BCrypt.verifyer().verify("test".toCharArray(), user.getPasswordHash()).verified).isTrue();
        verify(products, times(2)).persist(any(Product.class));
        verify(materials, times(2)).persist(any(RawMaterial.class));
        verify(recipes, times(4)).persist(any(ProductRawMaterial.class));
    }

    @Test
    void doesNotMixTheDemoCatalogIntoAnExistingCatalog() {
        DemoDataSeeder seeder = new DemoDataSeeder();
        seeder.demoSeedEnabled = true;

        UserRepository users = mock(UserRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        RawMaterialRepository materials = mock(RawMaterialRepository.class);
        ProductRawMaterialRepository recipes = mock(ProductRawMaterialRepository.class);
        when(users.findByUsername("test")).thenReturn(Optional.of(new User()));
        when(products.count()).thenReturn(1L);

        seeder.onStart(null, users, products, materials, recipes);

        verify(products, never()).persist(any(Product.class));
        verify(materials, never()).persist(any(RawMaterial.class));
        verify(recipes, never()).persist(any(ProductRawMaterial.class));
    }
}
