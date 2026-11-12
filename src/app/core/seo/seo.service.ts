import {
  DOCUMENT,
  isPlatformBrowser
} from '@angular/common';

import {
  Injectable,
  PLATFORM_ID,
  inject
} from '@angular/core';

import { Meta, Title } from '@angular/platform-browser';

import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router
} from '@angular/router';

import {
  catchError,
  filter,
  of
} from 'rxjs';

import { resolveMediaUrl } from '../http/media-url';

import { AboutPublic } from '../models/about.model';
import { ProjectPublic } from '../models/project.model';

import { AboutService } from '../services/about.service';

/** URL canonique de production du portfolio. */
export const SITE_URL = 'https://www.abdelkadersniha.tn';

export const SITE_NAME = 'Abdelkader SNIHA';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-cover.png`;

const DEFAULT_OG_IMAGE_ALT =
  'Abdelkader SNIHA — Ingénieur Logiciel Full Stack';

const DEFAULT_ROBOTS =
  'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

const NOINDEX_ROBOTS = 'noindex, follow';

export interface SeoBreadcrumb {
  name: string;
  path: string;
}

export interface SeoData {
  /** Titre affiché dans l'onglet et dans les résultats de recherche. */
  title: string;

  /** Meta description (idéalement entre 120 et 160 caractères). */
  description: string;

  /** Chemin canonique, commençant par « / ». */
  path: string;

  /** Directive robots. Par défaut : index, follow. */
  robots?: string;

  /** Type Open Graph. */
  type?: 'website' | 'profile' | 'article';

  /** Image de partage sociale (URL absolue ou chemin local). */
  image?: string;

  /** Fil d'Ariane utilisé pour le JSON-LD. */
  breadcrumb?: SeoBreadcrumb[];
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly aboutService = inject(AboutService);

  /**
   * Branche la mise à jour automatique des métadonnées sur chaque
   * navigation. À appeler depuis un initializer Angular.
   */
  init(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe(() => this.applyRouteSeo());

    this.enrichPersonSchema();
  }

  /**
   * Met à jour les métadonnées d'une fiche projet après chargement
   * des données depuis l'API.
   */
  setProject(project: ProjectPublic): void {
    const path = `/projects/${project.slug}`;
    const image =
      this.absoluteUrl(resolveMediaUrl(project.images?.[0])) ??
      DEFAULT_OG_IMAGE;

    const description = this.truncate(
      project.summary?.replace(/\s+/g, ' ').trim() ||
        `Projet ${project.title} réalisé par Abdelkader SNIHA.`,
      158
    );

    this.apply({
      title: `${project.title} — Projet d'Abdelkader SNIHA`,
      description,
      path,
      type: 'article',
      image,
      breadcrumb: [
        { name: 'Accueil', path: '/' },
        { name: 'Projets', path: '/projects' },
        { name: project.title, path }
      ]
    });

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CreativeWork',
          '@id': `${SITE_URL}${path}#project`,
          name: project.title,
          description: project.summary,
          url: `${SITE_URL}${path}`,
          image,
          inLanguage: this.currentLanguage(),
          dateModified: project.updatedAt,
          keywords: project.technologies
            ?.map(technology => technology.name)
            .filter(Boolean)
            .join(', '),
          author: {
            '@id': `${SITE_URL}/#person`
          }
        },
        this.buildBreadcrumbSchema([
          { name: 'Accueil', path: '/' },
          { name: 'Projets', path: '/projects' },
          { name: project.title, path }
        ])
      ]
    });
  }

  /** Marque une fiche projet introuvable comme non indexable. */
  setProjectNotFound(): void {
    this.apply({
      title: 'Projet introuvable — Abdelkader SNIHA',
      description:
        "Ce projet n'existe pas ou n'est plus disponible sur le portfolio d'Abdelkader SNIHA.",
      path: '/projects',
      robots: NOINDEX_ROBOTS,
      breadcrumb: [
        { name: 'Accueil', path: '/' },
        { name: 'Projets', path: '/projects' }
      ]
    });
  }

  /** Applique un jeu de métadonnées complet. */
  apply(seo: SeoData): void {
    const path = this.normalizePath(seo.path);
    const url = `${SITE_URL}${path}`;
    const image = this.absoluteUrl(seo.image) ?? DEFAULT_OG_IMAGE;
    const robots = seo.robots ?? DEFAULT_ROBOTS;
    const type = seo.type ?? 'website';

    this.title.setTitle(seo.title);

    this.meta.updateTag({
      name: 'description',
      content: seo.description
    });

    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({
      name: 'googlebot',
      content: robots
    });
    this.meta.updateTag({
      name: 'bingbot',
      content: robots
    });

    this.meta.updateTag({
      property: 'og:type',
      content: type
    });
    this.meta.updateTag({
      property: 'og:site_name',
      content: SITE_NAME
    });
    this.meta.updateTag({
      property: 'og:locale',
      content: 'fr_FR'
    });
    this.meta.updateTag({
      property: 'og:title',
      content: seo.title
    });
    this.meta.updateTag({
      property: 'og:description',
      content: seo.description
    });
    this.meta.updateTag({
      property: 'og:url',
      content: url
    });
    this.meta.updateTag({
      property: 'og:image',
      content: image
    });
    this.meta.updateTag({
      property: 'og:image:secure_url',
      content: image
    });
    this.meta.updateTag({
      property: 'og:image:alt',
      content: DEFAULT_OG_IMAGE_ALT
    });

    if (image === DEFAULT_OG_IMAGE) {
      this.meta.updateTag({
        property: 'og:image:type',
        content: 'image/png'
      });
      this.meta.updateTag({
        property: 'og:image:width',
        content: '1200'
      });
      this.meta.updateTag({
        property: 'og:image:height',
        content: '630'
      });
    } else {
      this.meta.removeTag('property="og:image:type"');
      this.meta.removeTag('property="og:image:width"');
      this.meta.removeTag('property="og:image:height"');
    }

    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });
    this.meta.updateTag({
      name: 'twitter:title',
      content: seo.title
    });
    this.meta.updateTag({
      name: 'twitter:description',
      content: seo.description
    });
    this.meta.updateTag({
      name: 'twitter:image',
      content: image
    });
    this.meta.updateTag({
      name: 'twitter:image:alt',
      content: DEFAULT_OG_IMAGE_ALT
    });

    this.setCanonical(url);
    this.setStructuredData(seo, url);
  }

  private applyRouteSeo(): void {
    const seo = this.resolveRouteSeo();

    if (!seo) {
      return;
    }

    this.apply(seo);
  }

  private resolveRouteSeo(): SeoData | null {
    let route: ActivatedRouteSnapshot | null =
      this.router.routerState.snapshot.root;

    let seo: SeoData | null = null;

    while (route) {
      const candidate = route.data?.['seo'] as SeoData | undefined;

      if (candidate) {
        seo = candidate;
      }

      route = route.firstChild;
    }

    return seo;
  }

  private setCanonical(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private setStructuredData(seo: SeoData, url: string): void {
    const breadcrumbs =
      seo.breadcrumb && seo.breadcrumb.length
        ? seo.breadcrumb
        : [{ name: 'Accueil', path: '/' }];

    const pageType =
      seo.type === 'profile' ? 'ProfilePage' : 'WebPage';

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': pageType,
          '@id': `${url}#webpage`,
          url,
          name: seo.title,
          description: seo.description,
          inLanguage: this.currentLanguage(),
          isPartOf: {
            '@id': `${SITE_URL}/#website`
          },
          about: {
            '@id': `${SITE_URL}/#person`
          },
          breadcrumb: {
            '@id': `${url}#breadcrumb`
          }
        },
        this.buildBreadcrumbSchema(breadcrumbs)
      ]
    });
  }

  private buildBreadcrumbSchema(
    breadcrumbs: SeoBreadcrumb[]
  ): Record<string, unknown> {
    return {
      '@type': 'BreadcrumbList',
      '@id': `${SITE_URL}${this.normalizePath(
        breadcrumbs[breadcrumbs.length - 1]?.path ?? '/'
      )}#breadcrumb`,
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${SITE_URL}${this.normalizePath(item.path)}`
      }))
    };
  }

  private setJsonLd(data: unknown): void {
    const id = 'page-jsonld';

    let script = this.document.getElementById(
      id
    ) as HTMLScriptElement | null;

    if (!script) {
      script = this.document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(data);
  }

  /**
   * Complète le schéma Person statique avec les coordonnées et les
   * réseaux sociaux saisis dans l'administration.
   */
  private enrichPersonSchema(): void {
    this.aboutService
      .getPublicAbout()
      .pipe(catchError(() => of(null)))
      .subscribe(about => {
        if (about) {
          this.updatePersonSchema(about);
        }
      });
  }

  private updatePersonSchema(about: AboutPublic): void {
    const script = this.document.getElementById(
      'person-jsonld'
    ) as HTMLScriptElement | null;

    if (!script?.textContent) {
      return;
    }

    try {
      const person = JSON.parse(script.textContent) as Record<
        string,
        unknown
      >;

      if (about.email) {
        person['email'] = about.email;
      }

      if (about.phones?.length) {
        person['telephone'] = about.phones[0];
      }

      if (about.description) {
        person['description'] = about.description;
      }

      if (about.location) {
        person['address'] = {
          '@type': 'PostalAddress',
          addressLocality: about.location,
          addressCountry: 'TN'
        };
      }

      const links = (about.links ?? [])
        .map(link => link.url)
        .filter(url => /^https?:\/\//i.test(url));

      if (links.length) {
        person['sameAs'] = Array.from(new Set(links));
      }

      script.textContent = JSON.stringify(person);
    } catch {
      // Le schéma statique reste valable si la personnalisation échoue.
    }
  }

  private currentLanguage(): string {
    return this.document.documentElement.lang || 'fr';
  }

  private normalizePath(path: string): string {
    if (!path || path === '/') {
      return '/';
    }

    return path.startsWith('/') ? path : `/${path}`;
  }

  private absoluteUrl(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    return `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 1).trimEnd()}…`;
  }
}
