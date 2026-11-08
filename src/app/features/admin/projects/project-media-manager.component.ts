import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import {
  MessageService
} from 'primeng/api';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { finalize } from 'rxjs';

import {
  MediaService
} from '../../../core/services/media.service';

import {
  resolveMediaUrl
} from '../../../core/http/media-url';

type VideoMode = 'none' | 'upload' | 'youtube';

@Component({
  selector: 'app-project-media-manager',
  standalone: true,

  imports: [
    CommonModule,
    TranslatePipe,
    ButtonModule,
    CardModule,
    InputTextModule,
    TooltipModule
  ],

  template: `
    <div class="space-y-6">
      <!-- ======================= IMAGES ======================= -->
      <p-card styleClass="rounded-2xl">
        <div class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-bold">
                {{ 'adminProjects.images' | translate }}
              </h2>

              <p class="text-xs app-muted mt-0.5">
                {{ 'adminProjects.imagesHelp' | translate }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <input
                #imagesInput
                type="file"
                multiple
                class="hidden"
                accept="image/*"
                (change)="onImagesSelected($event)"
              />

              <p-button
                type="button"
                icon="pi pi-plus"
                size="small"
                [label]="
                  uploadingImages()
                    ? ('adminProjects.imagesUploading' | translate)
                    : ('adminProjects.uploadImages' | translate)
                "
                [loading]="uploadingImages()"
                (onClick)="imagesInput.click()"
              />

              @if (images().length > 1) {
                <p-button
                  type="button"
                  icon="pi pi-trash"
                  severity="danger"
                  [text]="true"
                  size="small"
                  [label]="
                    'adminProjects.removeAllImages' | translate
                  "
                  (onClick)="removeAllImages()"
                />
              }
            </div>
          </div>

          @if (images().length > 0) {
            <div
              class="grid grid-cols-1 gap-4 sm:grid-cols-2
                     md:grid-cols-3 xl:grid-cols-4"
            >
              @for (
                image of images();
                track image;
                let index = $index
              ) {
                <div
                  class="group relative overflow-hidden rounded-2xl
                         border border-[var(--app-border)]
                         bg-[var(--app-surface-muted)]"
                  [class.opacity-50]="dragIndex() === index"
                  draggable="true"
                  (dragstart)="onDragStart($event, index)"
                  (dragenter)="onDragEnter($event, index)"
                  (dragover)="$event.preventDefault()"
                  (dragend)="onDragEnd()"
                  (drop)="onDrop($event, index)"
                >
                  <img
                    [src]="resolveImage(image)"
                    [alt]="'Image ' + (index + 1)"
                    class="h-40 w-full cursor-grab object-cover"
                    draggable="false"
                  />

                  @if (index === 0) {
                    <span
                      class="absolute top-2 left-2 rounded-full
                             bg-[var(--p-primary-color)] px-2 py-0.5
                             text-[0.65rem] font-bold uppercase
                             tracking-wide
                             text-[var(--p-primary-inverse-color)]
                             shadow-md"
                    >
                      {{ 'adminProjects.coverBadge' | translate }}
                    </span>
                  }

                  <span
                    class="absolute top-2 right-2 rounded-full
                           bg-black/70 px-2 py-0.5 text-[0.65rem]
                           font-bold text-white"
                  >
                    {{ index + 1 }}
                  </span>

                  <div
                    class="absolute inset-x-0 bottom-0 flex
                           items-center justify-center gap-1
                           bg-black/70 p-2 opacity-0 transition
                           group-hover:opacity-100"
                  >
                    <p-button
                      type="button"
                      icon="pi pi-arrow-left"
                      severity="secondary"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      [disabled]="index === 0"
                      [pTooltip]="
                        'adminProjects.moveLeft' | translate
                      "
                      (onClick)="moveImage(index, index - 1)"
                    />

                    <p-button
                      type="button"
                      icon="pi pi-arrow-right"
                      severity="secondary"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      [disabled]="index === images().length - 1"
                      [pTooltip]="
                        'adminProjects.moveRight' | translate
                      "
                      (onClick)="moveImage(index, index + 1)"
                    />

                    @if (index !== 0) {
                      <p-button
                        type="button"
                        icon="pi pi-star"
                        severity="secondary"
                        [text]="true"
                        [rounded]="true"
                        size="small"
                        [pTooltip]="
                          'adminProjects.setAsCover' | translate
                        "
                        (onClick)="setAsCover(index)"
                      />
                    }

                    <p-button
                      type="button"
                      icon="pi pi-trash"
                      severity="danger"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      [pTooltip]="
                        'adminProjects.removeImage' | translate
                      "
                      (onClick)="removeImage(index)"
                    />
                  </div>
                </div>
              }
            </div>

            <p class="text-xs app-muted">
              {{ 'adminProjects.imagesOrderHelp' | translate }}
            </p>
          } @else {
            <div
              class="flex flex-col items-center justify-center
                     rounded-2xl border border-dashed
                     border-[var(--app-border)] p-8 text-center"
            >
              <i class="pi pi-images text-3xl app-muted mb-2"></i>

              <p class="text-sm font-semibold">
                {{ 'adminProjects.noImages' | translate }}
              </p>

              <p class="text-xs app-muted mt-1 mb-3">
                {{ 'adminProjects.imagesHelp' | translate }}
              </p>

              <p-button
                type="button"
                icon="pi pi-upload"
                severity="secondary"
                [outlined]="true"
                size="small"
                [label]="
                  'adminProjects.uploadImages' | translate
                "
                (onClick)="imagesInput.click()"
              />
            </div>
          }
        </div>
      </p-card>

      <!-- ======================= VIDÉO ======================= -->
      <p-card styleClass="rounded-2xl">
        <div class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-base font-bold">
                {{ 'adminProjects.video' | translate }}
              </h2>

              <p class="text-xs app-muted mt-0.5">
                {{ 'adminProjects.videoHelp' | translate }}
              </p>
            </div>

            @if (video()) {
              <p-button
                type="button"
                icon="pi pi-trash"
                severity="danger"
                [text]="true"
                [label]="'adminProjects.removeVideo' | translate"
                [disabled]="uploadingVideo()"
                (onClick)="removeVideo()"
              />
            }
          </div>

          <!-- Choix exclusif -->
          <div class="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="flex items-start gap-3 rounded-xl border p-4
                     text-start transition"
              [class.border-[var(--p-primary-color)]]="
                videoMode() === 'upload'
              "
              [class.bg-[var(--p-primary-color)]/5]="
                videoMode() === 'upload'
              "
              [disabled]="uploadingVideo()"
              (click)="selectMode('upload')"
            >
              <i class="pi pi-cloud-upload text-xl mt-0.5"></i>

              <span>
                <span class="block text-sm font-semibold">
                  {{ 'adminProjects.videoModeUpload' | translate }}
                </span>

                <span class="block text-xs app-muted mt-0.5">
                  {{ 'adminProjects.videoUploadHelp' | translate }}
                </span>
              </span>
            </button>

            <button
              type="button"
              class="flex items-start gap-3 rounded-xl border p-4
                     text-start transition"
              [class.border-[var(--p-primary-color)]]="
                videoMode() === 'youtube'
              "
              [class.bg-[var(--p-primary-color)]/5]="
                videoMode() === 'youtube'
              "
              [disabled]="uploadingVideo()"
              (click)="selectMode('youtube')"
            >
              <i class="pi pi-youtube text-xl mt-0.5"></i>

              <span>
                <span class="block text-sm font-semibold">
                  {{ 'adminProjects.videoModeYoutube' | translate }}
                </span>

                <span class="block text-xs app-muted mt-0.5">
                  {{ 'adminProjects.videoUrlHelp' | translate }}
                </span>
              </span>
            </button>
          </div>

          <!-- Aperçu vidéo uploadée -->
          @if (
            videoMode() === 'upload' &&
            video();
            as currentVideo
          ) {
            <div
              class="rounded-2xl border border-[var(--app-border)]
                     bg-[var(--app-surface-muted)] p-4"
            >
              <div
                class="flex flex-wrap items-center
                       justify-between gap-3"
              >
                <span
                  class="inline-flex items-center gap-1 rounded
                         bg-sky-100 px-2 py-0.5 text-xs font-semibold
                         text-sky-700
                         dark:bg-sky-500/10 dark:text-sky-300"
                >
                  <i class="pi pi-video text-sm"></i>
                  {{ 'adminProjects.videoFile' | translate }}
                </span>

                <p-button
                  type="button"
                  icon="pi pi-trash"
                  severity="danger"
                  [text]="true"
                  [rounded]="true"
                  [label]="
                    'adminProjects.removeVideo' | translate
                  "
                  [disabled]="uploadingVideo()"
                  (onClick)="removeVideo()"
                />
              </div>

              <video
                [src]="videoPreviewUrl()"
                controls
                class="mt-4 max-h-80 w-full rounded-xl
                       border border-[var(--app-border)] bg-black"
              ></video>
            </div>
          }

          <!-- Aperçu YouTube -->
          @if (
            videoMode() === 'youtube' &&
            youtubeEmbedUrl();
            as embedUrl
          ) {
            <div
              class="rounded-2xl border border-[var(--app-border)]
                     bg-[var(--app-surface-muted)] p-4"
            >
              <div
                class="flex flex-wrap items-center
                       justify-between gap-3"
              >
                <span
                  class="inline-flex items-center gap-1 rounded
                         bg-red-100 px-2 py-0.5 text-xs font-semibold
                         text-red-700
                         dark:bg-red-500/10 dark:text-red-300"
                >
                  <i class="pi pi-youtube text-sm"></i>
                  YouTube
                </span>

                <p-button
                  type="button"
                  icon="pi pi-trash"
                  severity="danger"
                  [text]="true"
                  [rounded]="true"
                  [label]="
                    'adminProjects.removeVideo' | translate
                  "
                  (onClick)="removeVideo()"
                />
              </div>

              <div
                class="relative mt-4 w-full max-w-lg aspect-video
                       overflow-hidden rounded-xl border
                       border-[var(--app-border)] bg-black"
              >
                <iframe
                  class="h-full w-full"
                  [src]="embedUrl"
                  title="YouTube video player"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write;
                         encrypted-media; gyroscope;
                         picture-in-picture"
                  allowfullscreen
                ></iframe>
              </div>
            </div>
          }

          <!-- Upload -->
          @if (
            videoMode() === 'upload' &&
            !video()
          ) {
            <div
              class="rounded-xl border border-dashed
                     border-[var(--app-border)] p-6 text-center"
            >
              <i
                class="pi pi-cloud-upload text-3xl
                       text-[var(--p-primary-color)] mb-3"
              ></i>

              <p class="text-sm font-semibold">
                {{ 'adminProjects.videoUpload' | translate }}
              </p>

              <p class="text-xs app-muted mt-1 mb-4">
                {{ 'adminProjects.videoUploadHelp' | translate }}
              </p>

              <input
                #videoInput
                type="file"
                class="hidden"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                (change)="onVideoFileSelected($event)"
              />

              <p-button
                type="button"
                icon="pi pi-upload"
                severity="secondary"
                [outlined]="true"
                [label]="
                  uploadingVideo()
                    ? ('adminProjects.videoUploading' | translate)
                    : ('adminProjects.uploadVideo' | translate)
                "
                [loading]="uploadingVideo()"
                (onClick)="videoInput.click()"
              />
            </div>
          }

          <!-- YouTube -->
          @if (
            videoMode() === 'youtube' &&
            !video()
          ) {
            <div
              class="rounded-xl border border-[var(--app-border)] p-4"
            >
              <label
                for="project-video-url"
                class="block text-sm font-semibold mb-1"
              >
                {{ 'adminProjects.videoUrlOption' | translate }}
              </label>

              <p class="text-xs app-muted mb-3">
                {{ 'adminProjects.videoUrlHelp' | translate }}
              </p>

              <div class="flex items-center gap-2">
                <input
                  pInputText
                  id="project-video-url"
                  class="w-full text-sm"
                  [value]="youtubeUrl()"
                  (input)="onYoutubeUrlInput($event)"
                  placeholder="https://www.youtube.com/watch?v=..."
                />

                <p-button
                  type="button"
                  icon="pi pi-check"
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="applyYoutubeUrl()"
                  [disabled]="!youtubeUrl().trim()"
                />
              </div>
            </div>
          }
        </div>
      </p-card>
    </div>
  `
})
export class ProjectMediaManagerComponent {
  private readonly mediaService = inject(MediaService);
  private readonly translate = inject(TranslateService);
  private readonly messages = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly images = input<string[]>([]);
  readonly video = input<string | null>(null);

  readonly imagesChange = output<string[]>();
  readonly videoChange = output<string | null>();

  readonly uploadingImages = signal(false);
  readonly uploadingVideo = signal(false);

  readonly videoMode = signal<VideoMode>('none');

  readonly youtubeUrl = signal('');

  readonly localVideoPreview = signal<string | null>(null);

  readonly dragIndex = signal<number | null>(null);

  private readonly videoPreviewCache = new Map<string, string>();

  readonly videoPreviewUrl = computed(() => {
    const video = this.video();

    if (!video) {
      return null;
    }

    if (this.videoPreviewCache.has(video)) {
      return this.videoPreviewCache.get(video)!;
    }

    return resolveMediaUrl(video);
  });

  readonly youtubeEmbedUrl = computed(() => {
    const video = this.video();

    if (!video) {
      return null;
    }

    const videoId = this.extractYoutubeId(video);

    if (!videoId) {
      return null;
    }

    return video;
  });

  resolveImage(value: string | null | undefined): string {
    return resolveMediaUrl(value) ?? '';
  }

  // ------------------------------------------------------------
  // IMAGES
  // ------------------------------------------------------------

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';

    if (!files.length || this.uploadingImages()) {
      return;
    }

    const oversized = files.some(
      file => file.size > 10 * 1024 * 1024
    );

    if (oversized) {
      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('adminProjects.error'),
        detail: this.translate.instant(
          'adminProjects.imageSizeError'
        ),
        life: 6000
      });

      return;
    }

    this.uploadingImages.set(true);

    this.mediaService
      .uploadImages(files)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.uploadingImages.set(false))
      )
      .subscribe({
        next: uploaded => {
          const paths = uploaded
            .map(item => item.path)
            .filter(Boolean);

          this.imagesChange.emit([
            ...this.images(),
            ...paths
          ]);
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
            summary: this.translate.instant('adminProjects.error'),
            detail: this.translate.instant(
              'adminProjects.imageUploadError'
            ),
            life: 6000
          });
        }
      });
  }

  onDragStart(event: DragEvent, index: number): void {
    this.dragIndex.set(index);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onDragEnter(event: DragEvent, targetIndex: number): void {
    event.preventDefault();

    const sourceIndex = this.dragIndex();

    if (
      sourceIndex === null ||
      sourceIndex === targetIndex
    ) {
      return;
    }

    this.moveImage(sourceIndex, targetIndex);
    this.dragIndex.set(targetIndex);
  }

  onDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();

    const sourceIndex = this.dragIndex();
    this.dragIndex.set(null);

    if (sourceIndex === null) {
      return;
    }

    this.moveImage(sourceIndex, targetIndex);
  }

  onDragEnd(): void {
    this.dragIndex.set(null);
  }

  moveImage(from: number, to: number): void {
    const images = this.images();

    if (
      from < 0 ||
      to < 0 ||
      from >= images.length ||
      to >= images.length ||
      from === to
    ) {
      return;
    }

    const list = [...images];
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);

    this.imagesChange.emit(list);
  }

  setAsCover(index: number): void {
    if (index <= 0) {
      return;
    }

    const list = [...this.images()];
    const [image] = list.splice(index, 1);
    list.unshift(image);

    this.imagesChange.emit(list);
  }

  removeImage(index: number): void {
    const list = [...this.images()];
    list.splice(index, 1);

    this.imagesChange.emit(list);
  }

  removeAllImages(): void {
    this.imagesChange.emit([]);
  }

  // ------------------------------------------------------------
  // VIDÉO
  // ------------------------------------------------------------

  selectMode(mode: VideoMode): void {
    if (this.uploadingVideo()) {
      return;
    }

    this.videoMode.set(mode);

    if (mode === 'upload') {
      this.youtubeUrl.set('');
      this.videoChange.emit(null);
    }

    if (mode === 'youtube') {
      this.videoChange.emit(null);
    }

    if (mode === 'none') {
      this.youtubeUrl.set('');
      this.videoChange.emit(null);
    }
  }

  onYoutubeUrlInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.youtubeUrl.set(value);
  }

  applyYoutubeUrl(): void {
    const url = this.youtubeUrl().trim();

    if (!url) {
      return;
    }

    const youtubeId = this.extractYoutubeId(url);

    if (!youtubeId) {
      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('adminProjects.error'),
        detail: this.translate.instant(
          'adminProjects.videoUrlInvalid'
        ),
        life: 6000
      });

      return;
    }

    this.videoChange.emit(url);
  }

  onVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file || this.uploadingVideo()) {
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('adminProjects.error'),
        detail: this.translate.instant(
          'adminProjects.videoSizeError'
        ),
        life: 6000
      });

      return;
    }

    const previewUrl = URL.createObjectURL(file);
    this.localVideoPreview.set(previewUrl);

    this.uploadingVideo.set(true);

    this.mediaService
      .uploadVideo(file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.uploadingVideo.set(false))
      )
      .subscribe({
        next: response => {
          if (response?.path) {
            this.videoPreviewCache.set(
              response.path,
              previewUrl
            );

            this.videoChange.emit(response.path);
          }
        },

        error: (error: unknown) => {
          this.localVideoPreview.set(null);

          if (
            error instanceof HttpErrorResponse &&
            (error.status === 401 || error.status === 403)
          ) {
            return;
          }

          this.messages.add({
            severity: 'error',
            summary: this.translate.instant('adminProjects.error'),
            detail: this.translate.instant(
              'adminProjects.videoUploadError'
            ),
            life: 6000
          });
        }
      });
  }

  removeVideo(): void {
    this.videoChange.emit(null);
    this.youtubeUrl.set('');
    this.videoMode.set('none');
  }

  private extractYoutubeId(
    value: string | null | undefined
  ): string | null {
    if (!value) {
      return null;
    }

    const match = value.trim().match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i
    );

    return match ? match[1] : null;
  }
}