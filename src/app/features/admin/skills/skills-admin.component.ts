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
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  takeUntilDestroyed,
  toSignal
} from '@angular/core/rxjs-interop';

import {
  RouterLink
} from '@angular/router';

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
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin
} from 'rxjs';

import {
  ApiError
} from '../../../core/models/api-error.model';

import {
  Skill,
  SkillCategory,
  SkillRequest
} from '../../../core/models/skill.model';

import {
  Technology
} from '../../../core/models/technology.model';

import {
  SkillService
} from '../../../core/services/skill.service';

import {
  TechnologyService
} from '../../../core/services/technology.service';

import {
  resolveMediaUrl
} from '../../../core/http/media-url';

import {
  ColorInputComponent
} from '../../../shared/components/color-input/color-input.component';

import {
  LanguageService
} from '../../../core/services/language.service';

@Component({
  selector: 'app-admin-skills',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    CardModule,
    CheckboxModule,
    ConfirmDialogModule,
    ColorInputComponent,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
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
          {{ 'adminPages.skills.title' | translate }}
        </h1>

        <p class="mt-2 max-w-2xl app-muted">
          {{ 'adminPages.skills.subtitle' | translate }}
        </p>
      </section>

      @if (!loading() && !categories().length) {
        <p-message severity="info" styleClass="w-full">
          <div
            class="flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p class="font-semibold">
                {{ 'adminSkills.noCategoryTitle' | translate }}
              </p>

              <p class="mt-1 text-sm">
                {{ 'adminSkills.noCategoryText' | translate }}
              </p>
            </div>

            <a
              pButton
              severity="secondary"
              [outlined]="true"
              icon="pi pi-tags"
              [label]="
                'adminSkills.manageCategories' | translate
              "
              routerLink="/admin/categories"
            ></a>
          </div>
        </p-message>
      }

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
                [placeholder]="'adminSkills.search' | translate"
                [attr.aria-label]="
                  'adminSkills.search' | translate
                "
              />
            </p-iconfield>

            <p-select
              inputId="skill-category-filter"
              [options]="categoryFilterOptions()"
              optionLabel="label"
              optionValue="value"
              [formControl]="categoryFilterControl"
              [ariaLabel]="
                'adminSkills.filterCategory' | translate
              "
              styleClass="w-full sm:w-56"
              appendTo="body"
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
              [ariaLabel]="'adminSkills.refresh' | translate"
              [pTooltip]="'adminSkills.refresh' | translate"
              (onClick)="load()"
            />

            <p-button
              icon="pi pi-plus"
              [label]="'adminSkills.new' | translate"
              [disabled]="!categories().length"
              [tooltipDisabled]="!!categories().length"
              [pTooltip]="
                'adminSkills.noCategoryTitle' | translate
              "
              (onClick)="openCreate()"
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
          [value]="filteredSkills()"
          [loading]="loading()"
          dataKey="id"
          size="small"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '58rem' }"
        >
          <ng-template #header>
            <tr>
              <th class="w-48">
                {{ 'adminSkills.category' | translate }}
              </th>

              <th class="w-52">
                {{ 'adminSkills.technology' | translate }}
              </th>

              <th>
                {{ 'adminSkills.name' | translate }}
              </th>

              <th class="w-48">
                {{ 'adminSkills.score' | translate }}
              </th>

              <th class="w-16">
                {{ 'adminSkills.position' | translate }}
              </th>

              <th class="w-32">
                {{ 'adminSkills.actions' | translate }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-skill>
            <tr>
              <td>
                <span
                  class="inline-flex items-center gap-2 rounded-full
                         border border-[var(--app-border)] px-2.5
                         py-1 text-xs font-semibold"
                >
                  <span
                    class="h-2.5 w-2.5 rounded-full"
                    [style.background]="
                      categoryColor(skill.categoryId) ||
                      'var(--p-primary-color)'
                    "
                    aria-hidden="true"
                  ></span>

                  {{ skill.categoryName }}
                </span>
              </td>

              <td>
                <span class="inline-flex items-center gap-2">
                  @if (skillImageUrl(skill); as imageUrl) {
                    <img
                      [src]="imageUrl"
                      [alt]="
                        skill.technologyName || skill.name
                      "
                      class="h-8 w-8 rounded-lg object-cover
                             border border-[var(--app-border)]"
                      loading="lazy"
                    />
                  } @else {
                    <span
                      class="flex h-8 w-8 items-center
                             justify-center rounded-lg border
                             border-dashed
                             border-[var(--app-border)]"
                      aria-hidden="true"
                    >
                      <i class="pi pi-image text-xs app-muted"></i>
                    </span>
                  }

                  @if (skill.technologyName) {
                    <span class="text-sm font-medium">
                      {{ skill.technologyName }}
                    </span>
                  } @else {
                    <span class="text-xs app-muted">
                      {{ 'adminSkills.noTechnology' | translate }}
                    </span>
                  }
                </span>
              </td>

              <td>
                <span class="font-semibold">
                  {{ skill.name }}
                </span>
              </td>

              <td>
                <div class="flex items-center gap-2">
                  <div
                    class="h-2 w-28 overflow-hidden rounded-full
                           bg-[var(--app-border)]"
                    role="progressbar"
                    [attr.aria-valuenow]="skill.score"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <div
                      class="h-full rounded-full"
                      [style.width.%]="skill.score"
                      [style.background]="
                        skill.color ||
                        categoryColor(skill.categoryId) ||
                        'var(--p-primary-color)'
                      "
                    ></div>
                  </div>

                  <span class="text-xs font-semibold">
                    {{ skill.score }}%
                  </span>
                </div>
              </td>

              <td>
                <span
                  class="inline-flex min-w-8 items-center justify-center
                         rounded-full bg-indigo-50 px-2 py-0.5 text-xs
                         font-semibold text-indigo-600
                         dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  {{ skill.position }}
                </span>
              </td>

              <td>
                <div class="flex items-center gap-1">
                  <p-button
                    icon="pi pi-pencil"
                    severity="secondary"
                    [text]="true"
                    [rounded]="true"
                    [disabled]="deletingId() !== null"
                    [ariaLabel]="
                      'adminSkills.edit' | translate
                    "
                    [pTooltip]="
                      'adminSkills.edit' | translate
                    "
                    (onClick)="openEdit(skill)"
                  />

                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    [loading]="deletingId() === skill.id"
                    [disabled]="
                      deletingId() !== null &&
                      deletingId() !== skill.id
                    "
                    [ariaLabel]="
                      'adminSkills.delete' | translate
                    "
                    [pTooltip]="
                      'adminSkills.delete' | translate
                    "
                    (onClick)="confirmDelete(skill)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td [attr.colspan]="6">
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
                      class="pi pi-chart-line text-2xl"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <p class="font-semibold">
                    {{
                      hasActiveFilters()
                        ? 'adminSkills.searchEmpty'
                        : 'adminSkills.empty'
                    }}
                  </p>

                  @if (!hasActiveFilters() && categories().length) {
                    <p class="text-sm app-muted">
                      {{ 'adminSkills.emptyHint' | translate }}
                    </p>

                    <p-button
                      icon="pi pi-plus"
                      [label]="'adminSkills.new' | translate"
                      [outlined]="true"
                      (onClick)="openCreate()"
                    />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

        @if (filteredSkills().length) {
          <div
            class="mt-4 border-t border-[var(--app-border)] pt-4"
          >
            <p class="text-sm app-muted">
              {{
                'adminSkills.total'
                  | translate: { count: filteredSkills().length }
              }}
            </p>
          </div>
        }
      </p-card>
    </div>

    <p-dialog
      [visible]="dialogVisible()"
      (visibleChange)="dialogVisible.set($event)"
      [header]="
        (editingId()
          ? 'adminSkills.editTitle'
          : 'adminSkills.createTitle') | translate
      "
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="!saving()"
      [closeOnEscape]="!saving()"
      [dismissableMask]="false"
      [style]="{
        width: '38rem',
        maxWidth: 'calc(100vw - 2rem)'
      }"
    >
      <form
        id="skill-form"
        [formGroup]="form"
        (ngSubmit)="save()"
        class="space-y-5 pt-2"
      >
        @if (formError(); as error) {
          <p-message severity="error" styleClass="w-full">
            {{ error }}
          </p-message>
        }

        <div>
          <label for="skill-category" class="app-label">
            {{ 'adminSkills.category' | translate }}
            <span class="text-red-500" aria-hidden="true">*</span>
          </label>

          <p-select
            inputId="skill-category"
            [options]="categories()"
            optionLabel="name"
            optionValue="id"
            formControlName="categoryId"
            [placeholder]="
              'adminSkills.categoryPlaceholder' | translate
            "
            [filter]="true"
            [disabled]="saving()"
            styleClass="w-full"
            appendTo="body"
          />

          @if (
            form.controls.categoryId.invalid &&
            form.controls.categoryId.touched
          ) {
            <p-message
              severity="error"
              variant="simple"
              styleClass="mt-2"
            >
              {{ 'adminSkills.categoryRequired' | translate }}
            </p-message>
          }

          @if (serverFieldErrors()['categoryId']; as error) {
            <p-message
              severity="error"
              variant="simple"
              styleClass="mt-2"
            >
              {{ error }}
            </p-message>
          }
        </div>

        <div>
          <label for="skill-technology" class="app-label">
            {{ 'adminSkills.technology' | translate }}
          </label>

          <div class="flex items-center gap-3">
            @if (selectedTechnologyImage(); as imageUrl) {
              <img
                [src]="imageUrl"
                [alt]="selectedTechnologyName()"
                class="h-10 w-10 shrink-0 rounded-xl
                       object-cover border
                       border-[var(--app-border)]"
              />
            } @else {
              <span
                class="flex h-10 w-10 shrink-0 items-center
                       justify-center rounded-xl border
                       border-dashed border-[var(--app-border)]"
                aria-hidden="true"
              >
                <i class="pi pi-image text-sm app-muted"></i>
              </span>
            }

            <p-select
              inputId="skill-technology"
              [options]="technologies()"
              optionLabel="name"
              optionValue="id"
              formControlName="technologyId"
              [placeholder]="
                'adminSkills.technologyPlaceholder' | translate
              "
              [filter]="true"
              [showClear]="true"
              [disabled]="saving()"
              styleClass="w-full"
              appendTo="body"
            />
          </div>

          <p class="mt-2 text-xs app-muted">
            {{ 'adminSkills.technologyHelp' | translate }}
          </p>

          @if (serverFieldErrors()['technologyId']; as error) {
            <p-message
              severity="error"
              variant="simple"
              styleClass="mt-2"
            >
              {{ error }}
            </p-message>
          }
        </div>

        <div>
          <label for="skill-name" class="app-label">
            {{ 'adminSkills.name' | translate }}
            <span class="text-red-500" aria-hidden="true">*</span>
          </label>

          <input
            pInputText
            id="skill-name"
            formControlName="name"
            class="w-full"
            autocomplete="off"
            [readonly]="saving()"
            [class.ng-invalid]="
              (form.controls.name.invalid &&
                form.controls.name.touched) ||
              !!serverFieldErrors()['name']
            "
            [class.ng-dirty]="form.controls.name.touched"
            [attr.aria-invalid]="
              form.controls.name.invalid &&
              form.controls.name.touched
            "
            aria-describedby="skill-name-error"
          />

          @if (
            form.controls.name.invalid &&
            form.controls.name.touched
          ) {
            <p-message
              id="skill-name-error"
              severity="error"
              variant="simple"
              styleClass="mt-2"
            >
              {{
                form.controls.name.hasError('maxlength')
                  ? ('adminSkills.nameTooLong' | translate)
                  : ('adminSkills.nameRequired' | translate)
              }}
            </p-message>
          }

          @if (serverFieldErrors()['name']; as error) {
            <p-message
              severity="error"
              variant="simple"
              styleClass="mt-2"
            >
              {{ error }}
            </p-message>
          }
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="skill-score" class="app-label">
              {{ 'adminSkills.score' | translate }}
              <span class="text-red-500" aria-hidden="true">*</span>
            </label>

            <p-inputnumber
              inputId="skill-score"
              formControlName="score"
              [min]="0"
              [max]="100"
              [showButtons]="true"
              [readonly]="saving()"
              styleClass="w-full"
              inputStyleClass="w-full"
              ariaDescribedBy="skill-score-help"
            />

            <p
              id="skill-score-help"
              class="mt-2 text-xs app-muted"
            >
              {{ 'adminSkills.scoreHelp' | translate }}
            </p>

            @if (
              form.controls.score.invalid &&
              form.controls.score.touched
            ) {
              <p-message
                severity="error"
                variant="simple"
                styleClass="mt-2"
              >
                {{ 'adminSkills.scoreInvalid' | translate }}
              </p-message>
            }

            @if (serverFieldErrors()['score']; as error) {
              <p-message
                severity="error"
                variant="simple"
                styleClass="mt-2"
              >
                {{ error }}
              </p-message>
            }
          </div>

          <div>
            <label for="skill-position" class="app-label">
              {{ 'adminSkills.position' | translate }}
            </label>

            <p-inputnumber
              inputId="skill-position"
              formControlName="position"
              [min]="0"
              [showButtons]="true"
              [readonly]="saving()"
              styleClass="w-full"
              inputStyleClass="w-full"
              ariaDescribedBy="skill-position-help"
            />

            <p
              id="skill-position-help"
              class="mt-2 text-xs app-muted"
            >
              {{ 'adminSkills.positionHelp' | translate }}
            </p>

            @if (
              form.controls.position.invalid &&
              form.controls.position.touched
            ) {
              <p-message
                severity="error"
                variant="simple"
                styleClass="mt-2"
              >
                {{ 'adminSkills.positionInvalid' | translate }}
              </p-message>
            }

            @if (serverFieldErrors()['position']; as error) {
              <p-message
                severity="error"
                variant="simple"
                styleClass="mt-2"
              >
                {{ error }}
              </p-message>
            }
          </div>
        </div>

        <div>
          <span class="app-label">
            {{ 'adminSkills.color' | translate }}
          </span>

          <div class="flex flex-wrap items-center gap-3">
            @if (form.controls.hasColor.value) {
              <app-color-input
                inputId="skill-color"
                formControlName="color"
                [disabled]="saving()"
              />
            } @else {
              <span
                class="flex h-10 w-10 items-center justify-center
                       rounded-xl border border-dashed
                       border-[var(--app-border)]"
                aria-hidden="true"
              >
                <i class="pi pi-ban text-sm app-muted"></i>
              </span>

              <span class="text-sm app-muted">
                {{ 'adminSkills.noColor' | translate }}
              </span>
            }

            <div class="flex items-center gap-2">
              <p-checkbox
                inputId="skill-has-color"
                formControlName="hasColor"
                [binary]="true"
                [disabled]="saving()"
              />

              <label
                for="skill-has-color"
                class="cursor-pointer text-sm"
              >
                {{ 'adminSkills.useColor' | translate }}
              </label>
            </div>
          </div>

          <p class="mt-2 text-xs app-muted">
            {{ 'adminSkills.colorHelp' | translate }}
          </p>

          @if (serverFieldErrors()['color']; as error) {
            <p-message
              severity="error"
              variant="simple"
              styleClass="mt-2"
            >
              {{ error }}
            </p-message>
          }
        </div>
      </form>

      <ng-template #footer>
        <p-button
          type="button"
          [label]="'adminSkills.cancel' | translate"
          severity="secondary"
          [text]="true"
          [disabled]="saving()"
          (onClick)="closeDialog()"
        />

        <p-button
          type="button"
          icon="pi pi-check"
          [label]="'adminSkills.save' | translate"
          [loading]="saving()"
          [disabled]="saving()"
          (onClick)="save()"
        />
      </ng-template>
    </p-dialog>

    <p-confirmdialog
      [style]="{
        width: '30rem',
        maxWidth: 'calc(100vw - 2rem)'
      }"
    />
  `
})
export class SkillsAdminComponent implements OnInit {
  private readonly api = inject(SkillService);
  private readonly technologiesApi = inject(TechnologyService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly skills = signal<Skill[]>([]);
  readonly categories = signal<SkillCategory[]>([]);
  readonly technologies = signal<Technology[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  private loadTicket = 0;

  readonly searchControl = new FormControl('', {
    nonNullable: true
  });

  readonly categoryFilterControl = new FormControl('', {
    nonNullable: true
  });

  readonly searchTerm = signal('');
  readonly categoryFilter = signal('');

  readonly categoryFilterOptions = computed(() => {
    this.language.current();

    return [
      {
        label: this.translate.instant(
          'adminSkills.allCategories'
        ),
        value: ''
      },

      ...this.categories().map(category => ({
        label: category.name,
        value: category.id
      }))
    ];
  });

  readonly categoryColors = computed(() => {
    const colors = new Map<string, string | null>();

    for (const category of this.categories()) {
      colors.set(category.id, category.color);
    }

    return colors;
  });

  readonly categoryImages = computed(() => {
    const images = new Map<string, string>();

    for (const category of this.categories()) {
      const url =
        category.imageUrl ?? resolveMediaUrl(category.image);

      if (url) {
        images.set(category.id, url);
      }
    }

    return images;
  });

  readonly hasActiveFilters = computed(
    () => !!this.searchTerm().trim() || !!this.categoryFilter()
  );

  readonly filteredSkills = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const categoryId = this.categoryFilter();

    return this.skills().filter(skill => {
      if (categoryId && skill.categoryId !== categoryId) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        skill.name.toLowerCase().includes(term) ||
        skill.categoryName.toLowerCase().includes(term)
      );
    });
  });

  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);

  readonly formError = signal<string | null>(null);

  readonly serverFieldErrors =
    signal<Record<string, string>>({});

  readonly form = new FormGroup({
    categoryId: new FormControl<string | null>(null, {
      validators: [Validators.required]
    }),

    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(120)
      ]
    }),

    score: new FormControl<number | null>(50, {
      validators: [
        Validators.required,
        Validators.min(0),
        Validators.max(100)
      ]
    }),

    position: new FormControl<number | null>(0, {
      validators: [Validators.min(0)]
    }),

    technologyId: new FormControl<string | null>(null),

    hasColor: new FormControl(true, {
      nonNullable: true
    }),

    color: new FormControl('6366f1', {
      nonNullable: true,
      validators: [Validators.maxLength(30)]
    })
  });

  private readonly technologyValue = toSignal(
    this.form.controls.technologyId.valueChanges,
    { initialValue: null }
  );

  readonly selectedTechnology = computed(() => {
    const id = this.technologyValue();

    if (!id) {
      return null;
    }

    return this.technologies().find(
      technology => technology.id === id
    ) ?? null;
  });

  readonly selectedTechnologyImage = computed(() => {
    const technology = this.selectedTechnology();

    return technology?.imageUrl ??
      resolveMediaUrl(technology?.image);
  });

  readonly selectedTechnologyName = computed(
    () => this.selectedTechnology()?.name ?? ''
  );

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.searchTerm.set(value);
    });

    this.categoryFilterControl.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.categoryFilter.set(value);
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const ticket = ++this.loadTicket;

    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      categories: this.api.getAdminSkillCategories(),
      skills: this.api.getAdminSkills(),
      technologies: this.technologiesApi.getAdminTechnologies()
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (ticket === this.loadTicket) {
          this.loading.set(false);
        }
      })
    ).subscribe({
      next: ({ categories, skills, technologies }) => {
        if (ticket !== this.loadTicket) {
          return;
        }

        this.categories.set(categories);
        this.skills.set(skills);
        this.technologies.set(technologies);
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

  categoryColor(categoryId: string): string | null {
    return this.categoryColors().get(categoryId) ?? null;
  }

  skillImageUrl(skill: Skill): string | null {
    return (
      skill.technologyImageUrl ??
      this.categoryImages().get(skill.categoryId) ??
      null
    );
  }

  openCreate(): void {
    if (!this.categories().length) {
      return;
    }

    this.editingId.set(null);
    this.resetForm();
    this.dialogVisible.set(true);
  }

  openEdit(skill: Skill): void {
    this.editingId.set(skill.id);
    this.resetForm();

    const color = this.toPickerColor(skill.color);

    this.form.setValue({
      categoryId: skill.categoryId,
      name: skill.name,
      score: skill.score,
      position: skill.position ?? 0,
      technologyId: skill.technologyId ?? null,
      hasColor: color !== null,
      color: color ?? '6366f1'
    });

    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    if (!this.saving()) {
      this.dialogVisible.set(false);
    }
  }

  save(): void {
    if (this.saving()) {
      return;
    }

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.formError.set(null);
    this.serverFieldErrors.set({});
    this.saving.set(true);

    const values = this.form.getRawValue();

    const payload: SkillRequest = {
      categoryId: values.categoryId as string,
      name: values.name.trim(),
      score: values.score ?? 0,
      position: values.position ?? 0,
      technologyId: values.technologyId,
      color: values.hasColor
        ? this.normalizeColor(values.color)
        : null
    };

    const id = this.editingId();

    const request$ = id
      ? this.api.updateSkill(id, payload)
      : this.api.createSkill(payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.dialogVisible.set(false);

        this.notify(
          id
            ? 'adminSkills.updated'
            : 'adminSkills.created'
        );

        this.load();
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

  confirmDelete(skill: Skill): void {
    if (this.deletingId()) {
      return;
    }

    this.confirmation.confirm({
      header: this.translate.instant(
        'adminSkills.deleteTitle'
      ),

      message: this.translate.instant(
        'adminSkills.deleteQuestion',
        { name: skill.name }
      ),

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: this.translate.instant(
        'adminSkills.delete'
      ),

      rejectLabel: this.translate.instant(
        'adminSkills.cancel'
      ),

      acceptButtonStyleClass: 'p-button-danger',

      rejectButtonStyleClass: 'p-button-text',

      accept: () => this.deleteSkill(skill.id)
    });
  }

  private deleteSkill(id: string): void {
    this.deletingId.set(id);

    this.api.deleteSkill(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deletingId.set(null))
    ).subscribe({
      next: () => {
        this.notify('adminSkills.deletedSuccess');
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
          summary: this.translate.instant(
            'adminSkills.error'
          ),
          detail: this.errorMessage(error),
          life: 6000
        });
      }
    });
  }

  private normalizeColor(value: string): string | null {
    const color = value.trim().replace(/^#/, '');

    if (!color) {
      return null;
    }

    return `#${color}`;
  }

  private toPickerColor(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const match = value.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);

    if (!match) {
      return null;
    }

    const hex = match[1].toLowerCase();

    return hex.length === 3
      ? hex
          .split('')
          .map(character => character + character)
          .join('')
      : hex;
  }

  private resetForm(): void {
    this.form.reset({
      categoryId: this.categories()[0]?.id ?? null,
      name: '',
      score: 50,
      position: 0,
      technologyId: null,
      hasColor: true,
      color: '6366f1'
    });

    this.formError.set(null);
    this.serverFieldErrors.set({});
  }

  private notify(key: string): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(
        'adminSkills.success'
      ),
      detail: this.translate.instant(key),
      life: 3500
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

    return this.translate.instant(
      'adminSkills.genericError'
    );
  }
}
