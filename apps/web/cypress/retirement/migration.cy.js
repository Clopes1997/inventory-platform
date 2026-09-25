describe('Retirement acceptance: migrated inventory visibility',()=>{
 it('authenticates and renders the imported catalog product',()=>{
  cy.task('migrationCredentials',null,{log:false}).then(({username,password,name})=>{
   cy.visit('/login');
   cy.get('#login-username').type(username);
   cy.get('#login-password').type(password,{log:false});
   cy.get('button[type="submit"]').click();
   cy.get('[data-testid="nav-products"]').click();
   cy.get('#filter-name').type(name,{parseSpecialCharSequences:false});
   cy.contains('button','Apply filters').click();
   cy.contains('td',name).should('be.visible');
  });
 });
});
