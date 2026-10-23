import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import {
  environment
} from '../../../../../environments/environment';

import {
  ProductMedia
} from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class AdminProductMediaService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiUrl}/api/admin/products`;

  // À faire correspondre au @RequestParam du contrôleur vidéo.
  private readonly videoFieldName = 'video';

  findImages(productId: string): Observable<ProductMedia[]> {
    return this.http.get<ProductMedia[]>(
      `${this.productUrl(productId)}/images`
    );
  }

  findVideo(productId: string): Observable<ProductMedia> {
    return this.http.get<ProductMedia>(
      `${this.productUrl(productId)}/video`
    );
  }

  addImages(
    productId: string,
    images: readonly File[]
  ): Observable<unknown> {
    const body = new FormData();

    for (const image of images) {
      body.append('images', image, image.name);
    }

    return this.http.post<unknown>(
      `${this.productUrl(productId)}/images`,
      body
    );
  }

  addVideo(
    productId: string,
    video: File
  ): Observable<unknown> {
    return this.http.post<unknown>(
      `${this.productUrl(productId)}/video`,
      this.videoBody(video)
    );
  }

  replaceVideo(
    productId: string,
    video: File
  ): Observable<unknown> {
    return this.http.put<unknown>(
      `${this.productUrl(productId)}/video`,
      this.videoBody(video)
    );
  }

  reorderImages(
    productId: string,
    imageIds: readonly string[]
  ): Observable<unknown> {
    return this.http.patch<unknown>(
      `${this.productUrl(productId)}/images/order`,
      { imageIds }
    );
  }

  deleteMedia(
    productId: string,
    mediaId: string
  ): Observable<unknown> {
    return this.http.delete<unknown>(
      `${this.productUrl(productId)}/media/${encodeURIComponent(mediaId)}`
    );
  }

  private videoBody(video: File): FormData {
    const body = new FormData();

    body.append(
      this.videoFieldName,
      video,
      video.name
    );

    return body;
  }

  private productUrl(productId: string): string {
    return `${this.baseUrl}/${encodeURIComponent(productId)}`;
  }
}