import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { MessageResponse } from '../models/common.model';
import {
  Technology,
  TechnologyRequest
} from '../models/technology.model';

@Injectable({
  providedIn: 'root'
})
export class TechnologyService {
  private readonly http = inject(HttpClient);

  private readonly publicUrl = `${environment.apiUrl}/technologies`;
  private readonly adminUrl = `${environment.apiUrl}/admin/technologies`;

  getPublicTechnologies(): Observable<Technology[]> {
    return this.http.get<Technology[]>(this.publicUrl);
  }

  getAdminTechnologies(): Observable<Technology[]> {
    return this.http.get<Technology[]>(this.adminUrl);
  }

  getAdminTechnology(id: string): Observable<Technology> {
    return this.http.get<Technology>(
      `${this.adminUrl}/${id}`
    );
  }

  createTechnology(
    payload: TechnologyRequest
  ): Observable<Technology> {
    return this.http.post<Technology>(
      this.adminUrl,
      payload
    );
  }

  updateTechnology(
    id: string,
    payload: TechnologyRequest
  ): Observable<Technology> {
    return this.http.put<Technology>(
      `${this.adminUrl}/${id}`,
      payload
    );
  }

  deleteTechnology(
    id: string
  ): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.adminUrl}/${id}`
    );
  }
}
