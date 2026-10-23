import {
  Component,
  computed,
  input
} from '@angular/core';

import {
  TranslatePipe
} from '@ngx-translate/core';

import { GalleriaModule } from 'primeng/galleria';
import { ImageModule } from 'primeng/image';
import { MessageModule } from 'primeng/message';

import {
  environment
} from '../../../../../environments/environment';

import {
  AdminProduct
} from '../models/product.model';

interface DisplayImage {
  id: string;
  src: string;
  filename: string;
}

@Component({
  selector: 'app-product-media-viewer',
  standalone: true,

  imports: [
    TranslatePipe,
    GalleriaModule,
    ImageModule,
    MessageModule
  ],

  template: `
    @if (product().status !== 'PUBLISHED') {
      <p-message severity="info" styleClass="w-full">
        {{ 'productMedia.privateNotice' | translate }}
      </p-message>
    } @else {
      <div class="space-y-6">
        @if (images().length > 0) {
          <section>
            <h3 class="mb-3 font-semibold">
              {{ 'productMedia.images' | translate }}
            </h3>

            <p-galleria
              [value]="images()"
              [numVisible]="4"
              [responsiveOptions]="responsiveOptions"
              [showThumbnails]="images().length > 1"
              [showItemNavigators]="images().length > 1"
              [circular]="images().length > 1"
              [containerStyle]="{
                width: '100%',
                borderRadius: '1rem',
                overflow: 'hidden'
              }"
            >
              <ng-template #item let-image>
                <div
                  class="flex min-h-64 w-full items-center
                         justify-center
                         bg-[var(--app-surface-muted)] p-4"
                >
                  <p-image
                    [src]="image.src"
                    [alt]="product().name"
                    [preview]="true"
                    imageClass="max-h-80 max-w-full object-contain"
                  />
                </div>
              </ng-template>

              <ng-template #thumbnail let-image>
                <img
                  [src]="image.src"
                  [alt]="image.filename || product().name"
                  class="h-16 w-20 rounded-lg object-cover"
                />
              </ng-template>
            </p-galleria>
          </section>
        }

        @if (videoUrl(); as url) {
          <section>
            <h3 class="mb-3 font-semibold">
              {{ 'productMedia.video' | translate }}
            </h3>

            <video
              controls
              playsinline
              preload="metadata"
              class="max-h-96 w-full rounded-2xl bg-black"
              [src]="url"
            >
              {{ 'productMedia.videoUnsupported' | translate }}
            </video>
          </section>
        }

        @if (
          images().length === 0 &&
          !videoUrl()
        ) {
          <p-message
            severity="secondary"
            styleClass="w-full"
          >
            {{ 'productMedia.empty' | translate }}
          </p-message>
        }
      </div>
    }
  `
})
export class ProductMediaViewerComponent {
  readonly product = input.required<AdminProduct>();

  readonly responsiveOptions = [
    {
      breakpoint: '768px',
      numVisible: 3
    },
    {
      breakpoint: '480px',
      numVisible: 2
    }
  ];

  readonly images = computed<DisplayImage[]>(() =>
    [...(this.product().images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(image => ({
        id: image.id,
        src: this.mediaUrl(image.url),
        filename: image.originalFilename
      }))
      .filter(
        (image): image is DisplayImage =>
          image.src !== null
      )
  );

  readonly videoUrl = computed(() => {
    const video = this.product().video;

    return video
      ? this.mediaUrl(video.url)
      : null;
  });

  private mediaUrl(path: string): string | null {
    if (!path || path.startsWith('//')) {
      return null;
    }

    try {
      const base = new URL(
        `${environment.apiUrl.replace(/\/+$/, '')}/`,
        window.location.origin
      );

      const target = /^[a-z][a-z\d+.-]*:/i.test(path)
        ? new URL(path)
        : new URL(path.replace(/^\/+/, ''), base);

      const allowedPath =
        `${base.pathname.replace(/\/+$/, '')}/media/products/`;

      if (
        target.origin !== base.origin ||
        !target.pathname.startsWith(allowedPath)
      ) {
        return null;
      }

      return target.href;
    } catch {
      return null;
    }
  }
}