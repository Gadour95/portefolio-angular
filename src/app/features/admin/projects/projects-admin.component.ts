import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';

import {
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
  ConfirmationService,
  MessageService
} from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import {
  debounceTime,
  distinctUntilChanged,
  finalize
} from 'rxjs';

import {
  ApiError
} from '../../../core/models/api-error.model';

import {
  LocalizedText
} from '../../../core/models/common.model';

import {
  AdminProjectQuery,
  ProjectAdmin
} from '../../../core/models/project.model';

import {
  ProjectService
} from '../../../core/services/project.service';

import {
  LanguageService
} from '../../../core/services/language.service';

import {
  resolveMediaUrl
} from '../../../core/http/media-url';

interface FilterOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-admin-projects',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule,
    PaginatorModule,
    SelectModule,
    TableModule,
    TagModule,
    ToolbarModule,
    TooltipModule
  ],

  providers: [ConfirmationService],

  template: `
    <div class="space-y-6">
      <section>
        <p
          class="text-xs font-bold uppercase tracking-[0.14em]
                 text-[var(--p-primary-color)]"
        >
          {{ 'adminNav.content' | translate }}
        </p>

        <h1
          class="mt-2 text-2xl font-bold tracking-[-0.035em]
                 sm:text-3xl"
        >
          {{ 'adminPages.projects.title' | translate }}
        </h1>

        <p class="mt-2 max-w-2xl app-muted">
          {{ 'adminPages.projects.subtitle' | translate }}
        </p>
      </section>

      <p-toolbar styleClass="rounded-2xl">
        <ng-template #start>
          <div class="flex flex-wrap items-center gap-3">
            <p-iconfield>
              <p-inputicon styleClass="pi pi-search" />

              <input
                pInputText
                type="search"
                class="w-full sm:w-64"
                [formControl]="searchControl"
                [placeholder]="'adminProjects.search' | translate"
                [attr.aria-label]="
                  'adminProjects.search' | translate
                "
              />
            </p-iconfield>

            <p-select
              [options]="publishedFilterOptions()"
              optionLabel="label"
              optionValue="value"
              [formControl]="publishedControl"
              styleClass="w-36"
              [ariaLabel]="'adminProjects.filterPublished' | translate"
            />

            <p-select
              [options]="featuredFilterOptions()"
              optionLabel="label"
              optionValue="value"
              [formControl]="featuredControl"
              styleClass="w-36"
              [ariaLabel]="'adminProjects.filterFeatured' | translate"
            />
          </div>
        </ng-template>

        <ng-template #end>
          <div class="flex items-center gap-2">
            <p-button
              icon="pi pi-refresh"
              severity="secondary"
              [outlined]="true"
              [disabled]="loading()"
              [ariaLabel]="'adminProjects.refresh' | translate"
              [pTooltip]="'adminProjects.refresh' | translate"
              (onClick)="load()"
            />

            <p-button
              icon="pi pi-plus"
              [label]="'adminProjects.new' | translate"
              (onClick)="navigateToNew()"
            />
          </div>
        </ng-template>
      </p-toolbar>

      @if (loadError(); as error) {
        <p-message severity="error" styleClass="w-full">
          {{ error }}
        </p-message>
      }

      <p-card styleClass="overflow-hidden rounded-2xl">
        <p-table
          [value]="projects()"
          [loading]="loading()"
          dataKey="id"
          size="small"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '62rem' }"
        >
          <ng-template #header>
            <tr>
              <th class="w-16">
                {{ 'adminProjects.position' | translate }}
              </th>

              <th class="w-24">
                {{ 'adminProjects.image' | translate }}
              </th>

              <th>
                {{ 'adminProjects.titleField' | translate }}
              </th>

              <th class="w-56">
                {{ 'adminProjects.technologies' | translate }}
              </th>

              <th class="w-28 text-center">
                {{ 'adminProjects.status' | translate }}
              </th>

              <th class="w-28 text-center">
                {{ 'adminProjects.featured' | translate }}
              </th>

              <th class="w-36 text-end">
                {{ 'adminProjects.actions' | translate }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-project>
            <tr>
              <td>
                <span
                  class="inline-flex min-w-8 items-center justify-center
                         rounded-full bg-indigo-50 px-2 py-0.5 text-xs
                         font-semibold text-indigo-600
                         dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  {{ project.position }}
                </span>
              </td>

              <td>
                @if (projectCover(project); as coverUrl) {
                  <img
                    [src]="coverUrl"
                    [alt]="resolveLocalized(project.title)"
                    class="h-12 w-16 rounded-xl object-cover
                           border border-[var(--app-border)]"
                    loading="lazy"
                  />
                } @else {
                  <span
                    class="flex h-12 w-16 items-center justify-center
                           rounded-xl border border-dashed
                           border-[var(--app-border)]"
                    aria-hidden="true"
                  >
                    <i class="pi pi-image text-sm app-muted"></i>
                  </span>
                }
              </td>

              <td>
                <div class="font-semibold text-base">
                  {{ resolveLocalized(project.title) }}
                </div>

                <div class="flex items-center gap-2 mt-1">
                  <span class="font-mono text-xs app-muted">
                    /{{ project.slug }}
                  </span>

                  @if (project.video) {
                    <span
                      class="inline-flex items-center gap-1 rounded bg-sky-50
                             px-1.5 py-0.2 text-[0.65rem] font-medium
                             text-sky-700
                             dark:bg-sky-500/10 dark:text-sky-300"
                      [pTooltip]="'adminProjects.video' | translate"
                    >
                      <i class="pi pi-video text-[0.6rem]"></i>
                      {{ 'adminProjects.video' | translate }}
                    </span>
                  }

                  @if (project.images?.length > 1) {
                    <span
                      class="inline-flex items-center gap-1 rounded
                             bg-slate-100 px-1.5 py-0.2 text-[0.65rem]
                             font-medium text-slate-700
                             dark:bg-slate-800 dark:text-slate-300"
                    >
                      <i class="pi pi-images text-[0.6rem]"></i>
                      {{ project.images.length }}
                    </span>
                  }
                </div>
              </td>

              <td>
                <div class="flex flex-wrap gap-1">
                  @for (
                    tech of project.technologies;
                    track tech.id
                  ) {
                    <span
                      class="inline-flex items-center gap-1 rounded-md
                             border border-[var(--app-border)]
                             bg-[var(--app-surface-muted)] px-2 py-0.5
                             text-xs font-medium"
                    >
                      @if (tech.color) {
                        <span
                          class="h-2 w-2 rounded-full"
                          [style.backgroundColor]="tech.color"
                        ></span>
                      }

                      {{ tech.name }}
                    </span>
                  } @empty {
                    <span class="text-xs app-muted italic">
                      —
                    </span>
                  }
                </div>
              </td>

              <td class="text-center">
                @if (project.published) {
                  <p-tag
                    severity="success"
                    [value]="'adminProjects.published' | translate"
                  />
                } @else {
                  <p-tag
                    severity="secondary"
                    [value]="'adminProjects.draft' | translate"
                  />
                }
              </td>

              <td class="text-center">
                @if (project.featured) {
                  <span
                    class="inline-flex items-center gap-1 rounded-full
                           bg-amber-100 px-2 py-0.5 text-xs font-semibold
                           text-amber-800
                           dark:bg-amber-500/10 dark:text-amber-300"
                  >
                    <i class="pi pi-star-fill text-[0.65rem]"></i>
                    {{ 'adminProjects.featuredBadge' | translate }}
                  </span>
                } @else {
                  <span class="text-xs app-muted">—</span>
                }
              </td>

              <td class="text-end">
                <div class="flex items-center justify-end gap-1">
                  @if (project.published) {
                    <a
                      [routerLink]="['/projects', project.slug]"
                      target="_blank"
                      pButton
                      icon="pi pi-external-link"
                      severity="secondary"
                      [text]="true"
                      [rounded]="true"
                      [attr.aria-label]="
                        'adminProjects.viewPublic' | translate
                      "
                      [pTooltip]="
                        'adminProjects.viewPublic' | translate
                      "
                    ></a>
                  }

                  <p-button
                    icon="pi pi-pencil"
                    severity="secondary"
                    [text]="true"
                    [rounded]="true"
                    [disabled]="deletingId() !== null"
                    [ariaLabel]="'adminProjects.edit' | translate"
                    [pTooltip]="'adminProjects.edit' | translate"
                    (onClick)="navigateToEdit(project.id)"
                  />

                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    [loading]="deletingId() === project.id"
                    [disabled]="
                      deletingId() !== null &&
                      deletingId() !== project.id
                    "
                    [ariaLabel]="'adminProjects.delete' | translate"
                    [pTooltip]="'adminProjects.delete' | translate"
                    (onClick)="confirmDelete(project)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td [attr.colspan]="7">
                <div
                  class="flex flex-col items-center gap-3 py-12
                         text-center"
                >
                  <span
                    class="flex h-14 w-14 items-center justify-center
                           rounded-2xl bg-indigo-50 text-indigo-600
                           dark:bg-indigo-500/10 dark:text-indigo-300"
                  >
                    <i
                      class="pi pi-folder text-2xl"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <p class="font-semibold">
                    {{
                      searchTerm()
                        ? ('adminProjects.searchEmpty' | translate)
                        : ('adminProjects.empty' | translate)
                    }}
                  </p>

                  @if (!searchTerm()) {
                    <p class="text-sm app-muted">
                      {{ 'adminProjects.emptyHint' | translate }}
                    </p>

                    <p-button
                      icon="pi pi-plus"
                      [label]="'adminProjects.new' | translate"
                      [outlined]="true"
                      (onClick)="navigateToNew()"
                    />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

        @if (totalElements() > 0) {
          <div
            class="flex flex-wrap items-center justify-between gap-4
                   border-t border-[var(--app-border)] p-4"
          >
            <p class="text-sm app-muted">
              {{
                'adminProjects.total'
                  | translate : { count: totalElements() }
              }}
            </p>

            @if (totalPages() > 1) {
              <p-paginator
                [rows]="pageSize"
                [totalRecords]="totalElements()"
                [first]="currentPage() * pageSize"
                (onPageChange)="onPageChange($event)"
              />
            }
          </div>
        }
      </p-card>
    </div>

    <p-confirmdialog
      [style]="{
        width: '32rem',
        maxWidth: 'calc(100vw - 2rem)'
      }"
    />
  `
})
export class ProjectsAdminComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly pageSize = 12;
  readonly currentPage = signal(0);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);

  readonly projects = signal<ProjectAdmin[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  private loadTicket = 0;

  readonly searchControl = new FormControl('', {
    nonNullable: true
  });

  readonly publishedControl = new FormControl<string>('all', {
    nonNullable: true
  });

  readonly featuredControl = new FormControl<string>('all', {
    nonNullable: true
  });

  readonly searchTerm = signal('');
  readonly publishedFilter = signal<boolean | undefined>(undefined);
  readonly featuredFilter = signal<boolean | undefined>(undefined);

  readonly publishedFilterOptions = computed<FilterOption<string>[]>(() => [
    {
      label: this.translate.instant('adminProjects.allPublished'),
      value: 'all'
    },
    {
      label: this.translate.instant('adminProjects.publishedOnly'),
      value: 'true'
    },
    {
      label: this.translate.instant('adminProjects.draftsOnly'),
      value: 'false'
    }
  ]);

  readonly featuredFilterOptions = computed<FilterOption<string>[]>(() => [
    {
      label: this.translate.instant('adminProjects.allFeatured'),
      value: 'all'
    },
    {
      label: this.translate.instant('adminProjects.featuredOnly'),
      value: 'true'
    },
    {
      label: this.translate.instant('adminProjects.notFeaturedOnly'),
      value: 'false'
    }
  ]);

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => {
        this.searchTerm.set(value);
        this.currentPage.set(0);
        this.load();
      });

    this.publishedControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.publishedFilter.set(
          value === 'true' ? true : value === 'false' ? false : undefined
        );

        this.currentPage.set(0);
        this.load();
      });

    this.featuredControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.featuredFilter.set(
          value === 'true' ? true : value === 'false' ? false : undefined
        );

        this.currentPage.set(0);
        this.load();
      });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const ticket = ++this.loadTicket;

    this.loading.set(true);
    this.loadError.set(null);

    const query: AdminProjectQuery = {
      page: this.currentPage(),
      size: this.pageSize,
      published: this.publishedFilter(),
      featured: this.featuredFilter(),
      search: this.searchTerm().trim() || undefined
    };

    this.projectService
      .getAdminProjects(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (ticket === this.loadTicket) {
            this.loading.set(false);
          }
        })
      )
      .subscribe({
        next: page => {
          if (ticket === this.loadTicket) {
            this.projects.set(page.content);
            this.totalElements.set(page.totalElements);
            this.totalPages.set(page.totalPages);
          }
        },

        error: () => {
          if (ticket === this.loadTicket) {
            this.loadError.set(
              this.translate.instant('common.loadingError')
            );
          }
        }
      });
  }

  onPageChange(event: PaginatorState): void {
    this.currentPage.set(event.page ?? 0);
    this.load();
  }

  projectCover(project: ProjectAdmin): string | null {
    const first = project.images?.[0];
    return resolveMediaUrl(first);
  }

  resolveLocalized(value: LocalizedText | null | undefined): string {
    if (!value) {
      return '';
    }

    const currentLang = this.language.current();
    return value[currentLang] || value.fr || value.en || value.ar || '';
  }

  navigateToNew(): void {
    this.router.navigate(['/admin/projects/new']);
  }

  navigateToEdit(id: string): void {
    this.router.navigate(['/admin/projects', id, 'edit']);
  }

  confirmDelete(project: ProjectAdmin): void {
    if (this.deletingId()) {
      return;
    }

    const title = this.resolveLocalized(project.title) || project.slug;

    this.confirmation.confirm({
      header: this.translate.instant('adminProjects.deleteTitle'),

      message: this.translate.instant('adminProjects.deleteQuestion', {
        name: title
      }),

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: this.translate.instant('adminProjects.delete'),
      rejectLabel: this.translate.instant('adminProjects.cancel'),

      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',

      accept: () => this.deleteProject(project.id)
    });
  }

  private deleteProject(id: string): void {
    this.deletingId.set(id);

    this.projectService
      .deleteProject(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deletingId.set(null))
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('adminProjects.success'),
            detail: this.translate.instant(
              'adminProjects.deletedSuccess'
            ),
            life: 3500
          });

          this.load();
        },

        error: (error: unknown) => {
          if (
            error instanceof HttpErrorResponse &&
            (error.status === 401 || error.status === 403)
          ) {
            return;
          }

          this.messages.add({
            severity: 'error',
            summary: this.translate.instant('adminProjects.error'),
            detail: this.errorMessage(error),
            life: 6000
          });
        }
      });
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

    return this.translate.instant('adminProjects.genericError');
  }
}