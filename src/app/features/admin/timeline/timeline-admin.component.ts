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
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

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
import { TextareaModule } from 'primeng/textarea';
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
  AppLang,
  LocalizedText
} from '../../../core/models/common.model';

import {
  TimelineItem,
  TimelineItemRequest,
  TimelineType
} from '../../../core/models/timeline.model';

import {
  TimelineService
} from '../../../core/services/timeline.service';

import {
  LanguageService
} from '../../../core/services/language.service';

type LocalizedField = 'role' | 'organization' | 'description';

interface LanguageOption {
  code: AppLang;
  label: string;
  dir: 'ltr' | 'rtl';
}

function timelinePeriodValidator(
  group: AbstractControl
): ValidationErrors | null {
  const current = group.get('current')?.value === true;
  const start = group.get('startDate')?.value as
    | number
    | null;
  const end = group.get('endDate')?.value as number | null;

  if (current || start === null || end === null) {
    return null;
  }

  return end < start ? { endBeforeStart: true } : null;
}

@Component({
  selector: 'app-admin-timeline',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    CheckboxModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TableModule,
    TextareaModule,
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
          {{ 'adminPages.timeline.title' | translate }}
        </h1>

        <p class="mt-2 max-w-2xl app-muted">
          {{ 'adminPages.timeline.subtitle' | translate }}
        </p>
      </section>

      <p-toolbar styleClass="rounded-2xl">
        <ng-template #start>
          <div class="flex flex-wrap items-center gap-2">
            <p-iconfield>
              <p-inputicon styleClass="pi pi-search" />

              <input
                pInputText
                type="search"
                class="w-full sm:w-72"
                [formControl]="searchControl"
                [placeholder]="
                  'adminTimeline.search' | translate
                "
                [attr.aria-label]="
                  'adminTimeline.search' | translate
                "
              />
            </p-iconfield>

            <p-select
              inputId="timeline-type-filter"
              [options]="typeFilterOptions()"
              optionLabel="label"
              optionValue="value"
              [formControl]="typeFilterControl"
              [ariaLabel]="
                'adminTimeline.filterType' | translate
              "
              styleClass="w-full sm:w-52"
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
              [ariaLabel]="'adminTimeline.refresh' | translate"
              [pTooltip]="'adminTimeline.refresh' | translate"
              (onClick)="load()"
            />

            <p-button
              icon="pi pi-plus"
              [label]="'adminTimeline.new' | translate"
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
          [value]="filteredItems()"
          [loading]="loading()"
          dataKey="id"
          size="small"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '52rem' }"
        >
          <ng-template #header>
            <tr>
              <th class="w-16">
                {{ 'adminTimeline.position' | translate }}
              </th>

              <th class="w-32">
                {{ 'adminTimeline.type' | translate }}
              </th>

              <th>
                {{ 'adminTimeline.role' | translate }}
              </th>

              <th class="w-40">
                {{ 'adminTimeline.period' | translate }}
              </th>

              <th class="w-32">
                {{ 'adminTimeline.actions' | translate }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-item>
            <tr>
              <td>
                <span
                  class="inline-flex min-w-8 items-center justify-center
                         rounded-full bg-indigo-50 px-2 py-0.5 text-xs
                         font-semibold text-indigo-600
                         dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  {{ item.position }}
                </span>
              </td>

              <td>
                <span [class]="typeBadgeClass(item.type)">
                  {{ typeLabelKey(item.type) | translate }}
                </span>
              </td>

              <td>
                <div class="font-semibold">
                  {{ item.role?.fr }}
                </div>

                <div class="text-sm app-muted">
                  {{ item.organization?.fr }}
                </div>
              </td>

              <td>
                <span class="font-semibold">
                  {{ item.startDate }}
                </span>

                @if (item.current) {
                  <span class="app-muted">
                    — {{ 'adminTimeline.present' | translate }}
                  </span>
                } @else if (item.endDate) {
                  <span class="app-muted">
                    — {{ item.endDate }}
                  </span>
                }
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
                      'adminTimeline.edit' | translate
                    "
                    [pTooltip]="'adminTimeline.edit' | translate"
                    (onClick)="openEdit(item)"
                  />

                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    [loading]="deletingId() === item.id"
                    [disabled]="
                      deletingId() !== null &&
                      deletingId() !== item.id
                    "
                    [ariaLabel]="
                      'adminTimeline.delete' | translate
                    "
                    [pTooltip]="
                      'adminTimeline.delete' | translate
                    "
                    (onClick)="confirmDelete(item)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td [attr.colspan]="5">
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
                      class="pi pi-history text-2xl"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <p class="font-semibold">
                    {{
                      hasActiveFilters()
                        ? 'adminTimeline.searchEmpty'
                        : 'adminTimeline.empty'
                    }}
                  </p>

                  @if (!hasActiveFilters()) {
                    <p class="text-sm app-muted">
                      {{ 'adminTimeline.emptyHint' | translate }}
                    </p>

                    <p-button
                      icon="pi pi-plus"
                      [label]="'adminTimeline.new' | translate"
                      [outlined]="true"
                      (onClick)="openCreate()"
                    />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

        @if (filteredItems().length) {
          <div
            class="mt-4 border-t border-[var(--app-border)] pt-4"
          >
            <p class="text-sm app-muted">
              {{
                'adminTimeline.total'
                  | translate
                    : { count: filteredItems().length }
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
          ? 'adminTimeline.editTitle'
          : 'adminTimeline.createTitle') | translate
      "
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="!saving()"
      [closeOnEscape]="!saving()"
      [dismissableMask]="false"
      [style]="{
        width: '46rem',
        maxWidth: 'calc(100vw - 2rem)'
      }"
    >
      <form
        id="timeline-form"
        [formGroup]="form"
        (ngSubmit)="save()"
        class="space-y-5 pt-2"
      >
        @if (formError(); as error) {
          <p-message severity="error" styleClass="w-full">
            {{ error }}
          </p-message>
        }

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="timeline-type" class="app-label">
              {{ 'adminTimeline.type' | translate }}
              <span
                class="text-red-500"
                aria-hidden="true"
              >*</span>
            </label>

            <p-select
              inputId="timeline-type"
              [options]="typeOptions()"
              optionLabel="label"
              optionValue="value"
              formControlName="type"
              [disabled]="saving()"
              styleClass="w-full"
              appendTo="body"
            />

            @if (serverFieldErrors()['type']; as error) {
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
            <label for="timeline-position" class="app-label">
              {{ 'adminTimeline.position' | translate }}
            </label>

            <p-inputnumber
              inputId="timeline-position"
              formControlName="position"
              [min]="0"
              [showButtons]="true"
              [readonly]="saving()"
              styleClass="w-full"
              inputStyleClass="w-full"
              ariaDescribedBy="timeline-position-help"
            />

            <p
              id="timeline-position-help"
              class="mt-2 text-xs app-muted"
            >
              {{ 'adminTimeline.positionHelp' | translate }}
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
                {{
                  'adminTimeline.positionInvalid' | translate
                }}
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

        <div class="rounded-2xl bg-[var(--app-surface-muted)] p-4">
          <div class="mb-4">
            <h3 class="text-sm font-semibold">
              {{ 'adminTimeline.localizedContent' | translate }}
            </h3>

            <p class="mt-1 text-xs app-muted">
              {{
                'adminTimeline.localizedContentHelp' | translate
              }}
            </p>
          </div>

          <div class="space-y-6">
            @for (
              field of localizedFields;
              track field.key
            ) {
              <div>
                <label class="app-label">
                  {{ field.labelKey | translate }}
                  <span
                    class="text-red-500"
                    aria-hidden="true"
                  >*</span>
                </label>

                <div class="mt-2 grid gap-3">
                  @for (lang of languages; track lang.code) {
                    <div>
                      <label
                        [for]="
                          'timeline-' + field.key + '-' + lang.code
                        "
                        class="mb-1 flex items-center gap-2
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
                            'timeline-' + field.key + '-' +
                            lang.code
                          "
                          rows="3"
                          [formControl]="
                            localizedControl(field.key, lang.code)
                          "
                          class="w-full"
                          [dir]="lang.dir"
                          [readonly]="saving()"
                          [class.ng-invalid]="
                            isLocalizedInvalid(
                              field.key,
                              lang.code
                            ) ||
                            !!serverLocalizedError(
                              field.key,
                              lang.code
                            )
                          "
                          [class.ng-dirty]="
                            localizedControl(
                              field.key,
                              lang.code
                            ).touched
                          "
                        ></textarea>
                      } @else {
                        <input
                          pInputText
                          [id]="
                            'timeline-' + field.key + '-' +
                            lang.code
                          "
                          [formControl]="
                            localizedControl(field.key, lang.code)
                          "
                          class="w-full"
                          [dir]="lang.dir"
                          autocomplete="off"
                          [readonly]="saving()"
                          [class.ng-invalid]="
                            isLocalizedInvalid(
                              field.key,
                              lang.code
                            ) ||
                            !!serverLocalizedError(
                              field.key,
                              lang.code
                            )
                          "
                          [class.ng-dirty]="
                            localizedControl(
                              field.key,
                              lang.code
                            ).touched
                          "
                        />
                      }

                      @if (
                        isLocalizedInvalid(
                          field.key,
                          lang.code
                        )
                      ) {
                        <p-message
                          severity="error"
                          variant="simple"
                          styleClass="mt-2"
                        >
                          {{
                            localizedErrorKey(
                              field.key,
                              lang.code
                            ) | translate
                          }}
                        </p-message>
                      }

                      @if (
                        serverLocalizedError(
                          field.key,
                          lang.code
                        );
                        as error
                      ) {
                        <p-message
                          severity="error"
                          variant="simple"
                          styleClass="mt-2"
                        >
                          {{ error }}
                        </p-message>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label for="timeline-start" class="app-label">
              {{ 'adminTimeline.startDate' | translate }}
              <span
                class="text-red-500"
                aria-hidden="true"
              >*</span>
            </label>

            <p-inputnumber
              inputId="timeline-start"
              formControlName="startDate"
              [min]="1900"
              [max]="2100"
              [useGrouping]="false"
              [minFractionDigits]="0"
              [maxFractionDigits]="0"
              [readonly]="saving()"
              styleClass="w-full"
              inputStyleClass="w-full"
              ariaDescribedBy="timeline-start-error"
            />

            @if (
              form.controls.startDate.invalid &&
              form.controls.startDate.touched
            ) {
              <p-message
                id="timeline-start-error"
                severity="error"
                variant="simple"
                styleClass="mt-2"
              >
                {{
                  form.controls.startDate.hasError('required')
                    ? ('adminTimeline.startDateRequired'
                      | translate)
                    : ('adminTimeline.startDateInvalid'
                      | translate)
                }}
              </p-message>
            }

            @if (serverFieldErrors()['startDate']; as error) {
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
            <label for="timeline-end" class="app-label">
              {{ 'adminTimeline.endDate' | translate }}
            </label>

            <p-inputnumber
              inputId="timeline-end"
              formControlName="endDate"
              [min]="1900"
              [max]="2100"
              [useGrouping]="false"
              [minFractionDigits]="0"
              [maxFractionDigits]="0"
              [readonly]="saving()"
              styleClass="w-full"
              inputStyleClass="w-full"
              ariaDescribedBy="timeline-end-help"
              [class.ng-invalid]="
                form.hasError('endBeforeStart') ||
                !!serverFieldErrors()['endDate']
              "
            />

            <p
              id="timeline-end-help"
              class="mt-2 text-xs app-muted"
            >
              {{ 'adminTimeline.endDateHelp' | translate }}
            </p>

            @if (
              form.hasError('endBeforeStart') &&
              (form.controls.startDate.touched ||
                form.controls.endDate.touched)
            ) {
              <p-message
                severity="error"
                variant="simple"
                styleClass="mt-2"
              >
                {{ 'adminTimeline.endBeforeStart' | translate }}
              </p-message>
            }

            @if (serverFieldErrors()['endDate']; as error) {
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

        <div class="flex items-center gap-2">
          <p-checkbox
            inputId="timeline-current"
            formControlName="current"
            [binary]="true"
            [disabled]="saving()"
          />

          <label
            for="timeline-current"
            class="cursor-pointer text-sm"
          >
            {{ 'adminTimeline.currentLabel' | translate }}
          </label>
        </div>
      </form>

      <ng-template #footer>
        <p-button
          type="button"
          [label]="'adminTimeline.cancel' | translate"
          severity="secondary"
          [text]="true"
          [disabled]="saving()"
          (onClick)="closeDialog()"
        />

        <p-button
          type="button"
          icon="pi pi-check"
          [label]="'adminTimeline.save' | translate"
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
export class TimelineAdminComponent implements OnInit {
  private readonly api = inject(TimelineService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly languages: LanguageOption[] = [
    { code: 'fr', label: 'Français', dir: 'ltr' },
    { code: 'en', label: 'English', dir: 'ltr' },
    { code: 'ar', label: 'العربية', dir: 'rtl' }
  ];

  readonly localizedFields: {
    key: LocalizedField;
    labelKey: string;
    multiline: boolean;
  }[] = [
    {
      key: 'role',
      labelKey: 'adminTimeline.role',
      multiline: false
    },
    {
      key: 'organization',
      labelKey: 'adminTimeline.organization',
      multiline: false
    },
    {
      key: 'description',
      labelKey: 'adminTimeline.description',
      multiline: true
    }
  ];

  readonly items = signal<TimelineItem[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  private loadTicket = 0;

  readonly searchControl = new FormControl('', {
    nonNullable: true
  });

  readonly typeFilterControl = new FormControl('', {
    nonNullable: true
  });

  readonly searchTerm = signal('');
  readonly typeFilter = signal('');

  readonly typeFilterOptions = computed(() => {
    this.language.current();

    return [
      {
        label: this.translate.instant(
          'adminTimeline.allTypes'
        ),
        value: ''
      },
      {
        label: this.translate.instant(
          'adminTimeline.experience'
        ),
        value: 'EXPERIENCE'
      },
      {
        label: this.translate.instant(
          'adminTimeline.education'
        ),
        value: 'EDUCATION'
      }
    ];
  });

  readonly typeOptions = computed(() => {
    this.language.current();

    return [
      {
        label: this.translate.instant(
          'adminTimeline.experience'
        ),
        value: 'EXPERIENCE' as TimelineType
      },
      {
        label: this.translate.instant(
          'adminTimeline.education'
        ),
        value: 'EDUCATION' as TimelineType
      }
    ];
  });

  readonly hasActiveFilters = computed(
    () => !!this.searchTerm().trim() || !!this.typeFilter()
  );

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const type = this.typeFilter();

    return this.items().filter(item => {
      if (type && item.type !== type) {
        return false;
      }

      if (!term) {
        return true;
      }

      const values = [
        ...this.localizedValues(item.role),
        ...this.localizedValues(item.organization),
        ...this.localizedValues(item.description)
      ];

      return values.some(value =>
        value.toLowerCase().includes(term)
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

  readonly form = new FormGroup(
    {
      type: new FormControl<TimelineType>('EXPERIENCE', {
        nonNullable: true,
        validators: [Validators.required]
      }),

      role: this.localizedGroup(180),
      organization: this.localizedGroup(180),
      description: this.localizedGroup(4000),

      startDate: new FormControl<number | null>(null, {
        validators: [
          Validators.required,
          Validators.min(1900),
          Validators.max(2100)
        ]
      }),

      endDate: new FormControl<number | null>(null, {
        validators: [
          Validators.min(1900),
          Validators.max(2100)
        ]
      }),

      current: new FormControl(false, {
        nonNullable: true
      }),

      position: new FormControl<number | null>(0, {
        validators: [Validators.min(0)]
      })
    },

    { validators: [timelinePeriodValidator] }
  );

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.searchTerm.set(value);
    });

    this.typeFilterControl.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.typeFilter.set(value);
    });

    this.form.controls.current.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(current => {
      this.syncEndDateState(current);
    });

    this.form.controls.type.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(type => {
      if (this.editingId() !== null) {
        return;
      }

      this.form.controls.position.setValue(
        this.nextTimelinePosition(type),
        { emitEvent: false }
      );
    });
  }

  ngOnInit(): void {
    this.load();
  }

  localizedControl(
    field: LocalizedField,
    lang: AppLang
  ): FormControl<string> {
    return this.form.controls[field].controls[lang];
  }

  isLocalizedInvalid(
    field: LocalizedField,
    lang: AppLang
  ): boolean {
    const control = this.localizedControl(field, lang);

    return control.invalid && control.touched;
  }

  localizedErrorKey(
    field: LocalizedField,
    lang: AppLang
  ): string {
    const control = this.localizedControl(field, lang);

    return control.hasError('maxlength')
      ? `adminTimeline.${field}TooLong`
      : `adminTimeline.${field}Required`;
  }

  serverLocalizedError(
    field: LocalizedField,
    lang: AppLang
  ): string | null {
    const errors = this.serverFieldErrors();

    return (
      errors[`${field}.${lang}`] ??
      errors[field] ??
      null
    );
  }

  load(): void {
    const ticket = ++this.loadTicket;

    this.loading.set(true);
    this.loadError.set(null);

    this.api.getAdminTimeline().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (ticket === this.loadTicket) {
          this.loading.set(false);
        }
      })
    ).subscribe({
      next: items => {
        if (ticket === this.loadTicket) {
          this.items.set(items);
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

  typeLabelKey(type: TimelineType): string {
    return type === 'EXPERIENCE'
      ? 'adminTimeline.experience'
      : 'adminTimeline.education';
  }

  typeBadgeClass(type: TimelineType): string {
    return type === 'EXPERIENCE'
      ? 'inline-flex rounded-full bg-emerald-50 px-2 py-0.5 ' +
          'text-xs font-semibold text-emerald-700 ' +
          'dark:bg-emerald-500/10 dark:text-emerald-300'
      : 'inline-flex rounded-full bg-sky-50 px-2 py-0.5 ' +
          'text-xs font-semibold text-sky-700 ' +
          'dark:bg-sky-500/10 dark:text-sky-300';
  }

  openCreate(): void {
    this.editingId.set(null);
    this.resetForm();
    this.form.controls.position.setValue(
      this.nextTimelinePosition('EXPERIENCE'),
      { emitEvent: false }
    );
    this.dialogVisible.set(true);
  }

  openEdit(item: TimelineItem): void {
    this.editingId.set(item.id);
    this.resetForm();

    this.form.setValue({
      type: item.type,
      role: this.toLocalized(item.role),
      organization: this.toLocalized(item.organization),
      description: this.toLocalized(item.description),
      startDate: item.startDate ?? new Date().getFullYear(),
      endDate: item.endDate ?? null,
      current: item.current,
      position: item.position ?? 0
    });

    this.syncEndDateState(item.current);
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
      this.formError.set(
        this.translate.instant(
          'adminTimeline.validationError'
        )
      );

      return;
    }

    this.formError.set(null);
    this.serverFieldErrors.set({});
    this.saving.set(true);

    const values = this.form.getRawValue();

    const payload: TimelineItemRequest = {
      type: values.type,
      role: this.cleanLocalized(values.role),
      organization: this.cleanLocalized(
        values.organization
      ),
      description: this.cleanLocalized(values.description),
      startDate:
        values.startDate ?? new Date().getFullYear(),
      endDate: values.current ? null : values.endDate,
      current: values.current,
      position: values.position ?? 0
    };

    const id = this.editingId();

    const request$ = id
      ? this.api.updateTimelineItem(id, payload)
      : this.api.createTimelineItem(payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.dialogVisible.set(false);

        this.notify(
          id
            ? 'adminTimeline.updated'
            : 'adminTimeline.created'
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

  confirmDelete(item: TimelineItem): void {
    if (this.deletingId()) {
      return;
    }

    this.confirmation.confirm({
      header: this.translate.instant(
        'adminTimeline.deleteTitle'
      ),

      message: this.translate.instant(
        'adminTimeline.deleteQuestion',
        {
          role: item.role?.fr ?? '',
          organization: item.organization?.fr ?? ''
        }
      ),

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: this.translate.instant(
        'adminTimeline.delete'
      ),

      rejectLabel: this.translate.instant(
        'adminTimeline.cancel'
      ),

      acceptButtonStyleClass: 'p-button-danger',

      rejectButtonStyleClass: 'p-button-text',

      accept: () => this.deleteItem(item.id)
    });
  }

  private deleteItem(id: string): void {
    this.deletingId.set(id);

    this.api.deleteTimelineItem(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deletingId.set(null))
    ).subscribe({
      next: () => {
        this.notify('adminTimeline.deletedSuccess');
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
            'adminTimeline.error'
          ),
          detail: this.errorMessage(error),
          life: 6000
        });
      }
    });
  }

  private nextTimelinePosition(type: TimelineType): number {
    const positions = this.items()
      .filter(item => item.type === type)
      .map(item => item.position ?? 0);

    return positions.length
      ? Math.max(...positions) + 1
      : 0;
  }

  private syncEndDateState(current: boolean): void {
    const endDate = this.form.controls.endDate;

    if (current) {
      endDate.setValue(null, { emitEvent: false });
      endDate.disable({ emitEvent: false });
    } else {
      endDate.enable({ emitEvent: false });
    }

    this.form.updateValueAndValidity({
      emitEvent: false
    });
  }

  private resetForm(): void {
    this.form.reset({
      type: 'EXPERIENCE',
      role: this.emptyLocalized(),
      organization: this.emptyLocalized(),
      description: this.emptyLocalized(),
      startDate: new Date().getFullYear(),
      endDate: null,
      current: false,
      position: 0
    });

    this.syncEndDateState(false);

    this.formError.set(null);
    this.serverFieldErrors.set({});
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

  private emptyLocalized(): LocalizedText {
    return { fr: '', en: '', ar: '' };
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

  private localizedValues(
    value: LocalizedText | null | undefined
  ): string[] {
    if (!value) {
      return [];
    }

    return [value.fr, value.en, value.ar].filter(
      (item): item is string =>
        typeof item === 'string' && item.length > 0
    );
  }

  private notify(key: string): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(
        'adminTimeline.success'
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
      'adminTimeline.genericError'
    );
  }
}
