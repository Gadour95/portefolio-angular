import { Component } from '@angular/core';

import {
  PagePlaceholderComponent
} from '../../../shared/components/page-placeholder/page-placeholder.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [PagePlaceholderComponent],

  template: `
    <app-page-placeholder
      eyebrowKey="adminNav.title"
      titleKey="adminPages.dashboard.title"
      subtitleKey="adminPages.dashboard.subtitle"
    />
  `
})
export class DashboardComponent {}
