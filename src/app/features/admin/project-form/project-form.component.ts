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
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  DomSanitizer,
  SafeResourceUrl
} from '@angular/platform-browser';

import {
  takeUntilDestroyed,
  toSignal
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
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import { finalize } from 'rxjs';

import {
  ApiError
} from '../../../core/models/api-error.model';

import {
  LocalizedText
} from '../../../core/models/common.model';

import {
  ProjectAdmin,
  ProjectAdminRequest
} from '../../../core/models/project.model';

import {
  Technology
} from '../../../core/models/technology.model';

import {
  ProjectService
} from '../../../core/services/project.service';

import {
  TechnologyService
} from '../../../core/services/technology.service';

import {
  MediaService
} from '../../../core/services/media.service';

import {
  resolveMediaUrl
} from '../../../core/http/media-url';

type LocalizedField = 'title' | 'summary' | 'role';
type AppLang = 'fr' | 'en' | 'ar';

interface LanguageOption {
  code: AppLang;
  label: string;
  dir: 'ltr' | 'rtl';
}

@Component({
  selector: 'app-admin-project-form',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    MultiSelectModule,
    TextareaModule,
    TooltipModule
  ],

  template: `
    <div class="space-y-6 pb-12">
      <!-- En-tête -->
      <section class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <a
            routerLink="/admin/projects"
            class="inline-flex items-center gap-2 text-xs font-bold
                   uppercase tracking-[0.14em] text-[var(--p-primary-color)]
                   hover:underline"
          >
            <i class="pi pi-arrow-left text-[0.65rem] rtl:rotate-180"></i>
            {{ 'adminProjects.back' | translate }}
          </a>

          <h1
            class="mt-2 text-2xl font-bold tracking-[-0.035em]
                   sm:text-3xl"
          >
            {{
              (isEditMode()
                ? 'adminProjects.editTitle'
                : 'adminProjects.createTitle') | translate
            }}
          </h1>

          <p class="mt-1 max-w-2xl app-muted text-sm">
            {{ 'adminPages.projectForm.subtitle' | translate }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <p-button
            [label]="'adminProjects.cancel' | translate"
            severity="secondary"
            [outlined]="true"
            [disabled]="saving()"
            (onClick)="cancel()"
          />

          <p-button
            icon="pi pi-check"
            [label]="'adminProjects.save' | translate"
            [loading]="saving()"
            [disabled]="saving() || loadingProject()"
            (onClick)="save()"
          />
        </div>
      </section>

      @if (loadError(); as error) {
        <p-message severity="error" styleClass="w-full">
          {{ error }}
        </p-message>
      }

      @if (formError(); as error) {
        <p-message severity="error" styleClass="w-full">
          {{ error }}
        </p-message>
      }

      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
        <!-- 1. Informations générales -->
        <p-card styleClass="rounded-2xl">
          <div class="space-y-5">
            <div>
              <h2 class="text-base font-bold">
                {{ 'adminProjects.generalInfo' | translate }}
              </h2>
              <p class="text-xs app-muted mt-0.5">
                {{ 'adminPages.projects.subtitle' | translate }}
              </p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <!-- Slug -->
              <div>
                <div class="flex items-center justify-between">
                  <label for="project-slug" class="app-label">
                    {{ 'adminProjects.slug' | translate }}
                    <span class="text-red-500" aria-hidden="true">*</span>
                  </label>

                  <button
                    type="button"
                    class="text-xs font-semibold text-[var(--p-primary-color)]
                           hover:underline"
                    (click)="generateSlugFromTitle()"
                  >
                    {{ 'adminProjects.slugAuto' | translate }}
                  </button>
                </div>

                <input
                  pInputText
                  id="project-slug"
                  formControlName="slug"
                  class="w-full font-mono text-sm"
                  placeholder="mon-projet-web"
                  autocomplete="off"
                  [readonly]="saving()"
                  [class.ng-invalid]="
                    (form.controls.slug.invalid &&
                      form.controls.slug.touched) ||
                    !!serverFieldErrors()['slug']
                  "
                />

                <p class="mt-1.5 text-xs app-muted">
                  {{ 'adminProjects.slugHelp' | translate }}
                </p>

                @if (
                  form.controls.slug.invalid &&
                  form.controls.slug.touched
                ) {
                  <p-message
                    severity="error"
                    variant="simple"
                    styleClass="mt-2"
                  >
                    {{
                      form.controls.slug.hasError('pattern')
                        ? ('adminProjects.slugInvalid' | translate)
                        : ('adminProjects.slugRequired' | translate)
                    }}
                  </p-message>
                }

                @if (serverFieldErrors()['slug']; as error) {
                  <p-message
                    severity="error"
                    variant="simple"
                    styleClass="mt-2"
                  >
                    {{ error }}
                  </p-message>
                }
              </div>

              <!-- Position -->
              <div>
                <label for="project-position" class="app-label">
                  {{ 'adminProjects.position' | translate }}
                </label>

                <p-inputnumber
                  inputId="project-position"
                  formControlName="position"
                  [min]="0"
                  [showButtons]="true"
                  [readonly]="saving()"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                />

                <p class="mt-1.5 text-xs app-muted">
                  {{ 'adminProjects.positionHelp' | translate }}
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
                    {{ 'adminProjects.positionInvalid' | translate }}
                  </p-message>
                }
              </div>
            </div>

            <!-- Technologies -->
            <div>
              <label for="project-technologies" class="app-label">
                {{ 'adminProjects.technologies' | translate }}
              </label>

              <p-multiselect
                inputId="project-technologies"
                [options]="technologies()"
                optionLabel="name"
                optionValue="id"
                formControlName="technologyIds"
                [filter]="true"
                [placeholder]="'adminProjects.selectTechnologies' | translate"
                styleClass="w-full"
                display="chip"
              />
            </div>

            <!-- Statuts : Publié & Mis en avant -->
            <div class="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[var(--app-border)]">
              <div class="flex items-start gap-3 rounded-xl border border-[var(--app-border)] p-3.5">
                <p-checkbox
                  inputId="project-published"
                  formControlName="published"
                  [binary]="true"
                  [disabled]="saving()"
                />
                <label for="project-published" class="cursor-pointer">
                  <span class="block text-sm font-semibold">
                    {{ 'adminProjects.published' | translate }}
                  </span>
                  <span class="block text-xs app-muted mt-0.5">
                    {{ 'adminProjects.publishedHelp' | translate }}
                  </span>
                </label>
              </div>

              <div class="flex items-start gap-3 rounded-xl border border-[var(--app-border)] p-3.5">
                <p-checkbox
                  inputId="project-featured"
                  formControlName="featured"
                  [binary]="true"
                  [disabled]="saving()"
                />
                <label for="project-featured" class="cursor-pointer">
                  <span class="block text-sm font-semibold">
                    {{ 'adminProjects.featured' | translate }}
                  </span>
                  <span class="block text-xs app-muted mt-0.5">
                    {{ 'adminProjects.featuredHelp' | translate }}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </p-card>

        <!-- 2. Contenu traduit (FR / EN / AR) -->
        <p-card styleClass="rounded-2xl">
          <div class="space-y-6">
            <div>
              <h2 class="text-base font-bold">
                {{ 'adminProjects.localizedContent' | translate }}
              </h2>
              <p class="text-xs app-muted mt-0.5">
                {{ 'adminProjects.localizedContentHelp' | translate }}
              </p>
            </div>

            @for (field of localizedFields; track field.key) {
              <div class="rounded-2xl bg-[var(--app-surface-muted)] p-4">
                <label class="app-label">
                  {{ field.labelKey | translate }}
                  <span class="text-red-500" aria-hidden="true">*</span>
                </label>

                <div class="mt-3 grid gap-4">
                  @for (lang of languages; track lang.code) {
                    <div>
                      <label
                        [for]="'project-' + field.key + '-' + lang.code"
                        class="mb-1.5 flex items-center gap-2 text-xs font-semibold app-muted"
                      >
                        <span
                          class="inline-flex min-w-16 items-center justify-center
                                 rounded-md bg-[var(--app-surface)] px-2 py-0.5"
                        >
                          {{ lang.label }}
                        </span>
                        <span class="uppercase tracking-wide">{{ lang.code }}</span>
                      </label>

                      @if (field.multiline) {
                        <textarea
                          pTextarea
                          [id]="'project-' + field.key + '-' + lang.code"
                          [rows]="field.rows ?? 3"
                          [formControl]="localizedControl(field.key, lang.code)"
                          class="w-full text-sm"
                          [dir]="lang.dir"
                          [readonly]="saving()"
                          [class.ng-invalid]="
                            isLocalizedInvalid(field.key, lang.code) ||
                            !!serverLocalizedError(field.key, lang.code)
                          "
                        ></textarea>
                      } @else {
                        <input
                          pInputText
                          [id]="'project-' + field.key + '-' + lang.code"
                          [formControl]="localizedControl(field.key, lang.code)"
                          class="w-full text-sm"
                          [dir]="lang.dir"
                          autocomplete="off"
                          [placeholder]="
                            field.placeholderKey
                              ? (field.placeholderKey | translate)
                              : ''
                          "
                          [readonly]="saving()"
                          [class.ng-invalid]="
                            isLocalizedInvalid(field.key, lang.code) ||
                            !!serverLocalizedError(field.key, lang.code)
                          "
                        />
                      }

                      @if (isLocalizedInvalid(field.key, lang.code)) {
                        <p-message
                          severity="error"
                          variant="simple"
                          styleClass="mt-1.5"
                        >
                          {{ localizedErrorKey(field.key, lang.code) | translate }}
                        </p-message>
                      }

                      @if (serverLocalizedError(field.key, lang.code); as error) {
                        <p-message
                          severity="error"
                          variant="simple"
                          styleClass="mt-1.5"
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
        </p-card>

        <!-- 3. Liens externes -->
        <p-card styleClass="rounded-2xl">
          <div class="space-y-5">
            <div>
              <h2 class="text-base font-bold">
                {{ 'adminProjects.linksSection' | translate }}
              </h2>
              <p class="text-xs app-muted mt-0.5">
                {{ 'adminProjects.demoUrlHelp' | translate }}
              </p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label for="project-demo-url" class="app-label">
                  <i class="pi pi-external-link text-xs mr-1"></i>
                  {{ 'adminProjects.demoUrl' | translate }}
                </label>

                <input
                  pInputText
                  id="project-demo-url"
                  formControlName="demoUrl"
                  class="w-full text-sm"
                  placeholder="https://monprojet.com"
                  [readonly]="saving()"
                />
              </div>

              <div>
                <label for="project-repo-url" class="app-label">
                  <i class="pi pi-github text-xs mr-1"></i>
                  {{ 'adminProjects.repoUrl' | translate }}
                </label>

                <input
                  pInputText
                  id="project-repo-url"
                  formControlName="repoUrl"
                  class="w-full text-sm"
                  placeholder="https://github.com/moncompte/monprojet"
                  [readonly]="saving()"
                />
              </div>
            </div>
          </div>
        </p-card>

        <!-- 4. Vidéo (Optionnelle : Upload ou Lien YouTube) -->
        <p-card styleClass="rounded-2xl">
          <div class="space-y-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-base font-bold">
                  {{ 'adminProjects.video' | translate }}
                </h2>
                <p class="text-xs app-muted mt-0.5">
                  {{ 'adminProjects.videoHelp' | translate }}
                </p>
              </div>

              @if (hasVideo()) {
                <p-button
                  type="button"
                  icon="pi pi-trash"
                  severity="danger"
                  [text]="true"
                  [label]="'adminProjects.removeVideo' | translate"
                  [disabled]="saving() || uploadingVideo()"
                  (onClick)="removeVideo()"
                />
              }
            </div>

            <!-- Aperçu de la vidéo actuelle -->
            @if (videoValue(); as currentVideo) {
              <div class="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-black/5 p-4">
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  @if (isUploadedVideo()) {
                    <span class="inline-flex items-center gap-1 rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                      <i class="pi pi-video text-sm"></i>
                      {{ 'adminProjects.videoUploadedFile' | translate }}
                    </span>
                  } @else if (youtubeId()) {
                    <span class="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      <i class="pi pi-youtube text-sm"></i>
                      YouTube ({{ youtubeId() }})
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 rounded bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                      <i class="pi pi-link text-sm"></i>
                      {{ 'adminProjects.videoExternalLink' | translate }}
                    </span>
                  }

                  <span class="font-mono text-xs app-muted truncate max-w-md">
                    {{ videoDisplayName() }}
                  </span>
                </div>

                @if (youtubeId(); as ytId) {
                  <div class="relative w-full max-w-lg aspect-video rounded-xl overflow-hidden border border-[var(--app-border)] bg-black">
                    <iframe
                      class="w-full h-full"
                      [src]="youtubeEmbedUrl()"
                      title="YouTube video player"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </div>
                } @else {
                  <video
                    [src]="resolveVideo(currentVideo)"
                    controls
                    preload="metadata"
                    class="max-h-64 w-full max-w-lg rounded-xl border border-[var(--app-border)] bg-black"
                  ></video>
                }
              </div>
            }

            <!-- Une seule source vidéo à la fois -->
            @if (hasVideo()) {
              <div class="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                <i class="pi pi-info-circle mt-0.5" aria-hidden="true"></i>
                <span>{{ 'adminProjects.videoAlreadySet' | translate }}</span>
              </div>
            } @else {
              <!-- Modes d'ajout de la vidéo -->
              <div class="grid gap-4 sm:grid-cols-2 pt-2">
                <!-- Option A : Upload fichier -->
                <div class="rounded-xl border border-dashed border-[var(--app-border)] p-4 text-center">
                  <i class="pi pi-cloud-upload text-2xl text-[var(--p-primary-color)] mb-2"></i>
                  <p class="text-sm font-semibold">
                    {{ 'adminProjects.videoUpload' | translate }}
                  </p>
                  <p class="text-xs app-muted mt-1 mb-3">
                    MP4, WEBM, OGG, MOV (max 50 Mo)
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
                    size="small"
                    [label]="
                      uploadingVideo()
                        ? ('adminProjects.videoUploading' | translate)
                        : ('adminProjects.uploadVideo' | translate)
                    "
                    [loading]="uploadingVideo()"
                    [disabled]="saving() || uploadingVideo()"
                    (onClick)="videoInput.click()"
                  />
                </div>

                <!-- Option B : Lien YouTube -->
                <div class="rounded-xl border border-[var(--app-border)] p-4">
                  <label for="project-video-url" class="block text-sm font-semibold mb-1">
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
                      [formControl]="videoUrlInput"
                      placeholder="https://www.youtube.com/watch?v=..."
                      (input)="videoUrlError.set(null)"
                      (keydown.enter)="$event.preventDefault(); applyVideoUrl()"
                    />

                    <p-button
                      type="button"
                      icon="pi pi-check"
                      severity="secondary"
                      [outlined]="true"
                      size="small"
                      (onClick)="applyVideoUrl()"
                      [disabled]="
                        !videoUrlInput.value.trim() ||
                        saving() ||
                        uploadingVideo()
                      "
                    />
                  </div>

                  @if (videoUrlError(); as error) {
                    <p-message
                      severity="error"
                      variant="simple"
                      styleClass="mt-2"
                    >
                      {{ error }}
                    </p-message>
                  }
                </div>
              </div>
            }
          </div>
        </p-card>

        <!-- 5. Galerie d'images (Optionnelle, multiple) -->
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
                  [disabled]="saving() || uploadingImages()"
                  (onClick)="imagesInput.click()"
                />

                @if (imagesList().length > 1) {
                  <p-button
                    type="button"
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    size="small"
                    [label]="'adminProjects.removeAllImages' | translate"
                    [disabled]="saving() || uploadingImages()"
                    (onClick)="removeAllImages()"
                  />
                }
              </div>
            </div>

            <!-- Grille des images -->
            @if (imagesList().length > 0) {
              <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                @for (image of imagesList(); track image; let index = $index) {
                  <div
                    class="group relative overflow-hidden rounded-2xl border
                           border-[var(--app-border)] bg-[var(--app-surface-muted)]
                           cursor-grab transition active:cursor-grabbing"
                    [attr.draggable]="!saving() && !uploadingImages()"
                    [class.opacity-40]="draggingImageIndex() === index"
                    [style.outline]="
                      dragOverImageIndex() === index
                        ? '2px solid var(--p-primary-color)'
                        : null
                    "
                    [style.outlineOffset]="
                      dragOverImageIndex() === index ? '2px' : null
                    "
                    (dragstart)="onImageDragStart(index, $event)"
                    (dragover)="onImageDragOver(index, $event)"
                    (dragleave)="onImageDragLeave(index)"
                    (drop)="onImageDrop(index, $event)"
                    (dragend)="onImageDragEnd()"
                  >
                    <img
                      [src]="resolveImage(image)"
                      [alt]="'Image ' + (index + 1)"
                      class="h-32 w-full object-cover"
                      loading="lazy"
                      draggable="false"
                    />

                    <!-- Badge couverture sur la 1ère image -->
                    @if (index === 0) {
                      <span
                        class="absolute top-2 left-2 rounded-full bg-[var(--p-primary-color)]
                               px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide
                               text-[var(--p-primary-inverse-color)] shadow-md"
                      >
                        {{ 'adminProjects.coverBadge' | translate }}
                      </span>
                    }

                    <!-- Poignée de déplacement -->
                    <span
                      class="pointer-events-none absolute top-2 right-2 rounded-md
                             bg-black/50 p-1 text-white opacity-0 transition
                             group-hover:opacity-100"
                      [pTooltip]="'adminProjects.dragToReorder' | translate"
                    >
                      <i class="pi pi-arrows-alt text-xs"></i>
                    </span>

                    <!-- Actions au survol -->
                    <div
                      class="absolute inset-0 flex flex-wrap items-center justify-center gap-1.5
                             bg-black/60 opacity-0 backdrop-blur-xs transition group-hover:opacity-100"
                    >
                      <p-button
                        type="button"
                        icon="pi pi-arrow-left"
                        severity="secondary"
                        styleClass="rtl:rotate-180"
                        [rounded]="true"
                        size="small"
                        [disabled]="index === 0"
                        [pTooltip]="'adminProjects.moveImageLeft' | translate"
                        (onClick)="moveImageLeft(index)"
                      />

                      <p-button
                        type="button"
                        icon="pi pi-arrow-right"
                        severity="secondary"
                        styleClass="rtl:rotate-180"
                        [rounded]="true"
                        size="small"
                        [disabled]="index === imagesList().length - 1"
                        [pTooltip]="'adminProjects.moveImageRight' | translate"
                        (onClick)="moveImageRight(index)"
                      />

                      @if (index > 0) {
                        <p-button
                          type="button"
                          icon="pi pi-star"
                          severity="secondary"
                          [rounded]="true"
                          size="small"
                          [pTooltip]="'adminProjects.setAsCover' | translate"
                          (onClick)="setAsCover(index)"
                        />
                      }

                      <p-button
                        type="button"
                        icon="pi pi-trash"
                        severity="danger"
                        [rounded]="true"
                        size="small"
                        [pTooltip]="'adminProjects.removeImage' | translate"
                        (onClick)="removeImage(index)"
                      />
                    </div>
                  </div>
                }
              </div>

              <p class="flex items-start gap-1.5 text-xs app-muted">
                <i class="pi pi-info-circle mt-0.5" aria-hidden="true"></i>
                <span>{{ 'adminProjects.imageReorderHelp' | translate }}</span>
              </p>
            } @else {
              <div
                class="flex flex-col items-center justify-center rounded-2xl border border-dashed
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
                  [label]="'adminProjects.uploadImages' | translate"
                  (onClick)="imagesInput.click()"
                />
              </div>
            }
          </div>
        </p-card>

        <!-- Actions de pied de page -->
        <div class="flex items-center justify-end gap-3 pt-4">
          <p-button
            [label]="'adminProjects.cancel' | translate"
            severity="secondary"
            [outlined]="true"
            [disabled]="saving()"
            (onClick)="cancel()"
          />

          <p-button
            type="submit"
            icon="pi pi-check"
            [label]="'adminProjects.save' | translate"
            [loading]="saving()"
            [disabled]="saving() || loadingProject()"
          />
        </div>
      </form>
    </div>
  `
})
export class ProjectFormComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly technologyService = inject(TechnologyService);
  private readonly mediaService = inject(MediaService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly translate = inject(TranslateService);
  private readonly messages = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly isEditMode = signal(false);
  readonly projectId = signal<string | null>(null);

  readonly loadingProject = signal(false);
  readonly saving = signal(false);
  readonly uploadingVideo = signal(false);
  readonly uploadingImages = signal(false);

  readonly loadError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly serverFieldErrors = signal<Record<string, string>>({});

  readonly technologies = signal<Technology[]>([]);

  readonly videoUrlInput = new FormControl('', { nonNullable: true });
  readonly videoUrlError = signal<string | null>(null);

  readonly imagesList = signal<string[]>([]);

  readonly draggingImageIndex = signal<number | null>(null);
  readonly dragOverImageIndex = signal<number | null>(null);

  readonly languages: LanguageOption[] = [
    { code: 'fr', label: 'Français', dir: 'ltr' },
    { code: 'en', label: 'English', dir: 'ltr' },
    { code: 'ar', label: 'العربية', dir: 'rtl' }
  ];

  readonly localizedFields: {
    key: LocalizedField;
    labelKey: string;
    placeholderKey?: string;
    multiline: boolean;
    rows?: number;
  }[] = [
    {
      key: 'title',
      labelKey: 'adminProjects.titleField',
      multiline: false
    },
    {
      key: 'summary',
      labelKey: 'adminProjects.summary',
      multiline: true,
      rows: 3
    },
    {
      key: 'role',
      labelKey: 'adminProjects.role',
      placeholderKey: 'adminProjects.rolePlaceholder',
      multiline: false
    }
  ];

  readonly form = new FormGroup({
    slug: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.maxLength(180),
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      ]
    }),

    title: this.localizedGroup(255),
    summary: this.localizedGroup(4000),
    role: this.localizedGroup(255),

    demoUrl: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(500)]
    }),

    repoUrl: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(500)]
    }),

    video: new FormControl<string | null>(null, {
      validators: [Validators.maxLength(500)]
    }),

    technologyIds: new FormControl<string[]>([], {
      nonNullable: true
    }),

    published: new FormControl(false, {
      nonNullable: true
    }),

    featured: new FormControl(false, {
      nonNullable: true
    }),

    position: new FormControl<number | null>(0, {
      validators: [Validators.min(0)]
    })
  });

  readonly videoValue = toSignal(
    this.form.controls.video.valueChanges,
    { initialValue: this.form.controls.video.value }
  );

  readonly hasVideo = computed(() => {
    const video = this.videoValue();
    return !!video && video.trim().length > 0;
  });

  readonly isUploadedVideo = computed(() => {
    const video = this.videoValue();
    return !!video && /^projects\/videos\//i.test(video.trim());
  });

  readonly videoDisplayName = computed(() => {
    const video = this.videoValue();
    if (!video) return '';

    const trimmed = video.trim();
    if (/^(https?:)?\/\//i.test(trimmed)) {
      return trimmed;
    }

    const parts = trimmed.split('/');
    return parts[parts.length - 1] || trimmed;
  });

  readonly youtubeId = computed(() =>
    this.extractYoutubeId(this.videoValue())
  );

  readonly youtubeEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const id = this.youtubeId();

    if (!id) return null;

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${id}`
    );
  });

  ngOnInit(): void {
    this.loadTechnologies();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.projectId.set(id);
      this.loadProject(id);
    } else {
      this.loadNextPosition();
    }
  }

  loadNextPosition(): void {
    this.projectService
      .getNextProjectPosition()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: position => {
          this.form.controls.position.setValue(position, {
            emitEvent: false
          });
        },
        error: () => {}
      });
  }

  loadTechnologies(): void {
    this.technologyService
      .getAdminTechnologies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => this.technologies.set(list),
        error: () => {}
      });
  }

  loadProject(id: string): void {
    this.loadingProject.set(true);
    this.loadError.set(null);

    this.projectService
      .getAdminProject(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingProject.set(false))
      )
      .subscribe({
        next: project => {
          this.form.setValue({
            slug: project.slug,
            title: this.toLocalized(project.title),
            summary: this.toLocalized(project.summary),
            role: this.toLocalized(project.role),
            demoUrl: project.demoUrl ?? null,
            repoUrl: project.repoUrl ?? null,
            video: project.video ?? project.videoUrl ?? null,
            technologyIds: project.technologies?.map(t => t.id) ?? [],
            published: project.published,
            featured: project.featured,
            position: project.position ?? 0
          });

          this.imagesList.set(project.images ?? []);
          this.videoUrlInput.setValue('');
          this.videoUrlError.set(null);
        },

        error: () => {
          this.loadError.set(
            this.translate.instant('common.loadingError')
          );
        }
      });
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
      return `adminProjects.${field}TooLong`;
    }

    return `adminProjects.${field}Required`;
  }

  serverLocalizedError(
    field: LocalizedField,
    lang: AppLang
  ): string | null {
    const errors = this.serverFieldErrors();
    return errors[`${field}.${lang}`] ?? errors[field] ?? null;
  }

  generateSlugFromTitle(): void {
    const titleFr = this.form.controls.title.controls.fr.value;
    const titleEn = this.form.controls.title.controls.en.value;
    const source = titleFr || titleEn;

    if (!source) return;

    const slug = source
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    this.form.controls.slug.setValue(slug);
    this.form.controls.slug.markAsDirty();
  }

  resolveImage(value: string | null | undefined): string {
    return resolveMediaUrl(value) ?? '';
  }

  resolveVideo(value: string | null | undefined): string {
    return resolveMediaUrl(value) ?? '';
  }

  applyVideoUrl(): void {
    const url = this.videoUrlInput.value.trim();
    if (!url || this.hasVideo()) return;

    if (!this.extractYoutubeId(url)) {
      this.videoUrlError.set(
        this.translate.instant('adminProjects.videoUrlInvalid')
      );
      return;
    }

    this.videoUrlError.set(null);
    this.form.controls.video.setValue(url);
    this.form.controls.video.markAsDirty();
    this.videoUrlInput.setValue('');
  }

  onVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (!file || this.uploadingVideo() || this.hasVideo()) return;

    if (file.size > 50 * 1024 * 1024) {
      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('adminProjects.error'),
        detail: this.translate.instant('adminProjects.videoSizeError'),
        life: 6000
      });
      return;
    }

    this.uploadingVideo.set(true);

    this.mediaService
      .uploadVideo(file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.uploadingVideo.set(false))
      )
      .subscribe({
        next: res => {
          if (res?.path) {
            this.form.controls.video.setValue(res.path);
            this.form.controls.video.markAsDirty();
            this.videoUrlInput.setValue('');
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
            summary: this.translate.instant('adminProjects.error'),
            detail: this.translate.instant('adminProjects.videoUploadError'),
            life: 6000
          });
        }
      });
  }

  removeVideo(): void {
    this.form.controls.video.setValue(null);
    this.form.controls.video.markAsDirty();
    this.videoUrlInput.setValue('');
    this.videoUrlError.set(null);
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';

    if (!files.length || this.uploadingImages()) return;

    const oversized = files.some(f => f.size > 10 * 1024 * 1024);
    if (oversized) {
      this.messages.add({
        severity: 'error',
        summary: this.translate.instant('adminProjects.error'),
        detail: this.translate.instant('adminProjects.imageSizeError'),
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
          const newPaths = uploaded.map(u => u.path).filter(Boolean);
          this.imagesList.update(current => [...current, ...newPaths]);
          this.form.markAsDirty();
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
            detail: this.translate.instant('adminProjects.imageUploadError'),
            life: 6000
          });
        }
      });
  }

  setAsCover(index: number): void {
    this.reorderImages(index, 0);
  }

  moveImageLeft(index: number): void {
    this.reorderImages(index, index - 1);
  }

  moveImageRight(index: number): void {
    this.reorderImages(index, index + 1);
  }

  onImageDragStart(index: number, event: DragEvent): void {
    if (this.saving() || this.uploadingImages()) {
      event.preventDefault();
      return;
    }

    this.draggingImageIndex.set(index);
    this.dragOverImageIndex.set(null);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onImageDragOver(index: number, event: DragEvent): void {
    const from = this.draggingImageIndex();
    if (from === null || from === index) return;

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    this.dragOverImageIndex.set(index);
  }

  onImageDragLeave(index: number): void {
    if (this.dragOverImageIndex() === index) {
      this.dragOverImageIndex.set(null);
    }
  }

  onImageDrop(index: number, event: DragEvent): void {
    event.preventDefault();

    const from = this.draggingImageIndex();
    this.draggingImageIndex.set(null);
    this.dragOverImageIndex.set(null);

    if (from === null) return;

    this.reorderImages(from, index);
  }

  onImageDragEnd(): void {
    this.draggingImageIndex.set(null);
    this.dragOverImageIndex.set(null);
  }

  removeImage(index: number): void {
    const list = [...this.imagesList()];
    list.splice(index, 1);
    this.imagesList.set(list);
    this.form.markAsDirty();
  }

  removeAllImages(): void {
    this.imagesList.set([]);
    this.form.markAsDirty();
  }

  cancel(): void {
    this.router.navigate(['/admin/projects']);
  }

  save(): void {
    if (this.saving()) return;

    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.formError.set(
        this.translate.instant('adminProjects.genericError')
      );
      return;
    }

    this.formError.set(null);
    this.serverFieldErrors.set({});
    this.saving.set(true);

    const values = this.form.getRawValue();

    const payload: ProjectAdminRequest = {
      slug: values.slug.trim(),
      title: this.cleanLocalized(values.title),
      summary: this.cleanLocalized(values.summary),
      role: this.cleanLocalized(values.role),
      demoUrl: values.demoUrl?.trim() || null,
      repoUrl: values.repoUrl?.trim() || null,
      video: values.video?.trim() || null,
      images: this.imagesList(),
      technologyIds: values.technologyIds,
      published: values.published,
      featured: values.featured,
      position: values.position ?? 0
    };

    const id = this.projectId();
    const req$ = id
      ? this.projectService.updateProject(id, payload)
      : this.projectService.createProject(payload);

    req$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false))
      )
      .subscribe({
        next: () => {
          this.messages.add({
            severity: 'success',
            summary: this.translate.instant('adminProjects.success'),
            detail: this.translate.instant(
              id ? 'adminProjects.updated' : 'adminProjects.created'
            ),
            life: 3500
          });

          this.router.navigate(['/admin/projects']);
        },

        error: (error: unknown) => {
          this.formError.set(this.errorMessage(error));

          if (error instanceof HttpErrorResponse) {
            const body = error.error as ApiError | null;
            this.serverFieldErrors.set(body?.validationErrors ?? {});
          }
        }
      });
  }

  private reorderImages(from: number, to: number): void {
    const list = [...this.imagesList()];

    if (
      from < 0 ||
      to < 0 ||
      from >= list.length ||
      to >= list.length ||
      from === to
    ) {
      return;
    }

    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    this.imagesList.set(list);
    this.form.markAsDirty();
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

    return this.translate.instant('adminProjects.genericError');
  }
}
