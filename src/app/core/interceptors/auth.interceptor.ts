import { inject } from '@angular/core';

import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import {
  catchError,
  defer,
  from,
  switchMap,
  throwError
} from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { isBackendRequest } from '../http/backend-url';

export const authInterceptor: HttpInterceptorFn = (
  request,
  next
) => {
  if (!isBackendRequest(request.url)) {
    return next(request);
  }

  const auth = inject(AuthService);

  return defer(() => from(auth.getValidToken())).pipe(
    catchError(() =>
      throwError(() =>
        new HttpErrorResponse({
          status: 401,
          statusText: 'Session expired',
          url: request.url,
          error: {
            message: 'Your session has expired'
          }
        })
      )
    ),

    switchMap(token => {
      if (!token) {
        return next(request);
      }

      const authenticatedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      return next(authenticatedRequest);
    })
  );
};