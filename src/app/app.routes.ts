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

        loadComponent: () =>
          import(
            './features/portfolio/pages/home/home.component'
          ).then(component =>
            component.HomeComponent
          )
      },

      {
        path: 'projects',

        loadComponent: () =>
          import(
            './features/portfolio/pages/projects/projects.component'
          ).then(component =>
            component.ProjectsComponent
          )
      },

      {
        path: 'projects/:slug',

        loadComponent: () =>
          import(
            './features/portfolio/pages/project-detail/project-detail.component'
          ).then(component =>
            component.ProjectDetailComponent
          )
      },

      {
        path: 'timeline',

        loadComponent: () =>
          import(
            './features/portfolio/pages/timeline/timeline.component'
          ).then(component =>
            component.TimelineComponent
          )
      },

      {
        path: 'skills',

        loadComponent: () =>
          import(
            './features/portfolio/pages/skills/skills.component'
          ).then(component =>
            component.SkillsComponent
          )
      },

      {
        path: 'technologies',

        loadComponent: () =>
          import(
            './features/portfolio/pages/technologies/technologies.component'
          ).then(component =>
            component.TechnologiesComponent
          )
      },

      {
        path: 'services',

        loadComponent: () =>
          import(
            './features/portfolio/pages/services/services.component'
          ).then(component =>
            component.ServicesComponent
          )
      },

      {
        path: 'cv',

        loadComponent: () =>
          import(
            './features/portfolio/pages/cv/cv.component'
          ).then(component =>
            component.CvComponent
          )
      },

      {
        path: 'design-system',

        loadComponent: () =>
          import(
            './features/design-system/design-system.component'
          ).then(component =>
            component.DesignSystemComponent
          )
      },

      {
        path: 'forbidden',

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
      roles: ['ADMIN']
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
