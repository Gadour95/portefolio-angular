import { inject } from '@angular/core';

import { HttpInterceptorFn } from '@angular/common/http';

import { isBackendRequest } from '../http/backend-url';
import { LanguageService } from '../services/language.service';

/**
 * Ajoute l'en-tête Accept-Language attendu par le backend
 * sur toutes les requêtes API / médias.
 */
export const languageInterceptor: HttpInterceptorFn = (
  request,
  next
) => {
  if (!isBackendRequest(request.url)) {
    return next(request);
  }

  const language = inject(LanguageService).current();

  return next(
    request.clone({
      setHeaders: {
        'Accept-Language': language
      }
    })
  );
};
