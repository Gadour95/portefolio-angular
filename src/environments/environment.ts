export const environment = {
  production: true,

  // Base de l'API backend (sans slash final).
  apiUrl: '/api/v1',

  // Base des médias servis par le backend (sans slash final).
  mediaUrl: '/media',

  keycloak: {
    url: 'https://auth.abdelkadersniha.tn',
    realm: 'portfolio-abdelkader',
    clientId: 'portfolio-angular',
    rolesClientId: 'portfolio-spring'
  }
};