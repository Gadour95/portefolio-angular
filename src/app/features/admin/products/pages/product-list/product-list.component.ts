import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  DecimalPipe,
  registerLocaleData
} from '@angular/common';

import localeFr from '@angular/common/locales/fr';
import localeAr from '@angular/common/locales/ar';

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
import { DrawerModule } from 'primeng/drawer';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';

import {
  PaginatorModule,
  PaginatorState
} from 'primeng/paginator';

import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';

import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  catchError,
  combineLatest,
  distinctUntilChanged,
  finalize,
  map,
  merge,
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
  SubCategory
} from '../../../sub-categories/models/sub-category.model';

import {
  SubCategoryLookupService
} from '../../../sub-categories/services/sub-category-lookup.service';

import {
  ProductMediaViewerComponent
} from '../../components/product-media-viewer.component';

import {
  AdminProduct,
  ProductQuery,
  ProductSort,
  ProductStatus
} from '../../models/product.model';

import {
  AdminProductService
} from '../../services/admin-product.service';

import {
  ProductFilterOptionsService
} from '../../services/product-filter-options.service';
import { Router } from '@angular/router';


registerLocaleData(localeFr);
registerLocaleData(localeAr);

type ProductAction = 'publish' | 'unpublish' | 'delete';

type ProductSeverity =
  | 'secondary'
  | 'success'
  | 'warn'
  | 'danger';

interface ProductListState {
  data: PageResponse<AdminProduct> | null;
  loading: boolean;
  error: string | null;
}

interface SubCategoryOptionsState {
  items: SubCategory[];
  loading: boolean;
  error: string | null;
}

function priceRangeValidator(
  control: AbstractControl
): ValidationErrors | null {
  const minimum = control.get('minPrice')?.value;
  const maximum = control.get('maxPrice')?.value;

  if (
    typeof minimum === 'number' &&
    typeof maximum === 'number' &&
    minimum > maximum
  ) {
    return { priceRange: true };
  }

  return null;
}

function defaultQuery(): ProductQuery {
  return {
    categoryId: null,
    subCategoryId: null,
    search: '',
    brand: '',
    minPrice: null,
    maxPrice: null,
    inStock: null,
    statuses: [],
    deletion: 'ACTIVE',
    sort: 'newest',
    page: 0,
    size: 20
  };
}

@Component({
  selector: 'app-product-list',
  standalone: true,

  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    DrawerModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    MultiSelectModule,
    PaginatorModule,
    SelectModule,
    SliderModule,
    TableModule,
    TagModule,
    ToolbarModule,
    TooltipModule,
    ProductMediaViewerComponent
  ],

  providers: [ConfirmationService],

  templateUrl: './product-list.component.html'
})
export class ProductListComponent {
  private readonly api = inject(AdminProductService);

  private readonly categoryLookup =
    inject(CategoryLookupService);

  private readonly subCategoryLookup =
    inject(SubCategoryLookupService);

  private readonly filterOptionsApi =
    inject(ProductFilterOptionsService);

  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly refresh$ = new Subject<void>();

  private readonly categorySelection$ =
    new BehaviorSubject<string | null>(null);

  private detailRequest?: Subscription;

  private readonly discoveredMaxPrice = signal(1);

  readonly query = signal<ProductQuery>(defaultQuery());

  readonly filtersVisible = signal(false);

  readonly categories = signal<Category[]>([]);
  readonly categoriesLoading = signal(false);
  readonly categoriesError = signal<string | null>(null);

  readonly brands = signal<string[]>([]);
  readonly filterOptionsLoading = signal(false);
  readonly filterOptionsError = signal<string | null>(null);

  readonly priceCeiling = signal(1);

  readonly priceRangeControl = new FormControl<number[]>(
    {
      value: [0, 1],
      disabled: true
    },
    {
      nonNullable: true
    }
  );

  readonly busyId = signal<string | null>(null);

  readonly detailVisible = signal(false);
  readonly detailLoading = signal(false);
  readonly detail = signal<AdminProduct | null>(null);
  readonly detailError = signal<string | null>(null);

  private readonly router = inject(Router);


  readonly filters = new FormGroup({
    search: new FormControl('', {
      nonNullable: true
    }),

    brand: new FormControl<string | null>(null),

    categoryId: new FormControl<string | null>(null),

    subCategoryId: new FormControl<string | null>(null),

    minPrice: new FormControl<number | null>(
      null,
      [Validators.min(0)]
    ),

    maxPrice: new FormControl<number | null>(
      null,
      [Validators.min(0)]
    ),

    inStock: new FormControl<boolean | null>(null),

    statuses: new FormControl<ProductStatus[]>([], {
      nonNullable: true
    }),

    deletion: new FormControl<DeletionFilter>('ACTIVE', {
      nonNullable: true
    }),

    sort: new FormControl<ProductSort>('newest', {
      nonNullable: true
    })
  }, {
    validators: [priceRangeValidator]
  });

  readonly locale = computed(() =>
    this.language.current() === 'en'
      ? 'en-US'
      : this.language.current()
  );

  readonly filterPosition = computed<'left' | 'right'>(() =>
    this.language.current() === 'ar' ? 'left' : 'right'
  );

  readonly brandOptions = computed(() =>
    this.brands().map(brand => ({
      label: brand,
      value: brand
    }))
  );

  readonly activeFilterCount = computed(() => {
    const query = this.query();

    return [
      !!query.search,
      !!query.brand,
      !!query.categoryId,
      !!query.subCategoryId,

      query.minPrice !== null ||
        query.maxPrice !== null,

      query.inStock !== null,
      query.statuses.length > 0,
      query.deletion !== 'ACTIVE'
    ].filter(Boolean).length;
  });

  readonly statusOptions = computed(() => {
    this.language.current();

    const statuses: ProductStatus[] = [
      'DRAFT',
      'PUBLISHED',
      'UNPUBLISHED',
      'DELETED'
    ];

    return statuses.map(value => ({
      value,
      label: this.translate.instant(
        `adminProducts.statuses.${value}`
      )
    }));
  });

  readonly deletionOptions = computed(() => {
    this.language.current();

    return [
      {
        value: 'ACTIVE',
        label: this.translate.instant('adminCategories.active')
      },
      {
        value: 'DELETED',
        label: this.translate.instant('adminCategories.deleted')
      },
      {
        value: 'ALL',
        label: this.translate.instant('adminCategories.all')
      }
    ];
  });

  readonly stockOptions = computed(() => {
    this.language.current();

    return [
      {
        value: true,
        label: this.translate.instant('adminProducts.inStock')
      },
      {
        value: false,
        label: this.translate.instant('adminProducts.outOfStock')
      }
    ];
  });

  readonly sortOptions = computed(() => {
    this.language.current();

    const values: ProductSort[] = [
      'newest',
      'oldest',
      'price_asc',
      'price_desc'
    ];

    return values.map(value => ({
      value,
      label: this.translate.instant(
        `adminProducts.sorts.${value}`
      )
    }));
  });

  readonly subCategories = toSignal(
    this.categorySelection$.pipe(
      distinctUntilChanged(),

      switchMap(categoryId => {
        if (!categoryId) {
          return of<SubCategoryOptionsState>({
            items: [],
            loading: false,
            error: null
          });
        }

        return this.subCategoryLookup
          .findByCategory(categoryId)
          .pipe(
            map(items => ({
              items,
              loading: false,
              error: null
            }) as SubCategoryOptionsState),

            catchError((error: unknown) =>
              of<SubCategoryOptionsState>({
                items: [],
                loading: false,
                error: this.errorMessage(error)
              })
            ),

            startWith<SubCategoryOptionsState>({
              items: [],
              loading: true,
              error: null
            })
          );
      })
    ),

    {
      initialValue: {
        items: [],
        loading: false,
        error: null
      } as SubCategoryOptionsState
    }
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
          }) as ProductListState),

          catchError((error: unknown) =>
            of<ProductListState>({
              data: null,
              loading: false,
              error: this.errorMessage(error)
            })
          ),

          startWith<ProductListState>({
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
      } as ProductListState
    }
  );

  constructor() {
    this.filters.controls.categoryId.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(categoryId => {
      this.filters.controls.subCategoryId.setValue(null);

      this.categorySelection$.next(categoryId);
    });

    this.setupPriceRange();

    this.loadCategories();
    this.loadFilterOptions();
  }

  loadCategories(): void {
    if (this.categoriesLoading()) {
      return;
    }

    this.categoriesLoading.set(true);
    this.categoriesError.set(null);

    this.categoryLookup.findAll('ALL').pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.categoriesLoading.set(false))
    ).subscribe({
      next: categories => {
        this.categories.set(categories);
      },

      error: (error: unknown) => {
        this.categoriesError.set(this.errorMessage(error));
      }
    });
  }

  loadFilterOptions(): void {
    if (this.filterOptionsLoading()) {
      return;
    }

    this.filterOptionsLoading.set(true);
    this.filterOptionsError.set(null);

    this.priceRangeControl.disable({
      emitEvent: false
    });

    this.filterOptionsApi.load().pipe(
      takeUntilDestroyed(this.destroyRef),

      finalize(() => {
        this.filterOptionsLoading.set(false);
      })
    ).subscribe({
      next: options => {
        this.brands.set(options.brands);
        this.discoveredMaxPrice.set(options.maxPrice);

        this.syncPriceRange();

        this.priceRangeControl.enable({
          emitEvent: false
        });
      },

      error: (error: unknown) => {
        this.filterOptionsError.set(
          this.errorMessage(error)
        );
      }
    });
  }

  openFilters(): void {
    this.filtersVisible.set(true);
  }

  applySearch(): void {
    this.query.update(query => ({
      ...query,
      search: this.filters.controls.search.value.trim(),
      page: 0
    }));
  }

  changeSort(): void {
    this.query.update(query => ({
      ...query,
      sort: this.filters.controls.sort.value,
      page: 0
    }));
  }

  applyFilters(): void {
    this.filters.markAllAsTouched();

    if (this.filters.invalid) {
      return;
    }

    const values = this.filters.getRawValue();

    this.query.set({
      ...values,
      search: values.search.trim(),
      brand: values.brand ?? '',
      page: 0,
      size: this.query().size
    });

    this.filtersVisible.set(false);
  }

  resetFilters(): void {
    const query = defaultQuery();

    this.filters.reset({
      search: query.search,
      brand: null,
      categoryId: query.categoryId,
      subCategoryId: query.subCategoryId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      inStock: query.inStock,
      statuses: query.statuses,
      deletion: query.deletion,
      sort: query.sort
    }, {
      emitEvent: false
    });

    this.categorySelection$.next(null);

    this.syncPriceRange();
    this.query.set(query);
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

  severity(status: ProductStatus): ProductSeverity {
    const values: Record<ProductStatus, ProductSeverity> = {
      DRAFT: 'secondary',
      PUBLISHED: 'success',
      UNPUBLISHED: 'warn',
      DELETED: 'danger'
    };

    return values[status];
  }

  canPublish(product: AdminProduct): boolean {
    return (
      this.query().deletion === 'ACTIVE' &&
      (
        product.status === 'DRAFT' ||
        product.status === 'UNPUBLISHED'
      )
    );
  }

  canUnpublish(product: AdminProduct): boolean {
    return (
      this.query().deletion === 'ACTIVE' &&
      product.status === 'PUBLISHED'
    );
  }

  canDelete(product: AdminProduct): boolean {
    return (
      this.query().deletion === 'ACTIVE' &&
      product.status !== 'DELETED'
    );
  }

  openDetail(product: AdminProduct): void {
    this.detailRequest?.unsubscribe();

    this.detail.set(null);
    this.detailError.set(null);
    this.detailVisible.set(true);
    this.detailLoading.set(true);

    this.detailRequest = this.api.findById(product.id).pipe(
      takeUntilDestroyed(this.destroyRef),

      finalize(() => {
        this.detailLoading.set(false);
      })
    ).subscribe({
      next: detail => {
        this.detail.set(detail);
      },

      error: (error: unknown) => {
        this.detailError.set(this.errorMessage(error));
      }
    });
  }

  closeDetail(): void {
    this.detailRequest?.unsubscribe();

    this.detailVisible.set(false);
    this.detail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(false);
  }

  onDetailVisibleChange(visible: boolean): void {
    if (!visible) {
      this.closeDetail();
    }
  }

  confirmAction(
    product: AdminProduct,
    action: ProductAction
  ): void {
    if (this.busyId()) {
      return;
    }

    const allowed =
      action === 'publish'
        ? this.canPublish(product)
        : action === 'unpublish'
          ? this.canUnpublish(product)
          : this.canDelete(product);

    if (!allowed) {
      return;
    }

    this.confirmation.confirm({
      header: this.translate.instant(
        `adminProducts.actions.${action}`
      ),

      message: this.translate.instant(
        `adminProducts.confirm.${action}`,
        { name: product.name }
      ),

      icon: 'pi pi-exclamation-triangle',

      acceptLabel: this.translate.instant(
        `adminProducts.actions.${action}`
      ),

      rejectLabel: this.translate.instant(
        'adminCategories.cancel'
      ),

      acceptButtonStyleClass:
        action === 'delete'
          ? 'p-button-danger'
          : '',

      rejectButtonStyleClass: 'p-button-text',

      accept: () => this.executeAction(product.id, action)
    });
  }

  private setupPriceRange(): void {
    this.priceRangeControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(range => {
      if (
        range.length !== 2 ||
        !range.every(value => Number.isFinite(value))
      ) {
        return;
      }

      const [minimum, maximum] = range;

      this.filters.patchValue({
        minPrice: minimum === 0 ? null : minimum,

        maxPrice:
          maximum === this.priceCeiling()
            ? null
            : maximum
      }, {
        emitEvent: false
      });
    });

    merge(
      this.filters.controls.minPrice.valueChanges,
      this.filters.controls.maxPrice.valueChanges
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.syncPriceRange();
    });
  }

  private syncPriceRange(): void {
    const minimum =
      this.filters.controls.minPrice.value ?? 0;

    const explicitMaximum =
      this.filters.controls.maxPrice.value;

    const ceiling = Math.max(
      this.discoveredMaxPrice(),
      minimum,
      explicitMaximum ?? 0,
      1
    );

    this.priceCeiling.set(ceiling);

    const maximum = explicitMaximum ?? ceiling;

    const lower = Math.max(
      0,
      Math.min(minimum, ceiling)
    );

    const upper = Math.max(
      lower,
      Math.min(maximum, ceiling)
    );

    this.priceRangeControl.setValue(
      [lower, upper],
      { emitEvent: false }
    );
  }

  private executeAction(
    id: string,
    action: ProductAction
  ): void {
    if (this.busyId()) {
      return;
    }

    this.busyId.set(id);

    const requests: Record<
      ProductAction,
      () => Observable<unknown>
    > = {
      publish: () => this.api.publish(id),
      unpublish: () => this.api.unpublish(id),
      delete: () => this.api.delete(id)
    };

    requests[action]().pipe(
      takeUntilDestroyed(this.destroyRef),

      finalize(() => {
        this.busyId.set(null);
      })
    ).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant(
            'adminCategories.success'
          ),
          detail: this.translate.instant(
            `adminProducts.done.${action}`
          ),
          life: 3500
        });

        if (this.detail()?.id === id) {
          this.closeDetail();
        }

        const query = this.query();
        const page = this.vm().data;

        const nextStatus: ProductStatus =
          action === 'publish'
            ? 'PUBLISHED'
            : action === 'unpublish'
              ? 'UNPUBLISHED'
              : 'DELETED';

        const leavesCurrentList =
          action === 'delete' ||
          (
            query.statuses.length > 0 &&
            !query.statuses.includes(nextStatus)
          );

        if (
          leavesCurrentList &&
          query.page > 0 &&
          page?.content.length === 1
        ) {
          this.query.update(current => ({
            ...current,
            page: current.page - 1
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

  createProduct(): void {
  void this.router.navigate([
    '/admin/products/new'
  ]);
}

editProduct(product: AdminProduct): void {
  if (
    this.query().deletion !== 'ACTIVE' ||
    product.status === 'DELETED'
  ) {
    return;
  }

  void this.router.navigate([
    '/admin/products',
    product.id,
    'edit'
  ]);
}


manageMedia(product: AdminProduct): void {
  if (
    this.query().deletion !== 'ACTIVE' ||
    product.status === 'DELETED'
  ) {
    return;
  }

  void this.router.navigate([
    '/admin/products',
    product.id,
    'media'
  ]);
}

}