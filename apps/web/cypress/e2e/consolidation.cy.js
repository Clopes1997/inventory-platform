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

  it('ends the session on reload', () => {
    cy.reload();
    cy.url().should('include', '/login');
    cy.window().then(window => expect(window.localStorage.getItem('inventory_token')).to.equal(null));
  });
});
