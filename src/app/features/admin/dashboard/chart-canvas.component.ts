import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  viewChild
} from '@angular/core';

import { Chart } from 'chart.js/auto';
import type { ChartConfiguration } from 'chart.js';

/**
 * Enveloppe Angular minimale autour de Chart.js.
 * Le composant parent fournit une configuration complète et
 * le canvas est détruit avec le composant.
 */
@Component({
  selector: 'app-chart-canvas',
  standalone: true,

  template: `
    <div class="relative h-full w-full">
      <canvas
        #canvas
        role="img"
        [attr.aria-label]="ariaLabel"
      ></canvas>
    </div>
  `
})
export class ChartCanvasComponent
  implements AfterViewInit, OnChanges, OnDestroy {
  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  @Input({ required: true }) config!: ChartConfiguration;
  @Input() ariaLabel = '';

  private chart?: Chart;

  ngAfterViewInit(): void {
    this.chart = new Chart(
      this.canvas().nativeElement,
      this.config
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chart || !changes['config']) {
      return;
    }

    this.chart.data = this.config.data;
    this.chart.options = this.config.options ?? {};
    this.chart.update();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
