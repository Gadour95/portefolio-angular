import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import {
  environment
} from '../../../../../environments/environment';

import {
  PageResponse
} from '../../../../core/models/page-response.model';

import {
  Category,
  CategoryPayload,
  CategoryQuery
} from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class AdminCategoryService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiUrl}/api/admin/categories`;

  findAll(
    query: CategoryQuery
  ): Observable<PageResponse<Category>> {
    let params = new HttpParams()
      .set('deletion', query.deletion)
      .set('page', query.page)
      .set('size', query.size);

    const search = query.search.trim();

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PageResponse<Category>>(
      this.baseUrl,
      { params }
    );
  }

  findById(id: string): Observable<Category> {
    return this.http.get<Category>(
      `${this.baseUrl}/${encodeURIComponent(id)}`
    );
  }

  create(payload: CategoryPayload): Observable<unknown> {
    return this.http.post<unknown>(
      this.baseUrl,
      payload
    );
  }

  update(
    id: string,
    payload: CategoryPayload
  ): Observable<unknown> {
    return this.http.put<unknown>(
      `${this.baseUrl}/${encodeURIComponent(id)}`,
      payload
    );
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete<unknown>(
      `${this.baseUrl}/${encodeURIComponent(id)}`
    );
  }
}