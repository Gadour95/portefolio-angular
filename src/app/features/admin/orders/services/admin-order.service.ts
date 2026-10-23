import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';

import {
  environment
} from '../../../../../environments/environment';

import {
  PageResponse
} from '../../../../core/models/page-response.model';

import {
  AdminOrder,
  OrderQuery,
  OrderStatus,
  parseAdminOrder
} from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiUrl}/api/admin/orders`;

  findAll(
    query: OrderQuery
  ): Observable<PageResponse<AdminOrder>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('size', query.size);

    const search = query.search.trim();

    if (search) {
      params = params.set('search', search);
    }

    if (query.statuses.length > 0) {
      params = params.set(
        'statuses',
        query.statuses.join(',')
      );
    }

    return this.http.get<PageResponse<unknown>>(
      this.baseUrl,
      { params }
    ).pipe(
      map(page => ({
        ...page,
        content: page.content.map(parseAdminOrder)
      }))
    );
  }

  findById(id: string): Observable<AdminOrder> {
    return this.http.get<unknown>(
      `${this.baseUrl}/${encodeURIComponent(id)}`
    ).pipe(
      map(parseAdminOrder)
    );
  }

  findPaymentProof(id: string): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/${encodeURIComponent(id)}/payment-proof`,
      {
        responseType: 'blob'
      }
    );
  }


  approve(id: string): Observable<unknown> {
  return this.http.post<unknown>(
    `${this.orderUrl(id)}/approve`,
    null
  );
}

reject(id: string): Observable<unknown> {
  return this.http.post<unknown>(
    `${this.orderUrl(id)}/reject`,
    null
  );
}

ship(id: string): Observable<unknown> {
  return this.http.post<unknown>(
    `${this.orderUrl(id)}/ship`,
    null
  );
}

deliver(id: string): Observable<unknown> {
  return this.http.post<unknown>(
    `${this.orderUrl(id)}/deliver`,
    null
  );
}

changeStatus(
  id: string,
  status: OrderStatus
): Observable<unknown> {
  return this.http.patch<unknown>(
    `${this.orderUrl(id)}/status`,
    null,
    {
      params: new HttpParams().set('status', status)
    }
  );
}

private orderUrl(id: string): string {
  return `${this.baseUrl}/${encodeURIComponent(id)}`;
}

archive(id: string): Observable<unknown> {
  return this.http.delete<unknown>(
    this.orderUrl(id)
  );
}

}