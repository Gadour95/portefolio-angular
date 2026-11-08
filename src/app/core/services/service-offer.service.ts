import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { MessageResponse } from '../models/common.model';
import {
  ServiceOfferAdmin,
  ServiceOfferAdminRequest,
  ServiceOfferPublic
} from '../models/service-offer.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceOfferService {
  private readonly http = inject(HttpClient);

  private readonly publicUrl = `${environment.apiUrl}/services`;
  private readonly adminUrl = `${environment.apiUrl}/admin/services`;

  getPublicServices(): Observable<ServiceOfferPublic[]> {
    return this.http.get<ServiceOfferPublic[]>(
      this.publicUrl
    );
  }

  getAdminServices(): Observable<ServiceOfferAdmin[]> {
    return this.http.get<ServiceOfferAdmin[]>(
      this.adminUrl
    );
  }

  getAdminService(
    id: string
  ): Observable<ServiceOfferAdmin> {
    return this.http.get<ServiceOfferAdmin>(
      `${this.adminUrl}/${id}`
    );
  }

  createService(
    payload: ServiceOfferAdminRequest
  ): Observable<ServiceOfferAdmin> {
    return this.http.post<ServiceOfferAdmin>(
      this.adminUrl,
      payload
    );
  }

  updateService(
    id: string,
    payload: ServiceOfferAdminRequest
  ): Observable<ServiceOfferAdmin> {
    return this.http.put<ServiceOfferAdmin>(
      `${this.adminUrl}/${id}`,
      payload
    );
  }

  deleteService(
    id: string
  ): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.adminUrl}/${id}`
    );
  }
}
