import { inject } from '@angular/core';

import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

import {
  catchError,
  throwError
} from 'rxjs';

import { isBackendRequest } from '../http/backend-url';

export const apiErrorInterceptor: HttpInterceptorFn = (
  request,
  next
) => {
  if (!isBackendRequest(request.url)) {
    return next(request);
  }

  const messages = inject(MessageService);
  const translate = inject(TranslateService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          messages.add({
            key: 'auth',
            severity: 'warn',
            summary: translate.instant('auth.sessionTitle'),
            detail: translate.instant('auth.sessionExpired'),
            life: 5000
          });
        }

        if (error.status === 403) {
          messages.add({
            key: 'auth',
            severity: 'error',
            summary: translate.instant('auth.forbiddenTitle'),
            detail: translate.instant('auth.forbiddenText'),
            life: 5000
          });
        }
      }

      return throwError(() => error);
    })
  );
};