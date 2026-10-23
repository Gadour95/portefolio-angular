import {
  Component,
  DestroyRef,
  ViewChild,
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

import {
  ConfirmationService,
  MessageService
} from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import {
  FileRemoveEvent,
  FileSelectEvent,
  FileUpload,
  FileUploadModule
} from 'primeng/fileupload';

import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import {
  Observable,
  catchError,
  defer,
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
  ProductMediaViewerComponent
} from '../../components/product-media-viewer.component';

import {
  AdminProduct,
  ProductMedia
} from '../../models/product.model';

import {
  AdminProductService
} from '../../services/admin-product.service';

import {
  AdminProductMediaService
} from '../../services/admin-product-media.service';

registerLocaleData(localeFr);
registerLocaleData(localeAr);

@Component({
  selector: 'app-product-media',
  standalone: true,

  imports: [
    DecimalPipe,
    TranslatePipe,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    FileUploadModule,
    MessageModule,
    TableModule,
    TagModule,
    TooltipModule,
    ProductMediaViewerComponent
  ],

  providers: [ConfirmationService],

  templateUrl: './product-media.component.html'
})
export class ProductMediaComponent {
  private readonly api = inject(AdminProductService);
  private readonly mediaApi = inject(AdminProductMediaService);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  private readonly messages = inject(MessageService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('imagesUpload')
  private imagesUpload?: FileUpload;

  @ViewChild('videoUpload')
  private videoUpload?: FileUpload;

  readonly productId =
    this.route.snapshot.paramMap.get('id');

  readonly maxFileBytes = 10 * 1024 * 1024;

  readonly loading = signal(false);
  readonly busy = signal(false);

  readonly loadError = signal<string | null>(null);
  readonly operationError = signal<string | null>(null);

  readonly product = signal<AdminProduct | null>(null);

  readonly images = signal<ProductMedia[]>([]);
  readonly savedImages = signal<ProductMedia[]>([]);
  readonly video = signal<ProductMedia | null>(null);

  readonly selectedImages = signal<File[]>([]);
  readonly selectedVideo = signal<File | null>(null);
  readonly videoPreviewUrl = signal<string | null>(null);

  readonly locale = computed(() =>
    this.language.current() === 'en'
      ? 'en-US'
      : this.language.current()
  );

  readonly orderDirty = computed(() => {
    const current = this.images().map(image => image.id);
    const saved = this.savedImages().map(image => image.id);

    return (
      current.length !== saved.length ||
      current.some((id, index) => id !== saved[index])
    );
  });

  readonly canWrite = computed(() =>
    !!this.product() &&
    this.product()?.status !== 'DELETED' &&
    !this.loading() &&
    !this.busy() &&
    !this.loadError()
  );

  readonly previewProduct = computed<AdminProduct | null>(() => {
    const product = this.product();

    if (!product) {
      return null;
    }

    return {
      ...product,
      images: this.savedImages(),
      video: this.video()
    };
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.releaseVideoPreview();
    });

    this.load();
  }

  load(): void {
    const id = this.productId;

    if (!id) {
      this.loadError.set(
        this.translate.instant('adminCategories.genericError')
      );
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      product: this.api.findById(id),
      images: this.mediaApi.findImages(id),

      video: this.mediaApi.findVideo(id).pipe(
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
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: data => {
        const sorted = [...data.images].sort(
          (a, b) => a.position - b.position
        );

        this.product.set(data.product);
        this.images.set(sorted);
        this.savedImages.set([...sorted]);
        this.video.set(data.video);
      },

      error: (error: unknown) => {
        this.loadError.set(this.errorMessage(error));
      }
    });
  }

  refresh(): void {
    if (
      this.loading() ||
      this.busy() ||
      this.orderDirty()
    ) {
      return;
    }

    this.load();
  }

  moveImage(index: number, direction: -1 | 1): void {
    if (!this.canWrite()) {
      return;
    }

    const target = index + direction;
    const images = [...this.images()];

    if (target < 0 || target >= images.length) {
      return;
    }

    [images[index], images[target]] = [
      images[target],
      images[index]
    ];

    this.images.set(images);
  }

  discardOrder(): void {
    if (this.loading() || this.busy()) {
      return;
    }

    this.images.set([...this.savedImages()]);
  }

  saveOrder(): void {
    const id = this.productId;

    if (
      !id ||
      !this.canWrite() ||
      !this.orderDirty()
    ) {
      return;
    }

    const imageIds = this.images().map(image => image.id);

    this.run(
      () => this.mediaApi.reorderImages(id, imageIds),
      'mediaManager.orderSaved',
      undefined,
      true
    );
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

  imageSelectionError(): string | null {
    const files = this.selectedImages();

    if (
      this.savedImages().length + files.length > 5
    ) {
      return this.translate.instant(
        'productEditor.imageLimit'
      );
    }

    if (
      files.some(file => file.size > this.maxFileBytes)
    ) {
      return this.translate.instant(
        'productEditor.fileTooLarge'
      );
    }

    if (
      files.some(file => !file.type.startsWith('image/'))
    ) {
      return this.translate.instant(
        'productEditor.invalidImage'
      );
    }

    return null;
  }

  uploadImages(): void {
    const id = this.productId;
    const files = [...this.selectedImages()];

    if (
      !id ||
      !this.canWrite() ||
      this.orderDirty() ||
      files.length === 0
    ) {
      return;
    }

    const error = this.imageSelectionError();

    if (error) {
      this.operationError.set(error);
      return;
    }

    this.run(
      () => this.mediaApi.addImages(id, files),
      'mediaManager.imagesAdded',

      () => {
        this.imagesUpload?.clear();
        this.selectedImages.set([]);
      }
    );
  }

  canDeleteImage(): boolean {
    if (
      !this.canWrite() ||
      this.orderDirty()
    ) {
      return false;
    }

    // Protection UI : conserver une image sur un produit publié.
    return !(
      this.product()?.status === 'PUBLISHED' &&
      this.savedImages().length <= 1
    );
  }

  confirmDeleteImage(image: ProductMedia): void {
    if (!this.canDeleteImage()) {
      return;
    }

    this.confirmation.confirm({
      header: this.translate.instant(
        'mediaManager.deleteImage'
      ),

      message: this.translate.instant(
        'mediaManager.deleteImageQuestion',
        { name: image.originalFilename }
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

      accept: () => {
        const id = this.productId;

        if (!id || !this.canDeleteImage()) {
          return;
        }

        this.run(
          () => this.mediaApi.deleteMedia(id, image.id),
          'mediaManager.imageDeleted'
        );
      }
    });
  }

  onVideoSelected(event: FileSelectEvent): void {
    this.setSelectedVideo(event.currentFiles[0] ?? null);
  }

  clearVideo(): void {
    this.setSelectedVideo(null);
  }

  videoSelectionError(): string | null {
    const file = this.selectedVideo();

    if (!file) {
      return null;
    }

    if (file.size > this.maxFileBytes) {
      return this.translate.instant(
        'productEditor.fileTooLarge'
      );
    }

    if (!file.type.startsWith('video/')) {
      return this.translate.instant(
        'productEditor.invalidVideo'
      );
    }

    return null;
  }

  uploadVideo(): void {
    const id = this.productId;
    const file = this.selectedVideo();

    if (
      !id ||
      !file ||
      !this.canWrite() ||
      this.orderDirty()
    ) {
      return;
    }

    const error = this.videoSelectionError();

    if (error) {
      this.operationError.set(error);
      return;
    }

    if (this.video()) {
      this.confirmation.confirm({
        header: this.translate.instant(
          'mediaManager.replaceVideo'
        ),

        message: this.translate.instant(
          'mediaManager.replaceVideoQuestion'
        ),

        icon: 'pi pi-exclamation-triangle',

        acceptLabel: this.translate.instant(
          'mediaManager.replaceVideo'
        ),

        rejectLabel: this.translate.instant(
          'adminCategories.cancel'
        ),

        rejectButtonStyleClass: 'p-button-text',

        accept: () => {
          this.sendVideo(id, file, true);
        }
      });

      return;
    }

    this.sendVideo(id, file, false);
  }

  confirmDeleteVideo(): void {
    const video = this.video();

    if (
      !video ||
      !this.canWrite() ||
      this.orderDirty()
    ) {
      return;
    }

    this.confirmation.confirm({
      header: this.translate.instant(
        'mediaManager.deleteVideo'
      ),

      message: this.translate.instant(
        'mediaManager.deleteVideoQuestion'
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

      accept: () => {
        const id = this.productId;

        if (!id) {
          return;
        }

        this.run(
          () => this.mediaApi.deleteMedia(id, video.id),
          'mediaManager.videoDeleted'
        );
      }
    });
  }

  back(): void {
    if (!this.busy()) {
      void this.router.navigate(['/admin/products']);
    }
  }

  private sendVideo(
    id: string,
    file: File,
    replace: boolean
  ): void {
    this.run(
      () =>
        replace
          ? this.mediaApi.replaceVideo(id, file)
          : this.mediaApi.addVideo(id, file),

      replace
        ? 'mediaManager.videoReplaced'
        : 'mediaManager.videoAdded',

      () => {
        this.videoUpload?.clear();
        this.setSelectedVideo(null);
      }
    );
  }

  private run(
    request: () => Observable<unknown>,
    successKey: string,
    afterSuccess?: () => void,
    allowDirtyOrder = false
  ): void {
    if (
      !this.canWrite() ||
      (this.orderDirty() && !allowDirtyOrder)
    ) {
      return;
    }

    this.busy.set(true);
    this.operationError.set(null);

    defer(request).pipe(
      takeUntilDestroyed(this.destroyRef),

      finalize(() => {
        this.busy.set(false);
      })
    ).subscribe({
      next: () => {
        afterSuccess?.();

        this.messages.add({
          severity: 'success',
          summary: this.translate.instant(
            'adminCategories.success'
          ),
          detail: this.translate.instant(successKey),
          life: 3500
        });

        this.load();
      },

      error: (error: unknown) => {
        this.operationError.set(
          this.errorMessage(error)
        );
      }
    });
  }

  private setSelectedVideo(file: File | null): void {
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