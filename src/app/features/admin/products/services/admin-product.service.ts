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
  AdminProduct,
  ProductMedia,
  ProductPayload,
  ProductQuery,
  ProductUpdatePayload
} from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class AdminProductService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiUrl}/api/admin/products`;

  findAll(
    query: ProductQuery
  ): Observable<PageResponse<AdminProduct>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size)
      .set('deletion', query.deletion)
      .set('sort', query.sort);

    if (query.categoryId) {
      params = params.set('categoryId', query.categoryId);
    }

    if (query.subCategoryId) {
      params = params.set(
        'subCategoryId',
        query.subCategoryId
      );
    }

    if (query.search.trim()) {
      params = params.set('search', query.search.trim());
    }

    if (query.brand.trim()) {
      params = params.set('brand', query.brand.trim());
    }

    if (query.minPrice !== null) {
      params = params.set('minPrice', query.minPrice);
    }

    if (query.maxPrice !== null) {
      params = params.set('maxPrice', query.maxPrice);
    }

    if (query.inStock !== null) {
      params = params.set('inStock', query.inStock);
    }

    if (query.statuses.length > 0) {
      params = params.set(
        'statuses',
        query.statuses.join(',')
      );
    }

    return this.http.get<PageResponse<AdminProduct>>(
      this.baseUrl,
      { params }
    );
  }

  findById(id: string): Observable<AdminProduct> {
    return this.http.get<AdminProduct>(
      this.productUrl(id)
    );
  }

  publish(id: string): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.productUrl(id)}/publish`,
      null
    );
  }

  unpublish(id: string): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.productUrl(id)}/unpublish`,
      null
    );
  }

  delete(id: string): Observable<unknown> {
    return this.http.delete<unknown>(
      this.productUrl(id)
    );
  }

  private productUrl(id: string): string {
    return `${this.baseUrl}/${encodeURIComponent(id)}`;
  }

  createWithMedia(
  payload: ProductPayload,
  images: readonly File[],
  video: File | null
): Observable<unknown> {
  return this.http.post<unknown>(
    this.baseUrl,
    this.buildMultipart(payload, images, video)
  );
}

updateWithMedia(
  id: string,
  payload: ProductUpdatePayload,
  images: readonly File[],
  video: File | null
): Observable<unknown> {
  return this.http.put<unknown>(
    this.productUrl(id),
    this.buildMultipart(payload, images, video)
  );
}

findImages(id: string): Observable<ProductMedia[]> {
  return this.http.get<ProductMedia[]>(
    `${this.productUrl(id)}/images`
  );
}

findVideo(id: string): Observable<ProductMedia> {
  return this.http.get<ProductMedia>(
    `${this.productUrl(id)}/video`
  );
}

private buildMultipart(
  payload: ProductPayload | ProductUpdatePayload,
  images: readonly File[],
  video: File | null
): FormData {
  const body = new FormData();

  body.append('product', JSON.stringify(payload));

  for (const image of images) {
    body.append('images', image, image.name);
  }

  if (video) {
    body.append('video', video, video.name);
  }

  return body;
}

}