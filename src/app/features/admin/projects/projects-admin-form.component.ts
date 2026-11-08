import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import {
  MessageService
} from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import { finalize } from 'rxjs';

import {
  ApiError
} from '../../../core/models/api-error.model';

import {
  LocalizedText
} from '../../../core/models/common.model';

import {
  ProjectAdmin,
  ProjectAdminRequest
} from '../../../core/models/project.model';

import {
  Technology
} from '../../../core/models/technology.model';

import {
  ProjectService
} from '../../../core/services/project.service';

import {
  TechnologyService
} from '../../../core/services/technology.service';

import {
  ProjectMediaManagerComponent
} from './project-media-manager.component';

type LocalizedField = 'title' | 'summary' | 'role';
type AppLang = 'fr' | 'en' | 'ar';

interface LanguageOption {
  code: AppLang;
  label: string;
  dir: 'ltr' | 'rtl';
}

@Component({
  selector: 'app-admin-project-form',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    MultiSelectModule,
    TextareaModule,
    TooltipModule,
    ProjectMediaManagerComponent
  ],

  template: `
    <div class="space-y-6 pb-12">
      <section class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <a
            routerLink="/admin/projects"
            class="inline-flex items-center gap-2 text-xs font-bold
                   uppercase tracking-[0.14em]
                   text-[var(--p-primary-color)] hover:underline"
          >
            <i class="pi pi-arrow-left text-[0.65rem] rtl:rotate-180"></i>
            {{ 'adminProjects.back' | translate }}
          </a>

          <h1
            class="mt-2 text-2xl font-bold tracking-[-0.035em]
                   sm:text-3xl"
          >
            {{
              (isEditMode()
                ? 'adminProjects.editTitle'
                : 'adminProjects.createTitle') | translate
            }}
          </h1>

          <p class="mt-1 max-w-2xl app-muted text-sm">
            {{ 'adminPages.projectForm.subtitle' | translate }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <p-button
            [label]="'adminProjects.cancel' | translate"
            severity="secondary"
            [outlined]="true"
            [disabled]="saving()"
            (onClick)="cancel()"
          />

          <p-button
            icon="pi pi-check"
            [label]="'adminProjects.save' | translate"
            [loading]="saving()"
            [disabled]="saving() || loadingProject()"
            (onClick)="save()"
          />
        </div>
      </section>

      @if (loadError(); as error) {
        <p-message severity="error" styleClass="w-full">
          {{ error }}
        </p-message>
      }

      @if (formError(); as error) {
        <p-message severity="error" styleClass="w-full">
          {{ error }}
        </p-message>
      }

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
        <!-- Informations générales -->
        <p-card styleClass="rounded-2xl">
          <div class="space-y-5">
            <div>
              <h2 class="text-base font-bold">
                {{ 'adminProjects.generalInfo' | translate }}
              </h2>

              <p class="text-xs app-muted mt-0.5">
                {{ 'adminPages.projects.subtitle' | translate }}
              </p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <div class="flex items-center justify-between">
                  <label for="project-slug" class="app-label">
                    {{ 'adminProjects.slug' | translate }}
                    <span class="text-red-500" aria-hidden="true">*</span>
                  </label>

                  <button
                    type="button"
                    class="text-xs font-semibold
                           text-[var(--p-primary-color)] hover:underline"
                    (click)="generateSlugFromTitle()"
                  >
                    {{ 'adminProjects.slugAuto' | translate }}
                  </button>
                </div>

                <input
                  pInputText
                  id="project-slug"
                  formControlName="slug"
                  class="w-full font-mono text-sm"
                  placeholder="mon-projet-web"
                  autocomplete="off"
                  [readonly]="saving()"
                />

                <p class="mt-1.5 text-xs app-muted">
                  {{ 'adminProjects.slugHelp' | translate }}
                </p>
              </div>

              <div>
                <label for="project-position" class="app-label">
                  {{ 'adminProjects.position' | translate }}
                </label>

                <p-inputnumber
                  inputId="project-position"
                  formControlName="position"
                  [min]="0"
                  [showButtons]="true"
                  [readonly]="saving()"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                />

                <p class="mt-1.5 text-xs app-muted">
                  {{ 'adminProjects.positionHelp' | translate }}
                </p>
              </div>
            </div>

            <div>
              <label for="project-technologies" class="app-label">
                {{ 'adminProjects.technologies' | translate }}
              </label>

              <p-multiselect
                inputId="project-technologies"
                [options]="technologies()"
                optionLabel="name"
                optionValue="id"
                formControlName="technologyIds"
                [filter]="true"
                [placeholder]="
                  'adminProjects.selectTechnologies' | translate
                "
                styleClass="w-full"
                display="chip"
              />
            </div>

            <div
              class="grid gap-4 sm:grid-cols-2 pt-2
                     border-t border-[var(--app-border)]"
            >
              <div
                class="flex items-start gap-3 rounded-xl
                       border border-[var(--app-border)] p-3.5"
              >
                <p-checkbox
                  inputId="project-published"
                  formControlName="published"
                  [binary]="true"
                  [disabled]="saving()"
                />

                <label for="project-published" class="cursor-pointer">
                  <span class="block text-sm font-semibold">
                    {{ 'adminProjects.published' | translate }}
                  </span>

                  <span class="block text-xs app-muted mt-0.5">
                    {{ 'adminProjects.publishedHelp' | translate }}
                  </span>
                </label>
              </div>

              <div
                class="flex items-start gap-3 rounded-xl
                       border border-[var(--app-border)] p-3.5"
              >
                <p-checkbox
                  inputId="project-featured"
                  formControlName="featured"
                  [binary]="true"
                  [disabled]="saving()"
                />

                <label for="project-featured" class="cursor-pointer">
                  <span class="block text-sm font-semibold">
                    {{ 'adminProjects.featured' | translate }}
                  </span>

                  <span class="block text-xs app-muted mt-0.5">
                    {{ 'adminProjects.featuredHelp' | translate }}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </p-card>

        <!-- Contenu traduit -->
        <p-card styleClass="rounded-2xl">
          <div class="space-y-6">
            <div>
              <h2 class="text-base font-bold">
                {{ 'adminProjects.localizedContent' | translate }}
              </h2>

              <p class="text-xs app-muted mt-0.5">
                {{ 'adminProjects.localizedContentHelp' | translate }}
              </p>
            </div>

            @for (field of localizedFields; track field.key) {
              <div class="rounded-2xl bg-[var(--app-surface-muted)] p-4">
                <label class="app-label">
                  {{ field.labelKey | translate }}
                  <span class="text-red-500" aria-hidden="true">*</span>
                </label>

                <div class="mt-3 grid gap-4">
                  @for (lang of languages; track lang.code) {
                    <div>
                      <label
                        [for]="
                          'project-' + field.key + '-' + lang.code
                        "
                        class="mb-1.5 flex items-center gap-2
                               text-xs font-semibold app-muted"
                      >
                        <span
                          class="inline-flex min-w-16 items-center
                                 justify-center rounded-md
                                 bg-[var(--app-surface)] px-2 py-0.5"
                        >
                          {{ lang.label }}
                        </span>

                        <span class="uppercase tracking-wide">
                          {{ lang.code }}
                        </span>
                      </label>

                      @if (field.multiline) {
                        <textarea
                          pTextarea
                          [id]="
                            'project-' + field.key + '-' + lang.code
                          "
                          [rows]="field.rows ?? 3"
                          [formControl]="
                            localizedControl(field.key, lang.code)
                          "
                          class="w-full text-sm"
                          [dir]="lang.dir"
                          [readonly]="saving()"
                        ></textarea>
                      } @else {
                        <input
                          pInputText
                          [id]="
                            'project-' + field.key + '-' + lang.code
                          "
                          [formControl]="
                            localizedControl(field.key, lang.code)
                          "
                          class="w-full text-sm"
                          [dir]="lang.dir"
                          autocomplete="off"
                          [placeholder]="
                            field.placeholderKey
                              ? (field.placeholderKey | translate)
                              : ''
                          "
                          [readonly]="saving()"
                        />
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </p-card>

        <!-- Liens externes -->
        <p-card styleClass="rounded-2xl">
          <div class="space-y-5">
            <div>
              <h2 class="text-base font-bold">
                {{ 'adminProjects.linksSection' | translate }}
              </h2>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label for="project-demo-url" class="app-label">
                  <i class="pi pi-external-link text-xs mr-1"></i>
                  {{ 'adminProjects.demoUrl' | translate }}
                </label>

                <input
                  pInputText
                  id="project-demo-url"
                  formControlName="demoUrl"
                  class="w-full text-sm"
                  placeholder="https://monprojet.com"
                  [readonly]="saving()"
                />
              </div>

              <div>
                <label for="project-repo-url" class="app-label">
                  <i class="pi pi-github text-xs mr-1"></i>
                  {{ 'adminProjects.repoUrl' | translate }}
                </label>

                <input
                  pInputText
                  id="project-repo-url"
                  formControlName="repoUrl"
                  class="w-full text-sm"
                  placeholder="https://github.com/moncompte/monprojet"
                  [readonly]="saving()"
                />
              </div>
            </div>
          </div>
        </p-card>

        <!-- Images + vidéo -->
        <app-project-media-manager
          [images]="imagesList()"
          [video]="form.controls.video.value"
          (imagesChange)="onImagesChange($event)"
          (videoChange)="onVideoChange($event)"
        />

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-4">
          <p-button
            [label]="'adminProjects.cancel' | translate"
            severity="secondary"
            [outlined]="true"
            [disabled]="saving()"
            (onClick)="cancel()"
          />

          <p-button
            type="submit"
            icon="pi pi-check"
            [label]="'adminProjects.save' | translate"
            [loading]="saving()"
            [disabled]="saving() || loadingProject()"
          />
        </div>
      </form>
    </div>
  `
})
export class ProjectFormComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly technologyService = inject(TechnologyService);
  private readonly translate = inject(TranslateService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEditMode = signal(false);
  readonly projectId = signal<string | null>(null);

  readonly loadingProject = signal(false);
  readonly saving = signal(false);

  readonly loadError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly serverFieldErrors = signal<Record<string, string>>({});

  readonly technologies = signal<Technology[]>([]);

  readonly imagesList = signal<string[]>([]);

  readonly languages: LanguageOption[] = [
    { code: 'fr', label: 'Français', dir: 'ltr' },
    { code: 'en', label: 'English', dir: 'ltr' },
    { code: 'ar', label: 'العربية', dir: 'rtl' }
  ];

  readonly localizedFields: {
    key: LocalizedField;
    labelKey: string;
    placeholderKey?: string;
    multiline: boolean;
    rows?: number;
  }[] = [
    {
      key: 'title',
      labelKey: 'adminProjects.titleField',
      multiline: false
    },
    {
      key: 'summary',
      labelKey: 'adminProjects.summary',
      multiline: true,
      rows: 3
    },
    {
      key: 'role',
      labelKey: 'adminProjects.role',
      placeholderKey: 'adminProjects.rolePlaceholder',
      multiline: false
    }
  ];

  readonly form = new FormGroup({
    slug: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(180),
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      ]
    }),

    title: this.localizedGroup(255),
    summary: this.localizedGroup(4000),
    role: this.localizedGroup(255),

    demoUrl: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(500)]
    }),

    repoUrl: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(500)]
    }),

    video: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(500)]
    }),

    technologyIds: new FormControl<string[]>([], {
      nonNullable: true
    }),

    published: new FormControl(false, {
      nonNullable: true
    }),

    featured: new FormControl(false, {
      nonNullable: true
    }),

    position: new FormControl<number | null>(0, {
      validators: [Validators.min(0)]
    })
  });

  ngOnInit(): void {
    this.loadTechnologies();

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode.set(true);
      this.projectId.set(id);
      this.loadProject(id);
    }
  }

  loadTechnologies(): void {
    this.technologyService
      .getAdminTechnologies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => this.technologies.set(list),
        error: () => {}
      });
  }

  loadProject(id: string): void {
    this.loadingProject.set(true);
    this.loadError.set(null);

    this.projectService
      .getAdminProject(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingProject.set(false))
      )
      .subscribe({
        next: project => {
          this.form.setValue({
            slug: project.slug,
            title: this.toLocalized(project.title),
            summary: this.toLocalized(project.summary),
            role: this.toLocalized(project.role),
            demoUrl: project.demoUrl ?? null,
            repoUrl: project.repoUrl ?? null,
            video: project.video ?? null,
            technologyIds: project.technologies?.map(t => t.id) ?? [],
            published: project.published,
            featured: project.featured,
            position: project.position ?? 0
          });

          this.imagesList.set(project.images ?? []);
        },

        error: () => {
          this.loadError.set(
            this.translate.instant('common.loadingError')
          );
        }
      });
  }

  localizedControl(
    field: LocalizedField,
    lang: AppLang
  ): FormControl<string> {
    return this.form.controls[field].controls[lang];
  }

  generateSlugFromTitle(): void {
    const titleFr = this.form.controls.title.controls.fr.value;
    const titleEn = this.form.controls.title.controls.en.value;
    const source = titleFr || titleEn;

    if (!source) {
      return;
    }

    const slug = source
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    this.form.controls.slug.setValue(slug);
    this.form.controls.slug.markAsDirty();
  }

  onImagesChange(images: string[]): void {
    this.imagesList.set(images);
    this.form.markAsDirty();
  }

  onVideoChange(video: string | null): void {
    this.form.controls.video.setValue(video);
    this.form.controls.video.markAsDirty();
  }

  cancel(): void {
    this.router.navigate(['/admin/projects']);
  }

  save(): void {
    if (this.saving()) {
      return;
    }

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.formError.set(
        this.translate.instant('adminProjects.genericError')
      );

      return;
    }

    this.formError.set(null);
    this.serverFieldErrors.set({});
    this.saving.set(true);

    const values = this.form.getRawValue();

    const payload: ProjectAdminRequest = {
      slug: values.slug.trim(),
      title: this.cleanLocalized(values.title),
      summary: this.cleanLocalized(values.summary),
      role: this.cleanLocalized(values.role),
      demoUrl: values.demoUrl?.trim() || null,
      repoUrl: values.repoUrl?.trim() || null,
      video: values.video?.trim() || null,
      images: this.imagesList(),
      technologyIds: values.technologyIds,
      published: values.published,
      featured: values.featured,
      position: values.position ?? 0
    };

    const id = this.projectId();

    const request$ = id
      ? this.projectService.updateProject(id, payload)
      : this.projectService.createProject(payload);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant(
              'adminProjects.success'
            ),
            detail: this.translate.instant(
              id
                ? 'adminProjects.updated'
                : 'adminProjects.created'
            ),
            life: 3500
          });

          this.router.navigate(['/admin/projects']);
        },

        error: (error: unknown) => {
          this.formError.set(this.errorMessage(error));

          if (error instanceof HttpErrorResponse) {
            const body = error.error as ApiError | null;
            this.serverFieldErrors.set(
              body?.validationErrors ?? {}
            );
          }
        }
      });
  }

  private localizedGroup(maxLength: number) {
    const createControl = () =>
      new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(maxLength)
        ]
      });

    return new FormGroup({
      fr: createControl(),
      en: createControl(),
      ar: createControl()
    });
  }

  private toLocalized(
    value: LocalizedText | null | undefined
  ): LocalizedText {
    return {
      fr: value?.fr ?? '',
      en: value?.en ?? '',
      ar: value?.ar ?? ''
    };
  }

  private cleanLocalized(
    value: LocalizedText
  ): LocalizedText {
    return {
      fr: value.fr.trim(),
      en: value.en.trim(),
      ar: value.ar.trim()
    };
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiError | null;

      if (
        body &&
        typeof body.message === 'string' &&
        body.message.trim()
      ) {
        return body.message;
      }
    }

    return this.translate.instant(
      'adminProjects.genericError'
    );
  }
}