/**
 * Soumet les pages publiques du portfolio à IndexNow.
 *
 * IndexNow est utilisé par Bing, Yandex, Seznam, Naver et d'autres
 * moteurs de recherche. Il complète le sitemap.xml pour accélérer
 * la découverte des pages après une mise à jour.
 *
 * Utilisation, après chaque déploiement :
 *   npm run seo:indexnow
 */

const HOST = 'https://www.abdelkadersniha.tn';

const KEY = '26c3cdd6ff3d453080ec75953aa3648e';

const KEY_LOCATION = `${HOST}/${KEY}.txt`;

const URLS = ['/', '/projects', '/services', '/cv'].map(
  path => `${HOST}${path}`
);

const ENDPOINT = 'https://api.indexnow.org/indexnow';

try {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: URLS
    })
  });

  if (response.ok) {
    console.log(
      `IndexNow OK (${response.status}) : ${URLS.length} URL(s) soumise(s).`
    );
  } else {
    console.error(
      `IndexNow a répondu ${response.status} : ${response.statusText}`
    );
    process.exitCode = 1;
  }
} catch (error) {
  console.error('Impossible de contacter IndexNow :', error);
  process.exitCode = 1;
}
