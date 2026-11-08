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
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
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
  LocalizedText
} from '../../../core/models/common.model';

import {
  ServiceOfferAdmin,
  ServiceOfferAdminRequest
} from '../../../core/models/service-offer.model';

import {
  ServiceOfferService
} from '../../../core/services/service-offer.service';

import {
  MediaService
} from '../../../core/services/media.service';

import {
  LanguageService,
  AppLanguage
} from '../../../core/services/language.service';

import {
  resolveMediaUrl
} from '../../../core/http/media-url';

type LocalizedField = 'name' | 'description';
type AppLang = 'fr' | 'en' | 'ar';

interface LanguageOption {
  code: AppLang;
  label: string;
  dir: 'ltr' | 'rtl';
}

@Component({
  selector: 'app-admin-services',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
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
          {{ 'adminPages.services.title' | translate }}
        </h1>

        <p class="mt-2 max-w-2xl app-muted">
          {{ 'adminPages.services.subtitle' | translate }}
        </p>
      </section>

      <p-toolbar styleClass="rounded-2xl">
        <ng-template #start>
          <p-iconfield>
            <p-inputicon styleClass="pi pi-search" />

            <input
              pInputText
              type="search"
              class="w-full sm:w-72"
              [formControl]="searchControl"
              [placeholder]="'adminServices.search' | translate"
              [attr.aria-label]="
                'adminServices.search' | translate
              "
            />
          </p-iconfield>
        </ng-template>

        <ng-template #end>
          <div class="flex items-center gap-2">
            <p-button
              icon="pi pi-refresh"
              severity="secondary"
              [outlined]="true"
              [disabled]="loading()"
              [ariaLabel]="'adminServices.refresh' | translate"
              [pTooltip]="'adminServices.refresh' | translate"
              (onClick)="load()"
            />

            <p-button
              icon="pi pi-plus"
              [label]="'adminServices.new' | translate"
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
          [value]="filteredServices()"
          [loading]="loading()"
          dataKey="id"
          size="small"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '52rem' }"
        >
          <ng-template #header>
            <tr>
              <th class="w-16">
                {{ 'adminServices.position' | translate }}
              </th>

              <th class="w-24">
                {{ 'adminServices.image' | translate }}
              </th>

              <th class="w-64">
                {{ 'adminServices.name' | translate }}
              </th>

              <th>
                {{ 'adminServices.description' | translate }}
              </th>

              <th class="w-32">
                {{ 'adminServices.actions' | translate }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-service>
            <tr>
              <td>
                <span
                  class="inline-flex min-w-8 items-center justify-center
                         rounded-full bg-indigo-50 px-2 py-0.5 text-xs
                         font-semibold text-indigo-600
                         dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  {{ service.position }}
                </span>
              </td>

              <td>
                @if (serviceImageUrl(service); as imageUrl) {
                  <img
                    [src]="imageUrl"
                    [alt]="resolveLocalized(service.name)"
                    class="h-10 w-10 rounded-xl object-cover
                           border border-[var(--app-border)]"
                    loading="lazy"
                  />
                } @else {
                  <span
                    class="flex h-10 w-10 items-center justify-center
                           rounded-xl border border-dashed
                           border-[var(--app-border)]"
                    aria-hidden="true"
                  >
                    <i class="pi pi-briefcase text-sm app-muted"></i>
                  </span>
                }
              </td>

              <td>
                <div class="font-semibold">
                  {{ resolveLocalized(service.name) }}
                </div>
                <div class="text-xs app-muted line-clamp-1">
                  {{ service.name.fr }}
                </div>
              </td>

              <td>
                <p class="text-sm line-clamp-2 max-w-xl app-muted">
                  {{ resolveLocalized(service.description) }}
                </p>
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
                      'adminServices.edit' | translate
                    "
                    [pTooltip]="
                      'adminServices.edit' | translate
                    "
                    (onClick)="openEdit(service)"
                  />

                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    [loading]="deletingId() === service.id"
                    [disabled]="
                      deletingId() !== null &&
                      deletingId() !== service.id
                    "
                    [ariaLabel]="
                      'adminServices.delete' | translate
                    "
                    [pTooltip]="
                      'adminServices.delete' | translate
                    "
                    (onClick)="confirmDelete(service)"
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
                      class="pi pi-briefcase text-2xl"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <p class="font-semibold">
                    {{
                      searchTerm()
                        ? ('adminServices.searchEmpty' | translate)
                        : ('adminServices.empty' | translate)
                    }}
                  </p>

                  @if (!searchTerm()) {
                    <p class="text-sm app-muted">
                      {{ 'adminServices.emptyHint' | translate }}
                    </p>

                    <p-button
                      icon="pi pi-plus"
                      [label]="'adminServices.new' | translate"
                      [outlined]="true"
                      (onClick)="openCreate()"
                    />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

        @if (filteredServices().length) {
          <div
            class="mt-4 border-t border-[var(--app-border)] pt-4"
          >
            <p class="text-sm app-muted">
              {{
                'adminServices.total'
                  | translate
                    : { count: filteredServices().length }
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
          ? 'adminServices.editTitle'
          : 'adminServices.createTitle') | translate
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
        id="service-form"
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
          <label for="service-position" class="app-label">
            {{ 'adminServices.position' | translate }}
          </label>

          <p-inputnumber
            inputId="service-position"
            formControlName="position"
            [min]="0"
            [showButtons]="true"
            [readonly]="saving()"
            styleClass="w-full"
            inputStyleClass="w-full"
            ariaDescribedBy="service-position-help"
          />

          <p
            id="service-position-help"
            class="mt-2 text-xs app-muted"
          >
            {{ 'adminServices.positionHelp' | translate }}
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
              {{ 'adminServices.positionInvalid' | translate }}
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

        <div>
          <span class="app-label">
            {{ 'adminServices.image' | translate }}
          </span>

          <div class="flex flex-wrap items-center gap-4">
            @if (form.controls.image.value) {
              <img
                [src]="resolveImage(form.controls.image.value)"
                [alt]="'adminServices.image' | translate"
                class="h-16 w-16 rounded-2xl object-cover
                       border border-[var(--app-border)]"
              />
            } @else {
              <span
                class="flex h-16 w-16 items-center justify-center
                       rounded-2xl border border-dashed
                       border-[var(--app-border)]"
                aria-hidden="true"
              >
                <i class="pi pi-image text-xl app-muted"></i>
              </span>
            }

            <div class="flex flex-wrap items-center gap-2">
              <input
                #imageInput
                type="file"
                class="hidden"
                accept="image/*"
                (change)="onImageSelected($event)"
              />

              <p-button
                type="button"
                icon="pi pi-upload"
                severity="secondary"
                [outlined]="true"
                [label]="
                  'adminServices.uploadImage' | translate
                "
                [loading]="uploadingImage()"
                [disabled]="saving() || uploadingImage()"
                (onClick)="imageInput.click()"
              />

              @if (form.controls.image.value) {
                <p-button
                  type="button"
                  icon="pi pi-times"
                  severity="danger"
                  [text]="true"
                  [label]="
                    'adminServices.removeImage' | translate
                  "
                  [disabled]="saving() || uploadingImage()"
                  (onClick)="removeImage()"
                />
              }
            </div>
          </div>

          <p class="mt-2 text-xs app-muted">
            {{ 'adminServices.imageHelp' | translate }}
          </p>

          @if (serverFieldErrors()['image']; as error) {
            <p-message
              severity="error"
              variant="simple"
              styleClass="mt-2"
            >
              {{ error }}
            </p-message>
          }
        </div>

        <div class="rounded-2xl bg-[var(--app-surface-muted)] p-4">
          <div class="mb-4">
            <h3 class="text-sm font-semibold">
              {{ 'adminServices.localizedContent' | translate }}
            </h3>

            <p class="mt-1 text-xs app-muted">
              {{ 'adminServices.localizedContentHelp' | translate }}
            </p>
          </div>

          <div class="space-y-6">
            @for (field of localizedFields; track field.key) {
              <div>
                <label class="app-label">
                  {{ field.labelKey | translate }}
                  <span class="text-red-500" aria-hidden="true">*</span>
                </label>

                <div class="mt-2 grid gap-3">
                  @for (lang of languages; track lang.code) {
                    <div>
                      <label
                        [for]="'service-' + field.key + '-' + lang.code"
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
                          [id]="'service-' + field.key + '-' + lang.code"
                          [rows]="field.rows ?? 3"
                          [formControl]="localizedControl(field.key, lang.code)"
                          class="w-full"
                          [dir]="lang.dir"
                          [readonly]="saving()"
                          [class.ng-invalid]="
                            isLocalizedInvalid(field.key, lang.code) ||
                            !!serverLocalizedError(field.key, lang.code)
                          "
                          [class.ng-dirty]="
                            localizedControl(field.key, lang.code).touched
                          "
                        ></textarea>
                      } @else {
                        <input
                          pInputText
                          [id]="'service-' + field.key + '-' + lang.code"
                          [formControl]="localizedControl(field.key, lang.code)"
                          class="w-full"
                          [dir]="lang.dir"
                          autocomplete="off"
                          [readonly]="saving()"
                          [class.ng-invalid]="
                            isLocalizedInvalid(field.key, lang.code) ||
                            !!serverLocalizedError(field.key, lang.code)
                          "
                          [class.ng-dirty]="
                            localizedControl(field.key, lang.code).touched
                          "
                        />
                      }

                      @if (isLocalizedInvalid(field.key, lang.code)) {
                        <p-message
                          severity="error"
                          variant="simple"
                          styleClass="mt-2"
                        >
                          {{
                            localizedErrorKey(field.key, lang.code) | translate
                          }}
                        </p-message>
                      }

                      @if (
                        serverLocalizedError(field.key, lang.code);
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
      </form>

      <ng-template #footer>
        <p-button
          type="button"
          [label]="'adminServices.cancel' | translate"
          severity="secondary"
          [text]="true"
          [disabled]="saving()"
          (onClick)="closeDialog()"
        />

        <p-button
          type="button"
          icon="pi pi-check"
          [label]="'adminServices.save' | translate"
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
export class ServicesAdminComponent implements OnInit {
  private readonly api = inject(ServiceOfferService);
  private readonly media = inject(MediaService);
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
    rows?: number;
  }[] = [
    {
      key: 'name',
      labelKey: 'adminServices.name',
      multiline: false
    },
    {
      key: 'description',
      labelKey: 'adminServices.description',
      multiline: true,
      rows: 3
    }
  ];

  readonly services = signal<ServiceOfferAdmin[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  private loadTicket = 0;

  readonly searchControl = new FormControl('', {
    nonNullable: true
  });

  readonly searchTerm = signal('');

  readonly filteredServices = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.services();
    }

    return this.services().filter(service => {
      const names = [
        service.name?.fr,
        service.name?.en,
        service.name?.ar
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const descs = [
        service.description?.fr,
        service.description?.en,
        service.description?.ar
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return names.includes(term) || descs.includes(term);
    });
  });

  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly uploadingImage = signal(false);

  readonly formError = signal<string | null>(null);

  readonly serverFieldErrors =
    signal<Record<string, string>>({});

  readonly form = new FormGroup({
    name: this.localizedGroup(255),
    description: this.localizedGroup(2000),

    image: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(500)]
    }),

    position: new FormControl<number | null>(0, {
      validators: [Validators.min(0)]
    })
  });

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.searchTerm.set(value);
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const ticket = ++this.loadTicket;

    this.loading.set(true);
    this.loadError.set(null);

    this.api.getAdminServices().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (ticket === this.loadTicket) {
          this.loading.set(false);
        }
      })
    ).subscribe({
      next: services => {
        if (ticket === this.loadTicket) {
          this.services.set(services);
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

  serviceImageUrl(
    service: ServiceOfferAdmin
  ): string | null {
    return service.imageUrl ?? resolveMediaUrl(service.image);
  }

  resolveImage(value: string | null | undefined): string {
    return resolveMediaUrl(value) ?? '';
  }

  resolveLocalized(value: LocalizedText | null | undefined): string {
    if (!value) {
      return '';
    }

    const currentLang = this.language.current();
    return value[currentLang] || value.fr || value.en || value.ar || '';
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

    if (control.hasError('maxlength')) {
      return field === 'name'
        ? 'adminServices.nameTooLong'
        : 'adminServices.descTooLong';
    }

    return field === 'name'
      ? 'adminServices.nameRequired'
      : 'adminServices.descRequired';
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

  openCreate(): void {
    this.editingId.set(null);
    this.resetForm();
    this.dialogVisible.set(true);
  }

  openEdit(service: ServiceOfferAdmin): void {
    this.editingId.set(service.id);
    this.resetForm();

    this.form.setValue({
      name: this.toLocalized(service.name),
      description: this.toLocalized(service.description),
      image: service.image ?? null,
      position: service.position ?? 0
    });

    this.dialogVisible.set(true);
  }

  closeDialog(): void {
    if (!this.saving()) {
      this.dialogVisible.set(false);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    input.value = '';

    if (!file || this.uploadingImage()) {
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('adminServices.error'),
        detail: this.translate.instant('adminServices.imageSizeError'),
        life: 6000
      });
      return;
    }

    this.uploadingImage.set(true);

    this.media.uploadImages([file]).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.uploadingImage.set(false))
    ).subscribe({
      next: media => {
        const path = media[0]?.path;

        if (path) {
          this.form.controls.image.setValue(path);
          this.form.controls.image.markAsDirty();
        }
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
            'adminServices.error'
          ),
          detail: this.translate.instant(
            'adminServices.imageUploadError'
          ),
          life: 6000
        });
      }
    });
  }

  removeImage(): void {
    this.form.controls.image.setValue(null);
    this.form.controls.image.markAsDirty();
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

    const payload: ServiceOfferAdminRequest = {
      name: this.cleanLocalized(values.name),
      description: this.cleanLocalized(values.description),
      image: values.image,
      position: values.position ?? 0
    };

    const id = this.editingId();

    const request$ = id
      ? this.api.updateService(id, payload)
      : this.api.createService(payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.dialogVisible.set(false);

        this.notify(
          id
            ? 'adminServices.updated'
            : 'adminServices.created'
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

  confirmDelete(service: ServiceOfferAdmin): void {
    if (this.deletingId()) {
      return;
    }

    const serviceName = this.resolveLocalized(service.name);

    this.confirmation.confirm({
      header: this.translate.instant(
        'adminServices.deleteTitle'
      ),

      message: this.translate.instant(
        'adminServices.deleteQuestion',
        { name: serviceName }
      ),

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: this.translate.instant(
        'adminServices.delete'
      ),

      rejectLabel: this.translate.instant(
        'adminServices.cancel'
      ),

      acceptButtonStyleClass: 'p-button-danger',

      rejectButtonStyleClass: 'p-button-text',

      accept: () => this.deleteService(service.id)
    });
  }

  private deleteService(id: string): void {
    this.deletingId.set(id);

    this.api.deleteService(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deletingId.set(null))
    ).subscribe({
      next: () => {
        this.notify('adminServices.deletedSuccess');
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
            'adminServices.error'
          ),
          detail: this.errorMessage(error),
          life: 6000
        });
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

  private resetForm(): void {
    this.form.reset({
      name: this.emptyLocalized(),
      description: this.emptyLocalized(),
      image: null,
      position: 0
    });

    this.formError.set(null);
    this.serverFieldErrors.set({});
  }

  private notify(key: string): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant(
        'adminServices.success'
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
      'adminServices.genericError'
    );
  }
}
