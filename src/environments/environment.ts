export const environment = {
  production: true,

  apiUrl: '/api-backend',

  keycloak: {
    url: 'https://auth.example.com',
    realm: 'ecommerce-siw',
    clientId: 'frontend-admin',
    rolesClientId: 'ecommerce-spring'
  }
};