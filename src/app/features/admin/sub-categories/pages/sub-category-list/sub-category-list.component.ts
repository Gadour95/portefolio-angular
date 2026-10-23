import {
  Component,
  DestroyRef,
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
  toObservable,
  toSignal
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
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import {
  PaginatorModule,
  PaginatorState
} from 'primeng/paginator';

import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import {
  Subject,
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  startWith,
  switchMap
} from 'rxjs';

import {
  ApiError
} from '../../../../../core/models/api-error.model';

import {
  DeletionFilter,
  PageResponse
} from '../../../../../core/models/page-response.model';

import {
  LanguageService
} from '../../../../../core/services/language.service';

import {
  Category
} from '../../../categories/models/category.model';

import {
  CategoryLookupService
} from '../../../categories/services/category-lookup.service';

import {
  SubCategory,
  SubCategoryQuery
} from '../../models/sub-category.model';

import {
  AdminSubCategoryService
} from '../../services/admin-sub-category.service';

interface SubCategoryListState {
  data: PageResponse<SubCategory> | null;
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-sub-category-list',
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
    InputTextModule,
    MessageModule,
    PaginatorModule,
    SelectModule,
    TableModule,
    TextareaModule,
    ToolbarModule,
    TooltipModule
  ],

  providers: [ConfirmationService],

  templateUrl: './sub-category-list.component.html'
})
export class SubCategoryListComponent {
  private readonly api = inject(AdminSubCategoryService);
  private readonly categoryLookup = inject(CategoryLookupService);

  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly refresh$ = new Subject<void>();

  readonly query = signal<SubCategoryQuery>({
    categoryId: null,
    search: '',
    deletion: 'ACTIVE',
    page: 0,
    size: 20
  });

  readonly searchControl = new FormControl('', {
    nonNullable: true
  });

  readonly categoryFilterControl =
    new FormControl<string | null>(null);

  readonly deletionControl =
    new FormControl<DeletionFilter>('ACTIVE', {
      nonNullable: true
    });

  readonly allCategories = signal<Category[]>([]);
  readonly activeCategories = signal<Category[]>([]);

  readonly categoriesLoading = signal(false);
  readonly categoriesError = signal<string | null>(null);

  readonly dialogVisible = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);

  readonly formError = signal<string | null>(null);

  readonly serverFieldErrors =
    signal<Record<string, string>>({});

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/)
      ]
    }),

    description: new FormControl('', {
      nonNullable: true
    }),

    categoryId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  readonly deletionOptions = computed(() => {
    this.language.current();

    return [
      {
        label: this.translate.instant('adminCategories.active'),
        value: 'ACTIVE'
      },
      {
        label: this.translate.instant('adminCategories.deleted'),
        value: 'DELETED'
      },
      {
        label: this.translate.instant('adminCategories.all'),
        value: 'ALL'
      }
    ];
  });

  readonly categoryNames = computed(() =>
    new Map(
      this.allCategories().map(category => [
        category.id,
        category.name
      ])
    )
  );

  readonly vm = toSignal(
    combineLatest([
      toObservable(this.query),
      this.refresh$.pipe(startWith(undefined))
    ]).pipe(
      switchMap(([query]) =>
        this.api.findAll(query).pipe(
          map(data => ({
            data,
            loading: false,
            error: null
          }) as SubCategoryListState),

          catchError((error: unknown) =>
            of<SubCategoryListState>({
              data: null,
              loading: false,
              error: this.errorMessage(error)
            })
          ),

          startWith<SubCategoryListState>({
            data: null,
            loading: true,
            error: null
          })
        )
      )
    ),

    {
      initialValue: {
        data: null,
        loading: true,
        error: null
      } as SubCategoryListState
    }
  );

  constructor() {
    this.searchControl.valueChanges.pipe(
      debounceTime(350),
      map(value => value.trim()),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(search => {
      this.query.update(query => ({
        ...query,
        search,
        page: 0
      }));
    });

    this.categoryFilterControl.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(categoryId => {
      this.query.update(query => ({
        ...query,
        categoryId,
        page: 0
      }));
    });

    this.deletionControl.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(deletion => {
      this.query.update(query => ({
        ...query,
        deletion,
        page: 0
      }));
    });

    this.loadCategories();
  }

  loadCategories(): void {
    if (this.categoriesLoading()) {
      return;
    }

    this.categoriesLoading.set(true);
    this.categoriesError.set(null);

    forkJoin({
      all: this.categoryLookup.findAll('ALL'),
      active: this.categoryLookup.findAll('ACTIVE')
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.categoriesLoading.set(false))
    ).subscribe({
      next: categories => {
        this.allCategories.set(categories.all);
        this.activeCategories.set(categories.active);
      },

      error: (error: unknown) => {
        this.categoriesError.set(this.errorMessage(error));
      }
    });
  }

  reload(): void {
    this.refresh$.next();
  }

  changePage(event: PaginatorState): void {
    this.query.update(query => ({
      ...query,
      page: event.page ?? 0,
      size: event.rows ?? query.size
    }));
  }

  parentName(subCategory: SubCategory): string {
    return subCategory.categoryName
      || this.categoryNames().get(subCategory.categoryId)
      || subCategory.categoryId;
  }

  openCreate(): void {
    if (!this.canUseCategoryOptions()) {
      return;
    }

    this.editingId.set(null);
    this.resetForm();

    const selectedParent = this.query().categoryId;

    if (
      selectedParent &&
      this.activeCategories().some(
        category => category.id === selectedParent
      )
    ) {
      this.form.controls.categoryId.setValue(selectedParent);
    }

    this.dialogVisible.set(true);
  }

  openEdit(subCategory: SubCategory): void {
    if (
      this.query().deletion !== 'ACTIVE' ||
      !this.canUseCategoryOptions()
    ) {
      return;
    }

    this.editingId.set(subCategory.id);
    this.resetForm();

    const parentIsActive = this.activeCategories().some(
      category => category.id === subCategory.categoryId
    );

    this.form.setValue({
      name: subCategory.name,
      description: subCategory.description ?? '',
      categoryId: parentIsActive ? subCategory.categoryId : ''
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

    const values = this.form.getRawValue();

    const activeParent = this.activeCategories().some(
      category => category.id === values.categoryId
    );

    if (!activeParent) {
      this.formError.set(
        this.translate.instant(
          'adminSubCategories.activeCategoryRequired'
        )
      );

      return;
    }

    this.formError.set(null);
    this.serverFieldErrors.set({});
    this.saving.set(true);

    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      categoryId: values.categoryId
    };

    const id = this.editingId();

    const request$ = id
      ? this.api.update(id, payload)
      : this.api.create(payload);

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.dialogVisible.set(false);

        this.notify(
          id
            ? 'adminSubCategories.updated'
            : 'adminSubCategories.created'
        );

        this.reload();
      },

      error: (error: unknown) => {
        this.formError.set(this.errorMessage(error));

        if (error instanceof HttpErrorResponse) {
          const body = error.error as ApiError | null;
          const errors: Record<string, string> = {};

          if (Array.isArray(body?.fieldErrors)) {
            for (const fieldError of body.fieldErrors) {
              errors[fieldError.field] = fieldError.error;
            }
          }

          this.serverFieldErrors.set(errors);
        }
      }
    });
  }

  confirmDelete(subCategory: SubCategory): void {
    if (
      this.query().deletion !== 'ACTIVE' ||
      this.deletingId()
    ) {
      return;
    }

    this.confirmation.confirm({
      header: this.translate.instant(
        'adminSubCategories.deleteTitle'
      ),

      message: this.translate.instant(
        'adminSubCategories.deleteQuestion',
        { name: subCategory.name }
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

      accept: () => this.deleteSubCategory(subCategory.id)
    });
  }

  private deleteSubCategory(id: string): void {
    this.deletingId.set(id);

    this.api.delete(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deletingId.set(null))
    ).subscribe({
      next: () => {
        this.notify('adminSubCategories.deletedSuccess');

        const page = this.vm().data;

        if (
          this.query().page > 0 &&
          page?.content.length === 1
        ) {
          this.query.update(query => ({
            ...query,
            page: query.page - 1
          }));
        } else {
          this.reload();
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
          detail: this.errorMessage(error),
          life: 6000
        });
      }
    });
  }

  private canUseCategoryOptions(): boolean {
    return (
      !this.categoriesLoading() &&
      !this.categoriesError() &&
      this.activeCategories().length > 0
    );
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      description: '',
      categoryId: ''
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