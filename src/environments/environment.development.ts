export const environment = {
  production: false,

  apiUrl: 'http://localhost:8095',

  keycloak: {
    url: 'http://localhost:8080',
    realm: 'ecommerce-siw',
    clientId: 'frontend-admin',
    rolesClientId: 'ecommerce-spring'
  }
};