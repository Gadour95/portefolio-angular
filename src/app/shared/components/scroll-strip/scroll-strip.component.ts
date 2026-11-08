import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  signal
} from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-scroll-strip',
  standalone: true,
  imports: [TranslatePipe],

  template: `
    <div class="relative">
      <div
        #track
        class="siw-scroll-track"
        (scroll)="updateArrows()"
      >
        <ng-content />
      </div>

      <button
        type="button"
        class="absolute start-0 top-1/2 z-10 hidden h-10 w-10
               -translate-y-1/2 place-items-center rounded-full border
               border-[var(--app-border)] bg-[var(--app-surface)]/95
               text-[var(--app-text-muted)] shadow-lg backdrop-blur
               transition hover:border-[var(--p-primary-color)]
               hover:text-[var(--p-primary-color)] disabled:pointer-events-none
               disabled:opacity-0 sm:grid"
        [disabled]="!canScrollStart()"
        [attr.aria-label]="'common.previous' | translate"
        (click)="scrollBy(-1)"
      >
        <i
          class="pi pi-angle-left text-sm rtl:rotate-180"
          aria-hidden="true"
        ></i>
      </button>

      <button
        type="button"
        class="absolute end-0 top-1/2 z-10 hidden h-10 w-10
               -translate-y-1/2 place-items-center rounded-full border
               border-[var(--app-border)] bg-[var(--app-surface)]/95
               text-[var(--app-text-muted)] shadow-lg backdrop-blur
               transition hover:border-[var(--p-primary-color)]
               hover:text-[var(--p-primary-color)] disabled:pointer-events-none
               disabled:opacity-0 sm:grid"
        [disabled]="!canScrollEnd()"
        [attr.aria-label]="'common.next' | translate"
        (click)="scrollBy(1)"
      >
        <i
          class="pi pi-angle-right text-sm rtl:rotate-180"
          aria-hidden="true"
        ></i>
      </button>
    </div>
  `
})
export class ScrollStripComponent
  implements AfterViewInit, OnDestroy
{
  @ViewChild('track')
  private trackRef?: ElementRef<HTMLDivElement>;

  readonly canScrollStart = signal(false);
  readonly canScrollEnd = signal(false);

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;

  ngAfterViewInit(): void {
    const track = this.trackRef?.nativeElement;

    if (!track) {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.updateArrows();
    });

    this.resizeObserver.observe(track);

    this.mutationObserver = new MutationObserver(() => {
      this.updateArrows();
    });

    this.mutationObserver.observe(track, {
      childList: true,
      subtree: true
    });

    this.updateArrows();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateArrows();
  }

  scrollBy(direction: number): void {
    const track = this.trackRef?.nativeElement;

    if (!track) {
      return;
    }

    const rtl =
      getComputedStyle(track).direction === 'rtl';

    track.scrollBy({
      left:
        direction *
        track.clientWidth *
        0.85 *
        (rtl ? -1 : 1),
      behavior: 'smooth'
    });
  }

  updateArrows(): void {
    const track = this.trackRef?.nativeElement;

    if (!track) {
      return;
    }

    const rtl =
      getComputedStyle(track).direction === 'rtl';

    const position = rtl
      ? Math.abs(track.scrollLeft)
      : track.scrollLeft;

    const maxScroll =
      track.scrollWidth - track.clientWidth;

    const start = position > 4;
    const end = maxScroll - position > 4;

    if (this.canScrollStart() !== start) {
      this.canScrollStart.set(start);
    }

    if (this.canScrollEnd() !== end) {
      this.canScrollEnd.set(end);
    }
  }
}
