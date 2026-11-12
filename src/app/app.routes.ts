import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ----------------------------------------------------------
  // Site public
  // ----------------------------------------------------------

  {
    path: '',

    loadComponent: () =>
      import(
        './layouts/public-layout/public-layout.component'
      ).then(component =>
        component.PublicLayoutComponent
      ),

    children: [
      {
        path: '',
        pathMatch: 'full',

        data: {
          seo: {
            title:
              'Abdelkader SNIHA — Ingénieur Logiciel Full Stack | Portfolio',
            description:
              'Portfolio d’Abdelkader SNIHA, ingénieur logiciel full stack à Tunis : projets Angular, Spring Boot, DevOps, cloud et IA, services et CV à télécharger.',
            path: '/',
            type: 'profile',
            breadcrumb: [{ name: 'Accueil', path: '/' }]
          }
        },

        loadComponent: () =>
          import(
            './features/portfolio/pages/home/home.component'
          ).then(component =>
            component.HomeComponent
          )
      },

      {
        path: 'projects',

        data: {
          seo: {
            title: 'Projets & réalisations — Abdelkader SNIHA',
            description:
              'Découvrez les projets et réalisations d’Abdelkader SNIHA : applications web Angular, API Spring Boot, DevOps, cloud et intelligence artificielle.',
            path: '/projects',
            breadcrumb: [
              { name: 'Accueil', path: '/' },
              { name: 'Projets', path: '/projects' }
            ]
          }
        },

        loadComponent: () =>
          import(
            './features/portfolio/pages/projects/projects.component'
          ).then(component =>
            component.ProjectsComponent
          )
      },

      {
        path: 'projects/:slug',

        data: {
          seo: {
            title: 'Projet — Abdelkader SNIHA',
            description:
              'Projet réalisé par Abdelkader SNIHA, ingénieur logiciel full stack : technologies, rôle et résultats.',
            path: '/projects',
            type: 'article',
            breadcrumb: [
              { name: 'Accueil', path: '/' },
              { name: 'Projets', path: '/projects' }
            ]
          }
        },

        loadComponent: () =>
          import(
            './features/portfolio/pages/project-detail/project-detail.component'
          ).then(component =>
            component.ProjectDetailComponent
          )
      },

      {
        path: 'timeline',

        data: {
          seo: {
            title: 'Parcours — Abdelkader SNIHA',
            description:
              'Parcours professionnel et formation d’Abdelkader SNIHA, ingénieur logiciel full stack.',
            path: '/timeline',
            robots: 'noindex, follow',
            breadcrumb: [
              { name: 'Accueil', path: '/' },
              { name: 'Parcours', path: '/timeline' }
            ]
          }
        },

        loadComponent: () =>
          import(
            './features/portfolio/pages/timeline/timeline.component'
          ).then(component =>
            component.TimelineComponent
          )
      },

      {
        path: 'skills',

        data: {
          seo: {
            title: 'Compétences — Abdelkader SNIHA',
            description:
              'Compétences techniques d’Abdelkader SNIHA : Angular, TypeScript, Spring Boot, DevOps, cloud et intelligence artificielle.',
            path: '/skills',
            robots: 'noindex, follow',
            breadcrumb: [
              { name: 'Accueil', path: '/' },
              { name: 'Compétences', path: '/skills' }
            ]
          }
        },

        loadComponent: () =>
          import(
            './features/portfolio/pages/skills/skills.component'
          ).then(component =>
            component.SkillsComponent
          )
      },

      {
        path: 'technologies',

        data: {
          seo: {
            title: 'Technologies — Abdelkader SNIHA',
            description:
              'Technologies et outils utilisés par Abdelkader SNIHA au quotidien.',
            path: '/technologies',
            robots: 'noindex, follow',
            breadcrumb: [
              { name: 'Accueil', path: '/' },
              { name: 'Technologies', path: '/technologies' }
            ]
          }
        },

        loadComponent: () =>
          import(
            './features/portfolio/pages/technologies/technologies.component'
          ).then(component =>
            component.TechnologiesComponent
          )
      },

      {
        path: 'services',

        data: {
          seo: {
            title:
              'Services de développement web & logiciel — Abdelkader SNIHA',
            description:
              'Services d’Abdelkader SNIHA : développement d’applications web Angular, API et back-end Spring Boot, DevOps, cloud et conseil technique.',
            path: '/services',
            breadcrumb: [
              { name: 'Accueil', path: '/' },
              { name: 'Services', path: '/services' }
            ]
          }
        },

        loadComponent: () =>
          import(
            './features/portfolio/pages/services/services.component'
          ).then(component =>
            component.ServicesComponent
          )
      },

      {
        path: 'cv',

        data: {
          seo: {
            title:
              'CV — Abdelkader SNIHA, ingénieur logiciel full stack',
            description:
              'Consultez et téléchargez le CV d’Abdelkader SNIHA, ingénieur logiciel full stack : expérience, formation, compétences et coordonnées.',
            path: '/cv',
            breadcrumb: [
              { name: 'Accueil', path: '/' },
              { name: 'CV', path: '/cv' }
            ]
          }
        },

        loadComponent: () =>
          import(
            './features/portfolio/pages/cv/cv.component'
          ).then(component =>
            component.CvComponent
          )
      },

      {
        path: 'design-system',

        data: {
          seo: {
            title: 'Design system — Abdelkader SNIHA',
            description:
              'Documentation interne du design system du portfolio.',
            path: '/design-system',
            robots: 'noindex, nofollow',
            breadcrumb: [
              { name: 'Accueil', path: '/' },
              { name: 'Design system', path: '/design-system' }
            ]
          }
        },

        loadComponent: () =>
          import(
            './features/design-system/design-system.component'
          ).then(component =>
            component.DesignSystemComponent
          )
      },

      {
        path: 'forbidden',

        data: {
          seo: {
            title: 'Accès refusé — Abdelkader SNIHA',
            description: 'Accès refusé.',
            path: '/forbidden',
            robots: 'noindex, nofollow',
            breadcrumb: [
              { name: 'Accueil', path: '/' },
              { name: 'Accès refusé', path: '/forbidden' }
            ]
          }
        },

        loadComponent: () =>
          import(
            './features/access/forbidden.component'
          ).then(component =>
            component.ForbiddenComponent
          )
      }
    ]
  },

  // ----------------------------------------------------------
  // Administration
  // ----------------------------------------------------------

  {
    path: 'admin',

    canActivate: [authGuard],

    data: {
      roles: ['ADMIN'],

      seo: {
        title: 'Administration — Abdelkader SNIHA',
        description: 'Espace d’administration privé du portfolio.',
        path: '/admin',
        robots: 'noindex, nofollow',
        breadcrumb: [{ name: 'Administration', path: '/admin' }]
      }
    },

    loadComponent: () =>
      import(
        './layouts/admin-layout/admin-layout.component'
      ).then(component =>
        component.AdminLayoutComponent
      ),

    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },

      {
        path: 'dashboard',

        loadComponent: () =>
          import(
            './features/admin/dashboard/dashboard.component'
          ).then(component =>
            component.DashboardComponent
          )
      },

      {
        path: 'about',

        loadComponent: () =>
          import(
            './features/admin/about/about-admin.component'
          ).then(component =>
            component.AboutAdminComponent
          )
      },

      {
        path: 'cv',

        loadComponent: () =>
          import(
            './features/admin/cv/cv-admin.component'
          ).then(component =>
            component.CvAdminComponent
          )
      },

      {
        path: 'timeline',

        loadComponent: () =>
          import(
            './features/admin/timeline/timeline-admin.component'
          ).then(component =>
            component.TimelineAdminComponent
          )
      },

      {
        path: 'technologies',

        loadComponent: () =>
          import(
            './features/admin/technologies/technologies-admin.component'
          ).then(component =>
            component.TechnologiesAdminComponent
          )
      },

      {
        path: 'skills',

        loadComponent: () =>
          import(
            './features/admin/skills/skills-admin.component'
          ).then(component =>
            component.SkillsAdminComponent
          )
      },

      {
        path: 'categories',

        loadComponent: () =>
          import(
            './features/admin/categories/categories-admin.component'
          ).then(component =>
            component.CategoriesAdminComponent
          )
      },

      {
        path: 'services',

        loadComponent: () =>
          import(
            './features/admin/services/services-admin.component'
          ).then(component =>
            component.ServicesAdminComponent
          )
      },

      {
        path: 'projects',

        loadComponent: () =>
          import(
            './features/admin/projects/projects-admin.component'
          ).then(component =>
            component.ProjectsAdminComponent
          )
      },

      {
        path: 'projects/new',

        loadComponent: () =>
          import(
            './features/admin/project-form/project-form.component'
          ).then(component =>
            component.ProjectFormComponent
          )
      },

      {
        path: 'projects/:id/edit',

        loadComponent: () =>
          import(
            './features/admin/project-form/project-form.component'
          ).then(component =>
            component.ProjectFormComponent
          )
      },

      {
        path: 'reviews',

        loadComponent: () =>
          import(
            './features/admin/reviews/reviews-admin.component'
          ).then(component =>
            component.ReviewsAdminComponent
          )
      },

      {
        path: 'messages',

        loadComponent: () =>
          import(
            './features/admin/messages/messages-admin.component'
          ).then(component =>
            component.MessagesAdminComponent
          )
      }
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];
