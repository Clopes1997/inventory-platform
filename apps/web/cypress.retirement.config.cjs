const {defineConfig}=require('cypress');
module.exports=defineConfig({e2e:{
 supportFile:false,specPattern:'cypress/retirement/*.cy.js',video:false,screenshotOnRunFailure:false,
 setupNodeEvents(on){
  on('task',{migrationCredentials(){return {username:'rehearsal',password:process.env.INVENTORY_AUTH_PASSWORD,name:process.env.MIGRATION_PRODUCT_NAME};}});
 }
}});
