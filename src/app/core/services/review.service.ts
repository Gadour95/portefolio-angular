import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { MessageResponse } from '../models/common.model';
import { PageResponse } from '../models/page-response.model';
import {
  AdminReviewQuery,
  Review,
  ReviewCreatePayload,
  ReviewStatus,
  ReviewStatusRequest
} from '../models/review.model';

import { buildHttpParams } from '../http/query-params';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly http = inject(HttpClient);

  private readonly publicUrl = `${environment.apiUrl}/reviews`;
  private readonly adminUrl = `${environment.apiUrl}/admin/reviews`;

  // ----------------------------------------------------------
  // Public
  // ----------------------------------------------------------

  getPublicReviews(
    page = 0,
    size = 12
  ): Observable<PageResponse<Review>> {
    return this.http.get<PageResponse<Review>>(
      this.publicUrl,
      {
        params: buildHttpParams({ page, size })
      }
    );
  }

  getPublicReview(id: string): Observable<Review> {
    return this.http.get<Review>(
      `${this.publicUrl}/${id}`
    );
  }

  /**
   * POST multipart/form-data : partie `request` en JSON,
   * partie `image` optionnelle.
   */
  createReview(
    payload: ReviewCreatePayload,
    image?: File
  ): Observable<Review> {
    const formData = new FormData();

    formData.append(
      'request',
      new Blob([JSON.stringify(payload)], {
        type: 'application/json'
      })
    );

    if (image) {
      formData.append('image', image);
    }

    return this.http.post<Review>(
      this.publicUrl,
      formData
    );
  }

  // ----------------------------------------------------------
  // Admin
  // ----------------------------------------------------------

  getAdminReviews(
    query: AdminReviewQuery = {}
  ): Observable<PageResponse<Review>> {
    return this.http.get<PageResponse<Review>>(
      this.adminUrl,
      {
        params: buildHttpParams(query)
      }
    );
  }

  getAdminReview(id: string): Observable<Review> {
    return this.http.get<Review>(
      `${this.adminUrl}/${id}`
    );
  }

  updateReviewStatus(
    id: string,
    status: ReviewStatus
  ): Observable<Review> {
    const payload: ReviewStatusRequest = { status };

    return this.http.patch<Review>(
      `${this.adminUrl}/${id}/status`,
      payload
    );
  }

  deleteReview(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.adminUrl}/${id}`
    );
  }
}
