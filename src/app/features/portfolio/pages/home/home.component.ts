import {
  Component,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';

import {
  catchError,
  of
} from 'rxjs';

import { AboutPublic } from '../../../../core/models/about.model';

import { AboutService } from '../../../../core/services/about.service';
import { LanguageService } from '../../../../core/services/language.service';

import {
  HeroSectionComponent
} from '../../sections/hero-section/hero-section.component';
import {
  TechnologiesSectionComponent
} from '../../sections/technologies-section/technologies-section.component';
import {
  AboutTimelineSectionComponent
} from '../../sections/about-timeline-section/about-timeline-section.component';
import {
  SkillsSectionComponent
} from '../../sections/skills-section/skills-section.component';
import {
  ServicesSectionComponent
} from '../../sections/services-section/services-section.component';
import {
  ProjectsSectionComponent
} from '../../sections/projects-section/projects-section.component';
import {
  ReviewsSectionComponent
} from '../../sections/reviews-section/reviews-section.component';
import {
  ContactSectionComponent
} from '../../sections/contact-section/contact-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSectionComponent,
    AboutTimelineSectionComponent,
    SkillsSectionComponent,
    ServicesSectionComponent,
    ProjectsSectionComponent,
    ReviewsSectionComponent,
    ContactSectionComponent
  ],

  template: `
    <div class="app-container flex flex-col gap-20 py-8 sm:py-12">
      <app-hero-section />

     <!-- <app-technologies-section /> -->

      <app-about-timeline-section [about]="about()" />

      <app-skills-section />

      <app-services-section />

      <app-projects-section />

      <app-reviews-section />

      <app-contact-section [about]="about()" />
    </div>
  `
})
export class HomeComponent {
  private readonly aboutService = inject(AboutService);
  private readonly language = inject(LanguageService);

  readonly about = signal<AboutPublic | null>(null);

  constructor() {
    effect(() => {
      this.language.current();

      untracked(() => this.loadAbout());
    });
  }

  private loadAbout(): void {
    this.aboutService
      .getPublicAbout()
      .pipe(catchError(() => of(null)))
      .subscribe(about => this.about.set(about));
  }
}
