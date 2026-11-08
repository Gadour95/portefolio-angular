export const environment = {
  production: true,

  // Base de l'API backend (sans slash final).
  apiUrl: '/api/v1',

  // Base des médias servis par le backend (sans slash final).
  mediaUrl: '/media',

  keycloak: {
    url: 'http://localhost:8080',
    realm: 'portfolio-abdelkader',
    clientId: 'portfolio-frontend',
    rolesClientId: 'portfolio-spring'
  }
};
