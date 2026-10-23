import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';

import {
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
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import { MessageService } from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';

import {
  FileRemoveEvent,
  FileSelectEvent,
  FileUploadModule
} from 'primeng/fileupload';

import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';

import {
  Observable,
  Subscription,
  catchError,
  finalize,
  forkJoin,
  of,
  throwError
} from 'rxjs';

import {
  ApiError
} from '../../../../../core/models/api-error.model';

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
  ProductMedia,
  ProductPayload,
  ProductUpdatePayload
} from '../../models/product.model';

import {
  AdminProductService
} from '../../services/admin-product.service';

import {
  ProductFilterOptionsService
} from '../../services/product-filter-options.service';

registerLocaleData(localeFr);
registerLocaleData(localeAr);

function positiveAmount(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;

  if (value === null || value === '') {
    return null;
  }

  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  )
    ? null
    : { positiveAmount: true };
}

function integerQuantity(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value;

  if (value === null || value === '') {
    return null;
  }

  return Number.isInteger(value) && value >= 0
    ? null
    : { integerQuantity: true };
}

function priceOrderValidator(
  control: AbstractControl
): ValidationErrors | null {
  const purchase = control.get('purchasePrice')?.value;
  const selling = control.get('sellingPrice')?.value;
  const original = control.get('originalPrice')?.value;

  if (
    typeof purchase !== 'number' ||
    typeof selling !== 'number' ||
    typeof original !== 'number'
  ) {
    return null;
  }

  return purchase <= selling && selling <= original
    ? null
    : { priceOrder: true };
}

@Component({
  selector: 'app-product-editor',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    CheckboxModule,
    FileUploadModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    SelectModule,
    TagModule,
    TextareaModule,
    ProductMediaViewerComponent
  ],

  templateUrl: './product-editor.component.html'
})
export class ProductEditorComponent {
  private readonly api = inject(AdminProductService);
  private readonly categoryLookup = inject(CategoryLookupService);
  private readonly subCategoryLookup =
    inject(SubCategoryLookupService);
  private readonly filterOptionsApi =
    inject(ProductFilterOptionsService);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  private subCategoryRequest?: Subscription;

  readonly productId = this.route.snapshot.paramMap.get('id');
  readonly isEdit = this.productId !== null;

  readonly maxFileBytes = 10 * 1024 * 1024;

  // Marge pour le JSON et les en-têtes multipart.
  private readonly maxSelectedBytes =
    60 * 1024 * 1024 - 64 * 1024;

  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly serverFieldErrors =
    signal<Record<string, string>>({});

  readonly categories = signal<Category[]>([]);
  readonly subCategories = signal<SubCategory[]>([]);
  readonly subCategoriesLoading = signal(false);
  readonly subCategoriesError = signal<string | null>(null);

  readonly brands = signal<string[]>([]);
  readonly brandsUnavailable = signal(false);
  readonly relationNotice = signal(false);

  readonly existingProduct = signal<AdminProduct | null>(null);
  readonly existingImages = signal<ProductMedia[]>([]);
  readonly existingVideo = signal<ProductMedia | null>(null);

  readonly selectedImages = signal<File[]>([]);
  readonly selectedVideo = signal<File | null>(null);
  readonly videoPreviewUrl = signal<string | null>(null);

  readonly priceFields = [
    {
      key: 'purchasePrice',
      label: 'adminProducts.purchasePrice'
    },
    {
      key: 'sellingPrice',
      label: 'adminProducts.sellingPrice'
    },
    {
      key: 'originalPrice',
      label: 'adminProducts.originalPrice'
    }
  ] as const;

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/)
      ]
    }),

    sku: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/)
      ]
    }),

    brand: new FormControl<string | null>(null),

    shortDescription: new FormControl('', {
      nonNullable: true
    }),

    description: new FormControl('', {
      nonNullable: true
    }),

    purchasePrice: new FormControl<number | null>(
      null,
      [Validators.required, positiveAmount]
    ),

    sellingPrice: new FormControl<number | null>(
      null,
      [Validators.required, positiveAmount]
    ),

    originalPrice: new FormControl<number | null>(
      null,
      [Validators.required, positiveAmount]
    ),

    stockQuantity: new FormControl<number | null>(
      0,
      [Validators.required, integerQuantity]
    ),

    categoryId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    subCategoryId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    replaceImages: new FormControl(false, {
      nonNullable: true
    }),

    replaceVideo: new FormControl(false, {
      nonNullable: true
    })
  }, {
    validators: [priceOrderValidator]
  });

  readonly locale = computed(() =>
    this.language.current() === 'en'
      ? 'en-US'
      : this.language.current()
  );

  readonly brandOptions = computed(() => {
    const values = new Set(this.brands());

    const current = this.existingProduct()?.brand;

    if (current) {
      values.add(current);
    }

    return [...values]
      .sort((a, b) => a.localeCompare(b))
      .map(value => ({
        label: value,
        value
      }));
  });

  constructor() {
    this.form.controls.categoryId.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(categoryId => {
      this.form.controls.subCategoryId.setValue('');
      this.relationNotice.set(false);

      this.loadSubCategories(categoryId);
    });

    this.destroyRef.onDestroy(() => {
      this.releaseVideoPreview();
    });

    this.load();
  }

  load(): void {
    if (this.saving()) {
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);
    this.brandsUnavailable.set(false);

    const id = this.productId;

    const product$: Observable<AdminProduct | null> =
      id ? this.api.findById(id) : of(null);

    const images$: Observable<ProductMedia[]> =
      id ? this.api.findImages(id) : of([]);

    const video$: Observable<ProductMedia | null> =
      id
        ? this.api.findVideo(id).pipe(
            catchError((error: unknown) => {
              if (
                error instanceof HttpErrorResponse &&
                error.status === 404
              ) {
                return of(null);
              }

              return throwError(() => error);
            })
          )
        : of(null);

    forkJoin({
      categories: this.categoryLookup.findAll('ACTIVE'),
      product: product$,
      images: images$,
      video: video$,

      options: this.filterOptionsApi.load().pipe(
        catchError(() => {
          this.brandsUnavailable.set(true);
          return of(null);
        })
      )
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: data => {
        this.categories.set(data.categories);
        this.brands.set(data.options?.brands ?? []);

        this.existingImages.set(data.images);
        this.existingVideo.set(data.video);

        if (!data.product) {
          return;
        }

        const product = data.product;

        if (product.status === 'DELETED') {
          this.loadError.set(
            this.translate.instant('productEditor.deletedProduct')
          );
          return;
        }

        if (
          typeof product.purchasePrice !== 'number' ||
          !Number.isFinite(product.purchasePrice)
        ) {
          this.loadError.set(
            this.translate.instant('productEditor.missingPurchasePrice')
          );
          return;
        }

        this.existingProduct.set({
          ...product,
          images: data.images,
          video: data.video
        });

        const parentAvailable = data.categories.some(
          category => category.id === product.categoryId
        );

        this.form.patchValue({
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          shortDescription: product.shortDescription ?? '',
          description: product.description ?? '',
          purchasePrice: product.purchasePrice,
          sellingPrice: product.sellingPrice,
          originalPrice: product.originalPrice,
          stockQuantity: product.stockQuantity,
          categoryId: parentAvailable ? product.categoryId : '',
          subCategoryId: '',
          replaceImages: false,
          replaceVideo: false
        }, {
          emitEvent: false
        });

        if (parentAvailable) {
          this.loadSubCategories(
            product.categoryId,
            product.subCategoryId
          );
        } else {
          this.relationNotice.set(true);
        }
      },

      error: (error: unknown) => {
        this.loadError.set(this.errorMessage(error));
      }
    });
  }

  loadSubCategories(
    categoryId: string,
    selectedId = ''
  ): void {
    this.subCategoryRequest?.unsubscribe();

    this.subCategories.set([]);
    this.subCategoriesError.set(null);
    this.subCategoriesLoading.set(false);

    if (!categoryId) {
      return;
    }

    this.subCategoriesLoading.set(true);

    this.subCategoryRequest = this.subCategoryLookup
      .findActiveByCategory(categoryId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),

        finalize(() => {
          this.subCategoriesLoading.set(false);
        })
      )
      .subscribe({
        next: items => {
          this.subCategories.set(items);

          if (selectedId) {
            const available = items.some(
              item => item.id === selectedId
            );

            this.form.controls.subCategoryId.setValue(
              available ? selectedId : '',
              { emitEvent: false }
            );

            if (!available) {
              this.relationNotice.set(true);
            }
          }
        },

        error: (error: unknown) => {
          this.subCategoriesError.set(
            this.errorMessage(error)
          );
        }
      });
  }

  onImagesSelected(event: FileSelectEvent): void {
    this.selectedImages.set([...event.currentFiles]);
  }

  onImageRemoved(event: FileRemoveEvent): void {
    this.selectedImages.update(files =>
      files.filter(file => file !== event.file)
    );
  }

  clearImages(): void {
    this.selectedImages.set([]);
  }

  onVideoSelected(event: FileSelectEvent): void {
    this.setVideo(event.currentFiles[0] ?? null);
  }

  clearVideo(): void {
    this.setVideo(null);
  }

  mediaError(): string | null {
    const images = this.selectedImages();
    const video = this.selectedVideo();

    const replaceImages =
      this.form.controls.replaceImages.value;

    const replaceVideo =
      this.form.controls.replaceVideo.value;

    if (
      this.isEdit &&
      replaceImages &&
      images.length === 0
    ) {
      return this.translate.instant(
        'productEditor.replaceImagesNeedsFiles'
      );
    }

    const resultingImageCount =
      this.isEdit && !replaceImages
        ? this.existingImages().length + images.length
        : images.length;

    if (resultingImageCount > 5) {
      return this.translate.instant(
        'productEditor.imageLimit'
      );
    }

    if (
      this.isEdit &&
      replaceVideo &&
      !video
    ) {
      return this.translate.instant(
        'productEditor.replaceVideoNeedsFile'
      );
    }

    if (
      this.isEdit &&
      this.existingVideo() &&
      video &&
      !replaceVideo
    ) {
      return this.translate.instant(
        'productEditor.videoAlreadyExists'
      );
    }

    const files = [
      ...images,
      ...(video ? [video] : [])
    ];

    if (files.some(file => file.size > this.maxFileBytes)) {
      return this.translate.instant(
        'productEditor.fileTooLarge'
      );
    }

    if (images.some(file => !file.type.startsWith('image/'))) {
      return this.translate.instant(
        'productEditor.invalidImage'
      );
    }

    if (video && !video.type.startsWith('video/')) {
      return this.translate.instant(
        'productEditor.invalidVideo'
      );
    }

    const total = files.reduce(
      (sum, file) => sum + file.size,
      0
    );

    if (total > this.maxSelectedBytes) {
      return this.translate.instant(
        'productEditor.totalTooLarge'
      );
    }

    return null;
  }

  fieldError(field: string): string | null {
    const control = this.form.get(field);

    if (!control?.touched) {
      return null;
    }

    const serverError = this.serverFieldErrors()[field];

    if (serverError) {
      return serverError;
    }

    if (!control.errors) {
      return null;
    }

    if (
      control.hasError('required') ||
      control.hasError('pattern')
    ) {
      return this.translate.instant(
        'productEditor.required'
      );
    }

    if (control.hasError('positiveAmount')) {
      return this.translate.instant(
        'productEditor.positiveAmount'
      );
    }

    if (control.hasError('integerQuantity')) {
      return this.translate.instant(
        'productEditor.integerStock'
      );
    }

    return this.translate.instant(
      'productEditor.invalidValue'
    );
  }

  save(): void {
    if (
      this.loading() ||
      this.saving() ||
      this.loadError() ||
      this.subCategoriesLoading()
    ) {
      return;
    }

    this.form.markAllAsTouched();
    this.saveError.set(null);
    this.serverFieldErrors.set({});

    if (this.form.invalid) {
      return;
    }

    const mediaError = this.mediaError();

    if (mediaError) {
      this.saveError.set(mediaError);
      return;
    }

    const values = this.form.getRawValue();

    const validParent = this.categories().some(
      category => category.id === values.categoryId
    );

    const validChild = this.subCategories().some(
      subCategory =>
        subCategory.id === values.subCategoryId &&
        subCategory.categoryId === values.categoryId
    );

    if (!validParent || !validChild) {
      this.saveError.set(
        this.translate.instant('productEditor.invalidRelation')
      );
      return;
    }

    const purchasePrice = values.purchasePrice;
    const originalPrice = values.originalPrice;
    const sellingPrice = values.sellingPrice;
    const stockQuantity = values.stockQuantity;

    if (
      purchasePrice === null ||
      originalPrice === null ||
      sellingPrice === null ||
      stockQuantity === null
    ) {
      return;
    }

    const payload: ProductPayload = {
      name: values.name.trim(),
      sku: values.sku.trim(),
      brand: (values.brand ?? '').trim(),
      shortDescription: values.shortDescription.trim(),
      description: values.description.trim(),
      purchasePrice,
      originalPrice,
      sellingPrice,
      stockQuantity,
      categoryId: values.categoryId,
      subCategoryId: values.subCategoryId
    };

    let request$: Observable<unknown>;

    if (this.productId) {
      const update: ProductUpdatePayload = {
        ...payload,
        replaceImages: values.replaceImages,
        replaceVideo: values.replaceVideo
      };

      request$ = this.api.updateWithMedia(
        this.productId,
        update,
        this.selectedImages(),
        this.selectedVideo()
      );
    } else {
      request$ = this.api.createWithMedia(
        payload,
        this.selectedImages(),
        this.selectedVideo()
      );
    }

    this.saving.set(true);
    this.form.disable({ emitEvent: false });

    request$.pipe(
      takeUntilDestroyed(this.destroyRef),

      finalize(() => {
        this.saving.set(false);
        this.form.enable({ emitEvent: false });
      })
    ).subscribe({
      next: () => {
        this.messages.add({
          severity: 'success',
          summary: this.translate.instant(
            'adminCategories.success'
          ),
          detail: this.translate.instant(
            this.isEdit
              ? 'productEditor.updated'
              : 'productEditor.created'
          ),
          life: 4000
        });

        void this.router.navigate(['/admin/products']);
      },

      error: (error: unknown) => {
        this.saveError.set(this.errorMessage(error));

        if (error instanceof HttpErrorResponse) {
          const body = error.error as ApiError | null;
          const fields: Record<string, string> = {};

          if (Array.isArray(body?.fieldErrors)) {
            for (const item of body.fieldErrors) {
              fields[item.field] = item.error;
            }
          }

          this.serverFieldErrors.set(fields);
        }
      }
    });
  }

  back(): void {
    if (!this.saving()) {
      void this.router.navigate(['/admin/products']);
    }
  }

  private setVideo(file: File | null): void {
    this.releaseVideoPreview();
    this.selectedVideo.set(file);

    if (file) {
      this.videoPreviewUrl.set(
        URL.createObjectURL(file)
      );
    }
  }

  private releaseVideoPreview(): void {
    const url = this.videoPreviewUrl();

    if (url) {
      URL.revokeObjectURL(url);
      this.videoPreviewUrl.set(null);
    }
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

      if (error.status === 413) {
        return this.translate.instant(
          'productEditor.totalTooLarge'
        );
      }
    }

    return this.translate.instant(
      'adminCategories.genericError'
    );
  }
}