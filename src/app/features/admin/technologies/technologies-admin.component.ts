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
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
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
  Technology,
  TechnologyRequest
} from '../../../core/models/technology.model';

import {
  TechnologyService
} from '../../../core/services/technology.service';

import {
  MediaService
} from '../../../core/services/media.service';

import {
  resolveMediaUrl
} from '../../../core/http/media-url';

import {
  ColorInputComponent
} from '../../../shared/components/color-input/color-input.component';

@Component({
  selector: 'app-admin-technologies',
  standalone: true,

  imports: [
    ReactiveFormsModule,
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
    PaginatorModule,
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
          {{ 'adminPages.technologies.title' | translate }}
        </h1>

        <p class="mt-2 max-w-2xl app-muted">
          {{ 'adminPages.technologies.subtitle' | translate }}
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
              [placeholder]="'adminTechnologies.search' | translate"
              [attr.aria-label]="
                'adminTechnologies.search' | translate
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
              [ariaLabel]="'adminTechnologies.refresh' | translate"
              [pTooltip]="'adminTechnologies.refresh' | translate"
              (onClick)="load()"
            />

            <p-button
              icon="pi pi-plus"
              [label]="'adminTechnologies.new' | translate"
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
          [value]="paginatedTechnologies()"
          [loading]="loading()"
          dataKey="id"
          size="small"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '50rem' }"
        >
          <ng-template #header>
            <tr>
              <th class="w-16">
                {{ 'adminTechnologies.position' | translate }}
              </th>

              <th class="w-24">
                {{ 'adminTechnologies.image' | translate }}
              </th>

              <th>
                {{ 'adminTechnologies.name' | translate }}
              </th>

              <th class="w-48">
                {{ 'adminTechnologies.color' | translate }}
              </th>

              <th class="w-32">
                {{ 'adminTechnologies.actions' | translate }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-technology>
            <tr>
              <td>
                <span
                  class="inline-flex min-w-8 items-center justify-center
                         rounded-full bg-indigo-50 px-2 py-0.5 text-xs
                         font-semibold text-indigo-600
                         dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  {{ technology.position }}
                </span>
              </td>

              <td>
                @if (technologyImageUrl(technology); as imageUrl) {
                  <img
                    [src]="imageUrl"
                    [alt]="technology.name"
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
                    <i class="pi pi-image text-sm app-muted"></i>
                  </span>
                }
              </td>

              <td>
                <span class="font-semibold">
                  {{ technology.name }}
                </span>
              </td>

              <td>
                <span class="inline-flex items-center gap-2">
                  <span
                    class="h-6 w-6 rounded-md
                           border border-[var(--app-border)]"
                    [style.background]="
                      technology.color || 'transparent'
                    "
                    aria-hidden="true"
                  ></span>

                  @if (technology.color) {
                    <span class="font-mono text-xs app-muted">
                      {{ technology.color }}
                    </span>
                  } @else {
                    <span class="text-xs app-muted">
                      {{ 'adminTechnologies.noColor' | translate }}
                    </span>
                  }
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
                      'adminTechnologies.edit' | translate
                    "
                    [pTooltip]="
                      'adminTechnologies.edit' | translate
                    "
                    (onClick)="openEdit(technology)"
                  />

                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    [loading]="deletingId() === technology.id"
                    [disabled]="
                      deletingId() !== null &&
                      deletingId() !== technology.id
                    "
                    [ariaLabel]="
                      'adminTechnologies.delete' | translate
                    "
                    [pTooltip]="
                      'adminTechnologies.delete' | translate
                    "
                    (onClick)="confirmDelete(technology)"
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
                      class="pi pi-microchip text-2xl"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <p class="font-semibold">
                    {{
                      searchTerm()
                        ? 'adminTechnologies.searchEmpty'
                        : 'adminTechnologies.empty'
                    }}
                  </p>

                  @if (!searchTerm()) {
                    <p class="text-sm app-muted">
                      {{ 'adminTechnologies.emptyHint' | translate }}
                    </p>

                    <p-button
                      icon="pi pi-plus"
                      [label]="'adminTechnologies.new' | translate"
                      [outlined]="true"
                      (onClick)="openCreate()"
                    />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

        @if (filteredTechnologies().length > pageSize) {
          <p-paginator
            [rows]="pageSize"
            [totalRecords]="filteredTechnologies().length"
            [first]="currentPage() * pageSize"
            (onPageChange)="onPageChange($event)"
          />
        }

        @if (filteredTechnologies().length) {
          <div
            class="mt-4 border-t border-[var(--app-border)] pt-4"
          >
            <p class="text-sm app-muted">
              {{
                'adminTechnologies.total'
                  | translate
                    : { count: filteredTechnologies().length }
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
          ? 'adminTechnologies.editTitle'
          : 'adminTechnologies.createTitle') | translate
      "
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [closable]="!saving()"
      [closeOnEscape]="!saving()"
      [dismissableMask]="false"
      [style]="{
        width: '36rem',
        maxWidth: 'calc(100vw - 2rem)'
      }"
    >
      <form
        id="technology-form"
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
          <label for="technology-name" class="app-label">
            {{ 'adminTechnologies.name' | translate }}
            <span class="text-red-500" aria-hidden="true">*</span>
          </label>

          <input
            pInputText
            id="technology-name"
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
            aria-describedby="technology-name-error"
          />

          @if (
            form.controls.name.invalid &&
            form.controls.name.touched
          ) {
            <p-message
              id="technology-name-error"
              severity="error"
              variant="simple"
              styleClass="mt-2"
            >
              {{
                form.controls.name.hasError('maxlength')
                  ? ('adminTechnologies.nameTooLong' | translate)
                  : ('adminTechnologies.nameRequired' | translate)
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

        <div>
          <span class="app-label">
            {{ 'adminTechnologies.image' | translate }}
          </span>

          <div class="flex flex-wrap items-center gap-4">
            @if (form.controls.image.value) {
              <img
                [src]="resolveImage(form.controls.image.value)"
                [alt]="'adminTechnologies.image' | translate"
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
                accept="image/jpeg,image/jpg,image/png,image/webp"
                (change)="onImageSelected($event)"
              />

              <p-button
                type="button"
                icon="pi pi-upload"
                severity="secondary"
                [outlined]="true"
                [label]="
                  'adminTechnologies.uploadImage' | translate
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
                    'adminTechnologies.removeImage' | translate
                  "
                  [disabled]="saving() || uploadingImage()"
                  (onClick)="removeImage()"
                />
              }
            </div>
          </div>

          <p class="mt-2 text-xs app-muted">
            {{ 'adminTechnologies.imageHelp' | translate }}
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

        <div>
          <label for="technology-position" class="app-label">
            {{ 'adminTechnologies.position' | translate }}
          </label>

          <p-inputnumber
            inputId="technology-position"
            formControlName="position"
            [min]="0"
            [showButtons]="true"
            [readonly]="saving()"
            styleClass="w-full"
            inputStyleClass="w-full"
            ariaDescribedBy="technology-position-help"
          />

          <p
            id="technology-position-help"
            class="mt-2 text-xs app-muted"
          >
            {{ 'adminTechnologies.positionHelp' | translate }}
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
              {{ 'adminTechnologies.positionInvalid' | translate }}
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
            {{ 'adminTechnologies.color' | translate }}
          </span>

          <div class="flex flex-wrap items-center gap-3">
            @if (form.controls.hasColor.value) {
              <app-color-input
                inputId="technology-color"
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
                {{ 'adminTechnologies.noColor' | translate }}
              </span>
            }

            <div class="flex items-center gap-2">
              <p-checkbox
                inputId="technology-has-color"
                formControlName="hasColor"
                [binary]="true"
                [disabled]="saving()"
              />

              <label
                for="technology-has-color"
                class="cursor-pointer text-sm"
              >
                {{ 'adminTechnologies.useColor' | translate }}
              </label>
            </div>
          </div>

          <p class="mt-2 text-xs app-muted">
            {{ 'adminTechnologies.colorHelp' | translate }}
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
          [label]="'adminTechnologies.cancel' | translate"
          severity="secondary"
          [text]="true"
          [disabled]="saving()"
          (onClick)="closeDialog()"
        />

        <p-button
          type="button"
          icon="pi pi-check"
          [label]="'adminTechnologies.save' | translate"
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
export class TechnologiesAdminComponent implements OnInit {
  private readonly api = inject(TechnologyService);
  private readonly media = inject(MediaService);
  private readonly translate = inject(TranslateService);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly technologies = signal<Technology[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  private loadTicket = 0;

  readonly searchControl = new FormControl('', {
    nonNullable: true
  });

  readonly searchTerm = signal('');

  readonly pageSize = 10;
  readonly currentPage = signal(0);

  readonly filteredTechnologies = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.technologies();
    }

    return this.technologies().filter(technology =>
      technology.name.toLowerCase().includes(term)
    );
  });

  readonly paginatedTechnologies = computed(() => {
    const start = this.currentPage() * this.pageSize;

    return this.filteredTechnologies().slice(
      start,
      start + this.pageSize
    );
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
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(120)
      ]
    }),

    image: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(500)]
    }),

    position: new FormControl<number | null>(0, {
      validators: [Validators.min(0)]
    }),

    hasColor: new FormControl(true, {
      nonNullable: true
    }),

    color: new FormControl('6366f1', {
      nonNullable: true,
      validators: [Validators.maxLength(30)]
    })
  });

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.searchTerm.set(value);
      this.currentPage.set(0);
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const ticket = ++this.loadTicket;

    this.loading.set(true);
    this.loadError.set(null);

    this.api.getAdminTechnologies().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (ticket === this.loadTicket) {
          this.loading.set(false);
        }
      })
    ).subscribe({
      next: technologies => {
        if (ticket === this.loadTicket) {
          this.technologies.set(technologies);
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

  technologyImageUrl(
    technology: Technology
  ): string | null {
    return technology.imageUrl ?? resolveMediaUrl(technology.image);
  }

  resolveImage(value: string | null | undefined): string {
    return resolveMediaUrl(value) ?? '';
  }

  openCreate(): void {
    this.editingId.set(null);
    this.resetForm();
    this.form.controls.position.setValue(this.nextPosition(), {
      emitEvent: false
    });
    this.dialogVisible.set(true);
  }

  openEdit(technology: Technology): void {
    this.editingId.set(technology.id);
    this.resetForm();

    const color = this.toPickerColor(technology.color);

    this.form.setValue({
      name: technology.name,
      image: technology.image ?? null,
      position: technology.position ?? 0,
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

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    input.value = '';

    if (!file || this.uploadingImage()) {
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
            'adminTechnologies.error'
          ),
          detail: this.translate.instant(
            'adminTechnologies.imageUploadError'
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

    const payload: TechnologyRequest = {
      name: values.name.trim(),
      image: values.image,
      position: values.position ?? 0,
      color: values.hasColor
        ? this.normalizeColor(values.color)
        : null
    };

    const id = this.editingId();

    const request$ = id
      ? this.api.updateTechnology(id, payload)
      : this.api.createTechnology(payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.dialogVisible.set(false);

        this.notify(
          id
            ? 'adminTechnologies.updated'
            : 'adminTechnologies.created'
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

  confirmDelete(technology: Technology): void {
    if (this.deletingId()) {
      return;
    }

    this.confirmation.confirm({
      header: this.translate.instant(
        'adminTechnologies.deleteTitle'
      ),

      message: this.translate.instant(
        'adminTechnologies.deleteQuestion',
        { name: technology.name }
      ),

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: this.translate.instant(
        'adminTechnologies.delete'
      ),

      rejectLabel: this.translate.instant(
        'adminTechnologies.cancel'
      ),

      acceptButtonStyleClass: 'p-button-danger',

      rejectButtonStyleClass: 'p-button-text',

      accept: () => this.deleteTechnology(technology.id)
    });
  }

  private deleteTechnology(id: string): void {
    this.deletingId.set(id);

    this.api.deleteTechnology(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deletingId.set(null))
    ).subscribe({
      next: () => {
        this.notify('adminTechnologies.deletedSuccess');
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
            'adminTechnologies.error'
          ),
          detail: this.errorMessage(error),
          life: 6000
        });
      }
    });
  }

  onPageChange(event: PaginatorState): void {
    this.currentPage.set(event.page ?? 0);
  }

  private nextPosition(): number {
    const positions = this.technologies().map(
      technology => technology.position ?? 0
    );

    return positions.length
      ? Math.max(...positions) + 1
      : 0;
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

    const match = value.trim().match(
      /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i
    );

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
      name: '',
      image: null,
      position: 0,
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
        'adminTechnologies.success'
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
      'adminTechnologies.genericError'
    );
  }
}
