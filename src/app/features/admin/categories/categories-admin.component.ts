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
  SkillCategory,
  SkillCategoryRequest
} from '../../../core/models/skill.model';

import {
  SkillService
} from '../../../core/services/skill.service';

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
  selector: 'app-admin-categories',
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
          {{ 'adminPages.categories.title' | translate }}
        </h1>

        <p class="mt-2 max-w-2xl app-muted">
          {{ 'adminPages.categories.subtitle' | translate }}
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
              [placeholder]="'adminCategories.search' | translate"
              [attr.aria-label]="
                'adminCategories.search' | translate
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
              [ariaLabel]="'adminCategories.refresh' | translate"
              [pTooltip]="'adminCategories.refresh' | translate"
              (onClick)="load()"
            />

            <p-button
              icon="pi pi-plus"
              [label]="'adminCategories.new' | translate"
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
          [value]="filteredCategories()"
          [loading]="loading()"
          dataKey="id"
          size="small"
          [rowHover]="true"
          [tableStyle]="{ 'min-width': '48rem' }"
        >
          <ng-template #header>
            <tr>
              <th class="w-16">
                {{ 'adminCategories.position' | translate }}
              </th>

              <th class="w-24">
                {{ 'adminCategories.image' | translate }}
              </th>

              <th>
                {{ 'adminCategories.name' | translate }}
              </th>

              <th class="w-48">
                {{ 'adminCategories.color' | translate }}
              </th>

              <th class="w-32">
                {{ 'adminCategories.actions' | translate }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-category>
            <tr>
              <td>
                <span
                  class="inline-flex min-w-8 items-center justify-center
                         rounded-full bg-indigo-50 px-2 py-0.5 text-xs
                         font-semibold text-indigo-600
                         dark:bg-indigo-500/10 dark:text-indigo-300"
                >
                  {{ category.position }}
                </span>
              </td>

              <td>
                @if (categoryImageUrl(category); as imageUrl) {
                  <img
                    [src]="imageUrl"
                    [alt]="category.name"
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
                  {{ category.name }}
                </span>
              </td>

              <td>
                <span class="inline-flex items-center gap-2">
                  <span
                    class="h-6 w-6 rounded-md
                           border border-[var(--app-border)]"
                    [style.background]="
                      category.color || 'transparent'
                    "
                    aria-hidden="true"
                  ></span>

                  @if (category.color) {
                    <span class="font-mono text-xs app-muted">
                      {{ category.color }}
                    </span>
                  } @else {
                    <span class="text-xs app-muted">
                      {{ 'adminCategories.noColor' | translate }}
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
                      'adminCategories.edit' | translate
                    "
                    [pTooltip]="
                      'adminCategories.edit' | translate
                    "
                    (onClick)="openEdit(category)"
                  />

                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    [loading]="deletingId() === category.id"
                    [disabled]="
                      deletingId() !== null &&
                      deletingId() !== category.id
                    "
                    [ariaLabel]="
                      'adminCategories.delete' | translate
                    "
                    [pTooltip]="
                      'adminCategories.delete' | translate
                    "
                    (onClick)="confirmDelete(category)"
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
                      class="pi pi-tags text-2xl"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <p class="font-semibold">
                    {{
                      searchTerm()
                        ? 'adminCategories.searchEmpty'
                        : 'adminCategories.empty'
                    }}
                  </p>

                  @if (!searchTerm()) {
                    <p class="text-sm app-muted">
                      {{ 'adminCategories.emptyHint' | translate }}
                    </p>

                    <p-button
                      icon="pi pi-plus"
                      [label]="'adminCategories.new' | translate"
                      [outlined]="true"
                      (onClick)="openCreate()"
                    />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

        @if (filteredCategories().length) {
          <div
            class="mt-4 border-t border-[var(--app-border)] pt-4"
          >
            <p class="text-sm app-muted">
              {{
                'adminCategories.total'
                  | translate: { count: filteredCategories().length }
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
          ? 'adminCategories.editTitle'
          : 'adminCategories.createTitle') | translate
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
        id="category-form"
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
          <label for="category-name" class="app-label">
            {{ 'adminCategories.name' | translate }}
            <span class="text-red-500" aria-hidden="true">*</span>
          </label>

          <input
            pInputText
            id="category-name"
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
            aria-describedby="category-name-error"
          />

          @if (
            form.controls.name.invalid &&
            form.controls.name.touched
          ) {
            <p-message
              id="category-name-error"
              severity="error"
              variant="simple"
              styleClass="mt-2"
            >
              {{
                form.controls.name.hasError('maxlength')
                  ? ('adminCategories.nameTooLong' | translate)
                  : ('adminCategories.nameRequired' | translate)
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
            {{ 'adminCategories.image' | translate }}
          </span>

          <div class="flex flex-wrap items-center gap-4">
            @if (form.controls.image.value) {
              <img
                [src]="resolveImage(form.controls.image.value)"
                [alt]="'adminCategories.image' | translate"
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
                [label]="'adminCategories.uploadImage' | translate"
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
                  [label]="'adminCategories.removeImage' | translate"
                  [disabled]="saving() || uploadingImage()"
                  (onClick)="removeImage()"
                />
              }
            </div>
          </div>

          <p class="mt-2 text-xs app-muted">
            {{ 'adminCategories.imageHelp' | translate }}
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
          <label for="category-position" class="app-label">
            {{ 'adminCategories.position' | translate }}
          </label>

          <p-inputnumber
            inputId="category-position"
            formControlName="position"
            [min]="0"
            [showButtons]="true"
            [readonly]="saving()"
            styleClass="w-full"
            inputStyleClass="w-full"
            ariaDescribedBy="category-position-help"
          />

          <p
            id="category-position-help"
            class="mt-2 text-xs app-muted"
          >
            {{ 'adminCategories.positionHelp' | translate }}
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
              {{ 'adminCategories.positionInvalid' | translate }}
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
            {{ 'adminCategories.color' | translate }}
          </span>

          <div class="flex flex-wrap items-center gap-3">
            @if (form.controls.hasColor.value) {
              <app-color-input
                inputId="category-color"
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
                {{ 'adminCategories.noColor' | translate }}
              </span>
            }

            <div class="flex items-center gap-2">
              <p-checkbox
                inputId="category-has-color"
                formControlName="hasColor"
                [binary]="true"
                [disabled]="saving()"
              />

              <label
                for="category-has-color"
                class="cursor-pointer text-sm"
              >
                {{ 'adminCategories.useColor' | translate }}
              </label>
            </div>
          </div>

          <p
            id="category-color-help"
            class="mt-2 text-xs app-muted"
          >
            {{ 'adminCategories.colorHelp' | translate }}
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
          [label]="'adminCategories.cancel' | translate"
          severity="secondary"
          [text]="true"
          [disabled]="saving()"
          (onClick)="closeDialog()"
        />

        <p-button
          type="button"
          icon="pi pi-check"
          [label]="'adminCategories.save' | translate"
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
export class CategoriesAdminComponent implements OnInit {
  private readonly api = inject(SkillService);
  private readonly media = inject(MediaService);
  private readonly translate = inject(TranslateService);
  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = signal<SkillCategory[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  private loadTicket = 0;

  readonly searchControl = new FormControl('', {
    nonNullable: true
  });

  readonly searchTerm = signal('');

  readonly filteredCategories = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.categories();
    }

    return this.categories().filter(category =>
      category.name.toLowerCase().includes(term)
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

    position: new FormControl<number | null>(0, {
      validators: [Validators.min(0)]
    }),

    image: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(500)]
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
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const ticket = ++this.loadTicket;

    this.loading.set(true);
    this.loadError.set(null);

    this.api.getAdminSkillCategories().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        if (ticket === this.loadTicket) {
          this.loading.set(false);
        }
      })
    ).subscribe({
      next: categories => {
        if (ticket === this.loadTicket) {
          this.categories.set(categories);
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

  openCreate(): void {
    this.editingId.set(null);
    this.resetForm();
    this.form.controls.position.setValue(this.nextPosition(), {
      emitEvent: false
    });
    this.dialogVisible.set(true);
  }

  openEdit(category: SkillCategory): void {
    this.editingId.set(category.id);
    this.resetForm();

    const color = this.toPickerColor(category.color);

    this.form.setValue({
      name: category.name,
      position: category.position ?? 0,
      image: category.image ?? null,
      hasColor: color !== null,
      color: color ?? '6366f1'
    });

    this.dialogVisible.set(true);
  }

  resolveImage(value: string | null | undefined): string {
    return resolveMediaUrl(value) ?? '';
  }

  categoryImageUrl(category: SkillCategory): string | null {
    return category.imageUrl ?? resolveMediaUrl(category.image);
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
            'adminCategories.error'
          ),
          detail: this.translate.instant(
            'adminCategories.imageUploadError'
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

    const payload: SkillCategoryRequest = {
      name: values.name.trim(),
      position: values.position ?? 0,
      image: values.image,
      color: values.hasColor
        ? this.normalizeColor(values.color)
        : null
    };

    const id = this.editingId();

    const request$ = id
      ? this.api.updateSkillCategory(id, payload)
      : this.api.createSkillCategory(payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.dialogVisible.set(false);

        this.notify(
          id
            ? 'adminCategories.updated'
            : 'adminCategories.created'
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

  confirmDelete(category: SkillCategory): void {
    if (this.deletingId()) {
      return;
    }

    this.confirmation.confirm({
      header: this.translate.instant(
        'adminCategories.deleteTitle'
      ),

      message: this.translate.instant(
        'adminCategories.deleteQuestion',
        { name: category.name }
      ),

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: this.translate.instant(
        'adminCategories.delete'
      ),

      rejectLabel: this.translate.instant(
        'adminCategories.cancel'
      ),

      acceptButtonStyleClass: 'p-button-danger',

      rejectButtonStyleClass: 'p-button-text',

      accept: () => this.deleteCategory(category.id)
    });
  }

  private deleteCategory(id: string): void {
    this.deletingId.set(id);

    this.api.deleteSkillCategory(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deletingId.set(null))
    ).subscribe({
      next: () => {
        this.notify('adminCategories.deletedSuccess');
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
            'adminCategories.error'
          ),
          detail: this.errorMessage(error),
          life: 6000
        });
      }
    });
  }

  private nextPosition(): number {
    const positions = this.categories().map(
      category => category.position ?? 0
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
      name: '',
      position: 0,
      image: null,
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
        'adminCategories.success'
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
      'adminCategories.genericError'
    );
  }
}
