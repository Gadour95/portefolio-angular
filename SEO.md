# SEO & indexation — Portfolio d'Abdelkader SNIHA

Site : **https://www.abdelkadersniha.tn/**

Ce document récapitule tout ce qui a été mis en place et les actions à
effectuer **une seule fois** (Search Console, Bing) puis **après chaque
déploiement**.

---

## 1. Arborescence indexée

Conformément à la navigation publique, seules les pages du menu visiteur
sont déclarées dans le sitemap :

| Page du navbar | URL | Indexation | Priorité |
| --- | --- | --- | --- |
| Accueil | `https://www.abdelkadersniha.tn/` | index, follow | 1.0 |
| Projets | `https://www.abdelkadersniha.tn/projects` | index, follow | 0.9 |
| Services | `https://www.abdelkadersniha.tn/services` | index, follow | 0.8 |
| Contact | `https://www.abdelkadersniha.tn/#contact` | couvert par l'accueil | — |
| CV | `https://www.abdelkadersniha.tn/cv` | index, follow | 0.7 |

> **Contact** est une section de la page d'accueil (`/#contact`). Les
> moteurs de recherche ignorent les fragments `#…` dans un sitemap :
> cette page est donc couverte par l'URL racine.

Les pages **hors navbar** restent accessibles mais sont explicitement en
`noindex` : `/timeline`, `/skills`, `/technologies`, `/design-system`,
`/forbidden` et tout `/admin/*`. Les fiches projet `/projects/:slug`
restent indexables (contenu réel) mais ne figurent pas dans le sitemap,
comme demandé.

---

## 2. Ce qui a été mis en place

### Fichiers publics

| Fichier | Rôle |
| --- | --- |
| `public/robots.txt` | Autorise l'exploration, bloque l'admin et les pages techniques, déclare le sitemap |
| `public/sitemap.xml` | Les 4 URL publiques du navbar |
| `public/site.webmanifest` | Métadonnées d'application (icônes, thème, nom) |
| `public/humans.txt` | Informations auteur (bonus) |
| `public/images/og-cover.png` | Image de partage 1200 × 630 pour LinkedIn, Facebook, X, WhatsApp… |
| `public/icons/*.png` | Favicons 16/32, icône Apple 180, icônes 192/512 |
| `public/26c3cdd6ff3d453080ec75953aa3648e.txt` | Clé IndexNow (Bing, Yandex, Seznam, Naver) |

### Balises dans `src/index.html`

- Titre optimisé : `Abdelkader SNIHA — Ingénieur Logiciel Full Stack | Portfolio`
- Meta description, keywords, author, robots (Googlebot + Bingbot)
- URL canonique `https://www.abdelkadersniha.tn/`
- Open Graph complet (LinkedIn / Facebook / WhatsApp)
- Twitter Card `summary_large_image`
- `theme-color` clair et sombre
- Favicons + manifest + Apple Touch Icon
- **JSON-LD `Person`** : nom, poste, ville, compétences, langues
- **JSON-LD `WebSite`**
- Contenu `<noscript>` avec le nom, le profil et les liens du navbar
- Emplacements commentés pour les codes de vérification Google et Bing

### SEO dynamique (`src/app/core/seo/seo.service.ts`)

À chaque navigation, le service met à jour :

- le titre de la page,
- la meta description,
- la directive robots,
- l'URL canonique,
- les balises Open Graph et Twitter,
- un JSON-LD `WebPage` / `ProfilePage` + `BreadcrumbList`.

Les fiches projet mettent aussi à jour leur titre, description, image et
un JSON-LD `CreativeWork` avec les technologies utilisées.

Le schéma `Person` est automatiquement enrichi avec l'email, le
téléphone, la localisation et les réseaux sociaux saisis dans
**Administration → À propos → Liens**. Ajoutez-y LinkedIn, GitHub, Malt…
pour renforcer l'identité `sameAs`.

### Performance / qualité

Le build de production a été vérifié avec Lighthouse :

- SEO : **100 / 100**
- Accessibilité : **100 / 100**
- Bonnes pratiques : **100 / 100**

---

## 3. Déploiement

```powershell
npm run build
```

Le dossier à publier est :

```text
dist/portefolio/browser/
```

Sur ton VPS, la cible est **`/var/www/portfolio/frontend`**. Le pipeline
Jenkins actuel fait déjà :

```bash
rm -rf /var/www/portfolio/frontend/*
cp -r dist/portefolio/browser/* /var/www/portfolio/frontend/
```

Il n'y a donc **rien à changer dans le pipeline** pour que `robots.txt`,
`sitemap.xml`, `site.webmanifest`, les icônes et l'image sociale soient
déployés : ce sont des fichiers de `public/`, copiés automatiquement par
le build Angular.

### Vérification après déploiement

Sur le VPS :

```bash
ls -lah /var/www/portfolio/frontend

curl -sI https://www.abdelkadersniha.tn/robots.txt | grep -iE 'HTTP/|content-type'
curl -s  https://www.abdelkadersniha.tn/robots.txt | head

curl -sI https://www.abdelkadersniha.tn/sitemap.xml | grep -iE 'HTTP/|content-type'
curl -s  https://www.abdelkadersniha.tn/sitemap.xml | head

curl -s https://www.abdelkadersniha.tn/26c3cdd6ff3d453080ec75953aa3648e.txt
curl -sI https://www.abdelkadersniha.tn/images/og-cover.png | grep -iE 'HTTP/|content-type'
```

Résultat attendu :

| URL | Code | Content-Type |
| --- | --- | --- |
| `/robots.txt` | 200 | `text/plain` |
| `/sitemap.xml` | 200 | `application/xml` |
| `/26c3...txt` | 200 | `text/plain` (contenu = la clé) |
| `/images/og-cover.png` | 200 | `image/png` |

Si `robots.txt` renvoie `text/html`, c'est que le fichier n'est pas dans
`/var/www/portfolio/frontend` ou que nginx n'a pas été rechargé.

### Configuration nginx

La configuration actuelle fonctionne déjà pour ces fichiers :
`location / { try_files $uri $uri/ /index.html; }` sert le fichier réel
s'il existe, et ne retombe sur `index.html` que s'il est absent.

Pour garantir les bons types MIME et éviter toute ambiguïté, ajoute ces
blocs **exacts** dans le `server` de `www.abdelkadersniha.tn`, juste
après le bloc `location = /index.html` :

```nginx
    # ------------------------------------------------------------
    # Fichiers SEO et vérification : servis tels quels, sans SPA
    # ------------------------------------------------------------
    location = /robots.txt {
        try_files $uri =404;
        default_type text/plain;
        charset utf-8;
        add_header Cache-Control "public, max-age=3600";
    }

    location = /sitemap.xml {
        try_files $uri =404;
        default_type application/xml;
        charset utf-8;
        add_header Cache-Control "public, max-age=3600";
    }

    location = /site.webmanifest {
        try_files $uri =404;
        default_type application/manifest+json;
        add_header Cache-Control "public, max-age=3600";
    }

    location = /26c3cdd6ff3d453080ec75953aa3648e.txt {
        try_files $uri =404;
        default_type text/plain;
        charset utf-8;
        add_header Cache-Control "public, max-age=3600";
    }
```

Puis :

```bash
sudo nginx -t
sudo systemctl reload nginx
```

> N'utilise pas `add_header Content-Type ...` : cela peut créer un
> doublon d'en-tête. `default_type` est la bonne directive nginx.

### Pipeline Jenkins

Ajoute une étape IndexNow après `Verify Deployment` pour notifier Bing,
Yandex, Seznam et Naver à chaque déploiement :

```groovy
        stage('Submit to IndexNow') {
            steps {
                sh 'npm run seo:indexnow || true'
            }
        }
```

Et renforce la vérification :

```groovy
        stage('Verify Deployment') {
            steps {
                sh '''
                    set -e
                    ls -lah ${DEPLOY_DIR}
                    test -f ${DEPLOY_DIR}/index.html
                    test -f ${DEPLOY_DIR}/robots.txt
                    test -f ${DEPLOY_DIR}/sitemap.xml
                    test -f ${DEPLOY_DIR}/site.webmanifest

                    curl -fsSI https://www.abdelkadersniha.tn/ | head -n 1
                    curl -fsS https://www.abdelkadersniha.tn/robots.txt | grep -q "Sitemap:"
                    curl -fsS https://www.abdelkadersniha.tn/sitemap.xml | grep -q "<urlset"
                '''
            }
        }
```

Le `|| true` évite qu'une indisponibilité temporaire d'IndexNow fasse
échouer tout le déploiement.


---

## 4. Google Search Console (obligatoire)

1. Ouvrez <https://search.google.com/search-console>.
2. **Ajouter une propriété**.
   - Recommandé : type **Préfixe d'URL** avec
     `https://www.abdelkadersniha.tn/`.
   - Alternative : type **Domaine** avec `abdelkadersniha.tn` (validation
     par enregistrement DNS TXT).
3. Validez la propriété :
   - **DNS TXT** (recommandé, aucune modification du site), ou
   - balise meta : copiez le code fourni dans
     `src/index.html`, à l'emplacement indiqué
     (`<!-- Vérification des moteurs de recherche -->`), puis
     redéployez.
4. Allez dans **Sitemaps**, ajoutez :
   `https://www.abdelkadersniha.tn/sitemap.xml`, puis **Envoyer**.
5. Allez dans **Inspection de l'URL** et demandez l'indexation pour :
   - `https://www.abdelkadersniha.tn/`
   - `https://www.abdelkadersniha.tn/projects`
   - `https://www.abdelkadersniha.tn/services`
   - `https://www.abdelkadersniha.tn/cv`

L'indexation prend généralement de **quelques jours à quelques semaines**.
Une recherche `site:abdelkadersniha.tn` permet de vérifier les pages
indexées.

---

## 5. Bing Webmaster Tools et autres moteurs

1. Ouvrez <https://www.bing.com/webmasters>.
2. Connectez-vous, puis **Importer depuis Google Search Console**
   (le plus rapide), ou ajoutez le site manuellement.
3. Vérifiez le site (import automatique, ou balise meta / DNS).
4. Ajoutez le sitemap :
   `https://www.abdelkadersniha.tn/sitemap.xml`.
5. Bing alimente aussi **DuckDuckGo**, **Yahoo** et une partie de
   **Brave Search**. Pour Yandex et Seznam, IndexNow suffit.

### IndexNow — à lancer après chaque déploiement

La clé est déjà publiée à la racine du site. Après chaque mise à jour :

```powershell
npm run seo:indexnow
```

Cela notifie immédiatement Bing, Yandex, Seznam et Naver des 4 URL
publiques. Aucune action de vérification supplémentaire n'est requise.

---

## 6. Actions pour attirer les recruteurs

Le SEO technique est fait ; voici ce qui fera la différence :

### Contenu

- Rédigez des descriptions de projets **uniques et détaillées** :
  contexte, technologies, difficultés, résultats mesurables.
- Vérifiez que chaque projet a un slug lisible (`mon-projet`).
- Tenez le CV à jour (PDF) et le parcours professionnel.
- Publiez régulièrement : un nouveau projet ou un nouvel article est un
  signal fort pour les moteurs.

### Liens entrants (backlinks)

Depuis **Administration → À propos → Liens**, renseignez :

- LinkedIn
- GitHub
- Malt / Freelancer / Upwork
- Stack Overflow
- YouTube / X / Facebook si vous les utilisez

Ces liens alimentent automatiquement le `sameAs` du schéma `Person`.
Placez ensuite l'URL du portfolio dans la bio de chacun de ces profils.
Un lien depuis LinkedIn et GitHub est déjà très efficace pour la
recherche sur votre nom.

### Avis

Le module d'avis est déjà présent. Sollicitez des recommandations
LinkedIn et des avis clients : ils enrichissent la page d'accueil en
contenu unique.

### CV

Nommez le PDF avec votre nom (`Abdelkader-SNIHA-CV.pdf`) et gardez le
lien `/cv` comme point d'entrée.

---

## 7. Vérifications et outils utiles

- **Résultats enrichis Google** :
  <https://search.google.com/test/rich-results>
- **PageSpeed Insights** :
  <https://pagespeed.web.dev/>
- **Validateur Open Graph Facebook** :
  <https://developers.facebook.com/tools/debug/>
- **Inspecteur LinkedIn** (partage) :
  <https://www.linkedin.com/post-inspector/>
- **Validateur Twitter/X Card** :
  <https://cards-dev.twitter.com/validator>
- **Lighthouse** dans Chrome DevTools (onglet Lighthouse, catégorie SEO)
- **Validation du sitemap** :
  <https://www.xml-sitemaps.com/validate-xml-sitemap.html>

---

## 8. Point technique : SPA et indexation

Le portfolio est une **Single Page Application** : le contenu des
projets et des sections est chargé en JavaScript. Google et Bing savent
exécuter JavaScript, et les balises SEO sont désormais mises à jour
côté client. C'est suffisant pour être indexé.

Pour aller encore plus loin (et améliorer les aperçus sociaux), on peut
ensuite ajouter le **prerendering Angular** ou le **SSR** afin que le
HTML initial contienne déjà le contenu. Ce n'est pas indispensable pour
la recherche sur votre nom : les balises, le contenu `<noscript>`, les
JSON-LD et le sitemap couvrent déjà l'essentiel.

---

## 9. Fichiers modifiés / ajoutés

```text
src/index.html                                  Métadonnées, OG, Twitter, JSON-LD, noscript
src/app/app.routes.ts                           SEO par route + noindex pages hors navbar
src/app/app.config.ts                           Initialisation du SeoService
src/app/core/seo/seo.service.ts                 SEO dynamique et données structurées
src/app/features/portfolio/pages/project-detail/project-detail.component.ts
                                                SEO dynamique des fiches projet
public/robots.txt                               Règles des robots
public/sitemap.xml                              Sitemap public
public/site.webmanifest                         Manifeste web
public/humans.txt                               Informations auteur
public/images/og-cover.png                      Image de partage 1200 × 630
public/icons/                                   Favicons et icônes PWA
public/26c3cdd6ff3d453080ec75953aa3648e.txt     Clé IndexNow
scripts/submit-indexnow.mjs                     Soumission IndexNow
package.json                                    Script npm run seo:indexnow
```
