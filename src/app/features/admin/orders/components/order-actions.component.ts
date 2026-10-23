import {
  Component,
  computed,
  inject,
  input
} from '@angular/core';

import {
  TranslatePipe
} from '@ngx-translate/core';

import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import {
  AdminOrder
} from '../models/order.model';

import {
  OrderAction
} from '../models/order-action.model';

import {
  AdminOrderActionsService
} from '../services/admin-order-actions.service';

type ActionSeverity =
  | 'success'
  | 'danger'
  | 'info'
  | 'warn';

@Component({
  selector: 'app-order-actions',
  standalone: true,

  imports: [
    TranslatePipe,
    ButtonModule,
    TooltipModule
  ],

  host: {
    class: 'inline-flex'
  },

  template: `
    <div class="flex flex-wrap items-center gap-1">
      @for (action of availableActions(); track action) {
        <p-button
          type="button"
          [icon]="icons[action]"
          [severity]="severities[action]"
          [text]="compact()"
          [rounded]="compact()"
          [label]="
            compact()
              ? ''
              : (
                  'orderActions.labels.' + action
                    | translate
                )
          "
          [ariaLabel]="
            'orderActions.labels.' + action | translate
          "
          [pTooltip]="
            'orderActions.labels.' + action | translate
          "
          [loading]="actions.isRunning(order().id, action)"
          [disabled]="actions.locked()"
          (onClick)="actions.confirm(order(), action)"
        />
      }
    </div>
  `
})
export class OrderActionsComponent {
  readonly actions = inject(AdminOrderActionsService);

  readonly order = input.required<AdminOrder>();
  readonly compact = input(false);

  readonly availableActions = computed(() =>
    this.actions.availableActions(this.order().status)
  );

  readonly icons: Record<OrderAction, string> = {
    approve: 'pi pi-check',
    reject: 'pi pi-times',
    ship: 'pi pi-truck',
    deliver: 'pi pi-check-circle',
    archive: 'pi pi-inbox'
  };

  readonly severities: Record<
    OrderAction,
    ActionSeverity
  > = {
    approve: 'success',
    reject: 'danger',
    ship: 'info',
    deliver: 'success',
    archive: 'warn'
  };
}