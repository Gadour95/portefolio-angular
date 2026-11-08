export const environment = {
  production: false,

  // Base de l'API backend (sans slash final).
  apiUrl: 'http://localhost:8056/api/v1',

  // Base des médias servis par le backend (sans slash final).
  mediaUrl: 'http://localhost:8056/media',

  keycloak: {
    url: 'http://localhost:8080',
    realm: 'portfolio-abdelkader',
    clientId: 'portfolio-frontend',
    rolesClientId: 'portfolio-spring'
  }
};
