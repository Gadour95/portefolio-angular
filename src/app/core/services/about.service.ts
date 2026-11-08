import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  AboutAdmin,
  AboutAdminRequest,
  AboutPublic
} from '../models/about.model';

@Injectable({
  providedIn: 'root'
})
export class AboutService {
  private readonly http = inject(HttpClient);

  private readonly publicUrl = `${environment.apiUrl}/about`;
  private readonly adminUrl = `${environment.apiUrl}/admin/about`;

  getPublicAbout(): Observable<AboutPublic> {
    return this.http.get<AboutPublic>(this.publicUrl);
  }

  getAdminAbout(): Observable<AboutAdmin> {
    return this.http.get<AboutAdmin>(this.adminUrl);
  }

  upsertAdminAbout(
    payload: AboutAdminRequest
  ): Observable<AboutAdmin> {
    return this.http.put<AboutAdmin>(this.adminUrl, payload);
  }
}
