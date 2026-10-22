import { Component, inject } from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  TranslatePipe,
  TranslateService
} from '@ngx-translate/core';

import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

type DemoStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

type TagSeverity = 'warn' | 'success' | 'danger' | 'info' | 'secondary';

@Component({
  selector: 'app-design-system',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SkeletonModule,
    TableModule,
    TagModule
  ],

  templateUrl: './design-system.component.html'
})
export class DesignSystemComponent {
  private readonly messages = inject(MessageService);
  private readonly translate = inject(TranslateService);

  dialogVisible = false;

  readonly form = new FormGroup({
    phoneNumber: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^[0-9]{8}$/)
      ]
    })
  });

  readonly statuses: DemoStatus[] = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ];

  readonly rows: {
    reference: string;
    quantity: number;
    status: DemoStatus;
  }[] = [
    { reference: 'DEMO-001', quantity: 2, status: 'PENDING' },
    { reference: 'DEMO-002', quantity: 1, status: 'APPROVED' },
    { reference: 'DEMO-003', quantity: 3, status: 'SHIPPED' },
    { reference: 'DEMO-004', quantity: 1, status: 'DELIVERED' }
  ];

  severity(status: DemoStatus): TagSeverity {
    const severities: Record<DemoStatus, TagSeverity> = {
      PENDING: 'warn',
      APPROVED: 'success',
      REJECTED: 'danger',
      SHIPPED: 'info',
      DELIVERED: 'success',
      CANCELLED: 'secondary'
    };

    return severities[status];
  }

  showNotification(): void {
    this.messages.add({
      severity: 'success',
      summary: this.translate.instant('demo.notificationTitle'),
      detail: this.translate.instant('demo.notificationText'),
      life: 3500
    });
  }

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.valid) {
      this.showNotification();
    }
  }
}