import {
  Component,
  computed,
  inject,
  signal
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';

import { TranslatePipe } from '@ngx-translate/core';

import {
  resolveMediaUrl,
  resolveMediaUrls
} from '../../../../core/http/media-url';

import {
  ProjectPublic
} from '../../../../core/models/project.model';

import { ProjectService } from '../../../../core/services/project.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink, TranslatePipe],

  template: `
    <div class="app-container space-y-8 py-10 sm:py-14">
      <a
        routerLink="/projects"
        class="inline-flex items-center gap-2 text-sm font-semibold
               text-[var(--app-text-muted)] transition
               hover:text-[var(--p-primary-color)]"
      >
        <i
          class="pi pi-arrow-left text-xs rtl:rotate-180"
          aria-hidden="true"
        ></i>

        {{ 'publicPages.projects.back' | translate }}
      </a>

      @if (loading()) {
        <div class="space-y-6">
          <div
            class="h-64 animate-pulse rounded-3xl
                   bg-[var(--app-surface-muted)]"
          ></div>

          <div class="space-y-3">
            <div
              class="h-5 w-1/3 animate-pulse rounded
                     bg-[var(--app-surface-muted)]"
            ></div>

            <div
              class="h-4 w-2/3 animate-pulse rounded
                     bg-[var(--app-surface-muted)]"
            ></div>
          </div>
        </div>
      } @else if (notFound()) {
        <div
          class="rounded-2xl border border-[var(--app-border)]
                 bg-[var(--app-surface)] p-10 text-center"
        >
          <i
            class="pi pi-search text-4xl text-[var(--app-text-muted)]"
            aria-hidden="true"
          ></i>

          <h1 class="mt-4 text-2xl font-bold">
            {{ 'publicPages.projects.notFoundTitle' | translate }}
          </h1>

          <p class="mt-2 text-sm text-[var(--app-text-muted)]">
            {{ 'publicPages.projects.notFoundText' | translate }}
          </p>

          <a
            routerLink="/projects"
            class="mt-6 inline-flex min-h-10 items-center gap-2
                   rounded-xl bg-[var(--p-primary-color)] px-4 py-2
                   text-sm font-semibold
                   text-[var(--p-primary-inverse-color)]"
          >
            {{ 'publicPages.projects.back' | translate }}
          </a>
        </div>
      } @else if (error()) {
        <div
          class="rounded-2xl border border-[var(--app-border)]
                 bg-[var(--app-surface)] p-8 text-center"
        >
          <p class="text-sm text-[var(--app-text-muted)]">
            {{ 'common.loadingError' | translate }}
          </p>

          <button
            type="button"
            class="mt-5 inline-flex min-h-10 items-center gap-2
                   rounded-xl border border-[var(--app-border)] px-4
                   py-2 text-sm font-semibold"
            (click)="reload()"
          >
            <i
              class="pi pi-refresh text-xs"
              aria-hidden="true"
            ></i>

            {{ 'common.retry' | translate }}
          </button>
        </div>
      } @else {
        @if (project(); as item) {
        <article class="space-y-8">
          <!-- En-tête -->
          <header class="max-w-3xl">
            @if (item.featured) {
              <span
                class="inline-flex items-center gap-1.5 rounded-full
                       bg-[var(--p-primary-color)] px-3 py-1
                       text-[0.65rem] font-bold uppercase tracking-wide
                       text-[var(--p-primary-inverse-color)]"
              >
                <i
                  class="pi pi-star-fill text-[0.6rem]"
                  aria-hidden="true"
                ></i>

                {{ 'publicPages.projects.featured' | translate }}
              </span>
            }

            @if (item.role) {
              <p
                class="mt-4 text-xs font-bold uppercase
                       tracking-[0.14em]
                       text-[var(--p-primary-color)]"
              >
                {{ item.role }}
              </p>
            }

            <h1
              class="mt-2 text-3xl font-bold tracking-[-0.04em]
                     sm:text-4xl"
            >
              {{ item.title }}
            </h1>

            <p class="mt-4 text-base leading-8 text-[var(--app-text-muted)]">
              {{ item.summary }}
            </p>

            @if (item.technologies.length) {
              <div class="mt-5 flex flex-wrap gap-2">
                @for (
                  technology of item.technologies;
                  track technology.id
                ) {
                  <span
                    class="rounded-full border border-[var(--app-border)]
                           bg-[var(--app-surface)] px-3 py-1
                           text-xs font-semibold
                           text-[var(--app-text-muted)]"
                  >
                    {{ technology.name }}
                  </span>
                }
              </div>
            }

            @if (item.demoUrl || item.repoUrl) {
              <div class="mt-6 flex flex-wrap items-center gap-3">
                @if (item.demoUrl) {
                  <a
                    [href]="item.demoUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex min-h-11 items-center gap-2
                           rounded-xl bg-[var(--p-primary-color)] px-5
                           py-3 text-sm font-semibold
                           text-[var(--p-primary-inverse-color)]
                           transition
                           hover:bg-[var(--p-primary-hover-color)]"
                  >
                    <i
                      class="pi pi-external-link text-xs"
                      aria-hidden="true"
                    ></i>

                    {{ 'publicPages.projects.demo' | translate }}
                  </a>
                }

                @if (item.repoUrl) {
                  <a
                    [href]="item.repoUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex min-h-11 items-center gap-2
                           rounded-xl border border-[var(--app-border)]
                           bg-[var(--app-surface)] px-5 py-3
                           text-sm font-semibold transition
                           hover:border-[var(--p-primary-color)]
                           hover:text-[var(--p-primary-color)]"
                  >
                    <i
                      class="pi pi-github text-xs"
                      aria-hidden="true"
                    ></i>

                    {{ 'publicPages.projects.repo' | translate }}
                  </a>
                }
              </div>
            }
          </header>

          <!-- Galerie -->
          <section class="space-y-4">
            <h2 class="text-lg font-semibold">
              {{ 'publicPages.projects.gallery' | translate }}
            </h2>

            @if (images().length) {
              <div
                class="relative h-72 overflow-hidden rounded-3xl border
                       border-[var(--app-border)]
                       bg-[var(--app-surface-muted)]
                       sm:h-[32rem]"
              >
                <img
                  [src]="images()[activeImage()]"
                  alt=""
                  aria-hidden="true"
                  class="absolute inset-0 h-full w-full scale-125
                         object-cover opacity-60 blur-2xl"
                />

                <img
                  [src]="images()[activeImage()]"
                  [alt]="item.title"
                  class="relative z-10 h-full w-full object-contain"
                />
              </div>

              @if (images().length > 1) {
                <div class="flex flex-wrap gap-3">
                  @for (image of images(); track $index; let index = $index) {
                    <button
                      type="button"
                      class="h-20 w-28 overflow-hidden rounded-xl border-2
                             bg-[var(--app-surface-muted)]
                             transition hover:opacity-90"
                      [style.borderColor]="
                        activeImage() === index
                          ? 'var(--p-primary-color)'
                          : 'var(--app-border)'
                      "
                      [attr.aria-pressed]="activeImage() === index"
                      (click)="activeImage.set(index)"
                    >
                      <img
                        [src]="image"
                        [alt]="item.title"
                        class="h-full w-full object-contain"
                        loading="lazy"
                      />
                    </button>
                  }
                </div>
              }
            } @else {
              <div
                class="flex h-56 items-center justify-center rounded-3xl
                       border border-dashed border-[var(--app-border)]
                       bg-[var(--app-surface)]"
              >
                <div class="text-center">
                  <i
                    class="pi pi-image text-4xl text-[var(--app-text-muted)]"
                    aria-hidden="true"
                  ></i>

                  <p class="mt-3 text-sm text-[var(--app-text-muted)]">
                    {{ 'publicPages.projects.noImage' | translate }}
                  </p>
                </div>
              </div>
            }
          </section>

          <!-- Vidéo -->
          @if (videoUrl(); as video) {
            <section class="space-y-4">
              <h2 class="text-lg font-semibold">
                {{ 'publicPages.projects.video' | translate }}
              </h2>

              @if (youtubeId(); as ytId) {
                <div
                  class="aspect-video w-full overflow-hidden rounded-2xl
                         border border-[var(--app-border)] bg-black"
                >
                  <iframe
                    class="h-full w-full"
                    [src]="youtubeEmbedUrl()"
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write;
                           encrypted-media; gyroscope; picture-in-picture;
                           web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    allowfullscreen
                  ></iframe>
                </div>
              } @else if (isDirectVideo(video)) {
                <div
                  class="aspect-video w-full overflow-hidden rounded-2xl
                         border border-[var(--app-border)] bg-black"
                >
                  <video
                    class="h-full w-full object-contain"
                    controls
                    preload="metadata"
                    [src]="video"
                  ></video>
                </div>
              } @else {
                <a
                  [href]="video"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex min-h-11 items-center gap-2
                         rounded-xl border border-[var(--app-border)]
                         bg-[var(--app-surface)] px-5 py-3
                         text-sm font-semibold transition
                         hover:border-[var(--p-primary-color)]
                         hover:text-[var(--p-primary-color)]"
                >
                  <i
                    class="pi pi-play text-xs"
                    aria-hidden="true"
                  ></i>

                  {{ 'publicPages.projects.watchVideo' | translate }}
                </a>
              }
            </section>
          }
        </article>
        }
      }
    </div>
  `
})
export class ProjectDetailComponent {
  private readonly projectService = inject(ProjectService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  readonly project = signal<ProjectPublic | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly notFound = signal(false);

  readonly activeImage = signal(0);

  readonly images = computed(() =>
    resolveMediaUrls(this.project()?.images)
  );

  readonly videoUrl = computed(() =>
    resolveMediaUrl(this.project()?.video)
  );

  readonly youtubeId = computed(() =>
    this.extractYoutubeId(this.videoUrl())
  );

  readonly youtubeEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const id = this.youtubeId();

    if (!id) return null;

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${id}`
    );
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const slug = params.get('slug');

        if (!slug) {
          this.loading.set(false);
          this.notFound.set(true);
          return;
        }

        this.load(slug);
      });
  }

  reload(): void {
    const slug = this.route.snapshot.paramMap.get('slug');

    if (slug) {
      this.load(slug);
    }
  }

  isDirectVideo(url: string): boolean {
    return /\.(mp4|webm|ogg|ogv|mov)(\?.*)?$/i.test(url);
  }

  private extractYoutubeId(
    value: string | null | undefined
  ): string | null {
    if (!value) return null;

    const match = value
      .trim()
      .match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i
      );

    return match ? match[1] : null;
  }

  private load(slug: string): void {
    this.loading.set(true);
    this.error.set(false);
    this.notFound.set(false);
    this.activeImage.set(0);

    this.projectService.getPublicProject(slug).subscribe({
      next: project => {
        this.project.set(project);
        this.loading.set(false);
      },

      error: (error: unknown) => {
        this.project.set(null);
        this.loading.set(false);

        if (
          error instanceof HttpErrorResponse &&
          error.status === 404
        ) {
          this.notFound.set(true);
          return;
        }

        this.error.set(true);
      }
    });
  }
}
