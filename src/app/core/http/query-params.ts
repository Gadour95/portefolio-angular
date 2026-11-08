import { HttpParams } from '@angular/common/http';

/**
 * Construit des HttpParams en ignorant les valeurs vides.
 */
export function buildHttpParams(query: object): HttpParams {
  let params = new HttpParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    params = params.set(key, String(value));
  });

  return params;
}
