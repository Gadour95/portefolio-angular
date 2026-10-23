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
  SubCategory,
  SubCategoryPayload,
  SubCategoryQuery
} from '../models/sub-category.model';

@Injectable({
  providedIn: 'root'
})
export class AdminSubCategoryService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiUrl}/api/admin/sub-categories`;

  findAll(
    query: SubCategoryQuery
  ): Observable<PageResponse<SubCategory>> {
    let params = new HttpParams()
      .set('deletion', query.deletion)
      .set('page', query.page)
      .set('size', query.size);

    if (query.categoryId) {
      params = params.set('categoryId', query.categoryId);
    }

    const search = query.search.trim();

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PageResponse<SubCategory>>(
      this.baseUrl,
      { params }
    );
  }

  findById(id: string): Observable<SubCategory> {
    return this.http.get<SubCategory>(
      `${this.baseUrl}/${encodeURIComponent(id)}`
    );
  }

  create(
    payload: SubCategoryPayload
  ): Observable<unknown> {
    return this.http.post<unknown>(
      this.baseUrl,
      payload
    );
  }

  update(
    id: string,
    payload: SubCategoryPayload
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