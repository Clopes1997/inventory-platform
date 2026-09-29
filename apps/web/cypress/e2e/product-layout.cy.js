describe('Products filter layout', () => {
  beforeEach(() => cy.login());
  for (const [width, height] of [[1280, 800], [390, 844]]) {
    it(`keeps filters readable and usable at ${width}px`, () => {
      cy.viewport(width, height);
      if (width < 768) cy.get('[aria-label="Open menu"]').click();
      cy.get('[data-testid="nav-products"]').click();
      cy.get('.product-filters').should('be.visible');
      cy.get('.product-filters .form-group').each($group => {
        const label = $group.find('label')[0].getBoundingClientRect();
        const control = $group.find('input, select')[0].getBoundingClientRect();
        expect(control.top).to.be.at.least(label.bottom);
        expect(control.left).to.be.at.least(0);
        expect(control.right).to.be.at.most(width);
        expect(control.height).to.be.at.least(32);
        expect($group[0].getBoundingClientRect().height).to.be.lessThan(110);
      });
      cy.get('#filter-name').type('No product with this name');
      cy.contains('button', 'Apply filters').click();
      cy.contains('button', 'Clear filters').click();
      cy.get('#filter-name').should('have.value', '');
      cy.get('#filter-available').should('have.value', '');
      cy.get('.product-table table').should($table => expect($table[0].getBoundingClientRect().width).to.be.at.least(600));
      cy.scrollTo('top');
      cy.screenshot(`products-${width}`, {capture: 'viewport'});
    });
  }
});
