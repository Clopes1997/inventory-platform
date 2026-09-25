describe('Consolidated inventory workflows', () => {
  beforeEach(() => cy.login());

  it('creates and filters catalog data, preserves stock and rejects archival with stock', () => {
    const code = `SMOKE-${Date.now()}`;
    cy.get('[data-testid="nav-products"]').click();
    cy.get('[data-testid="link-new-product"]').click();
    cy.get('#product-code').type(code);
    cy.get('#product-name').type(code);
    cy.get('#product-price').type('12.34');
    cy.get('#product-stock').clear().type('4');
    cy.get('#product-description').type('<script>plain text</script>');
    cy.get('#product-category').type('legacy/path');
    cy.get('button[type="submit"]').contains('Create').click();
    cy.contains('h1', 'Edit Product');
    cy.get('#product-stock').should('have.value', '4');
    cy.get('#product-description').should('have.value', '<script>plain text</script>');
    cy.get('[data-testid="nav-products"]').click();
    cy.get('#filter-name').type(code);
    cy.contains('button', 'Apply filters').click();
    cy.contains('td', code).should('be.visible');
    cy.contains('Stock value: 49.36');
    cy.get('@apiToken').then(token => {
      cy.request({ url: '/api/catalog/products', qs: { name: code }, headers: { Authorization: `Bearer ${token}` } }).then(response => {
        const product = response.body.content[0];
        cy.request({ method: 'DELETE', url: `/api/products/${product.id}`, headers: { Authorization: `Bearer ${token}` }, failOnStatusCode: false })
          .its('status').should('equal', 409);
      });
    });
  });

  it('previews and applies an import and ends the session on reload', () => {
    const installation = `browser-${Date.now()}`;
    cy.contains('a', 'Import inventory').click();
    const bundle = { schemaVersion: 1, source: 'product-list', installation, entries: [
      { type: 'product', legacyId: '1', name: 'Browser imported product', price: '2.50', stock: 0, available: false },
    ] };
    cy.get('#import-file').selectFile({ contents: Cypress.Buffer.from(JSON.stringify(bundle)), fileName: 'bundle.json', mimeType: 'application/json' });
    cy.contains('1 records: 1 new, 0 already imported.');
    cy.contains('button', 'Apply reviewed import').click();
    cy.contains('Imported 1 records');
    cy.reload();
    cy.url().should('include', '/login');
    cy.window().then(window => expect(window.localStorage.getItem('inventory_token')).to.equal(null));
  });
});
