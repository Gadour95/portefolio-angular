import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { AppLang, MessageResponse } from '../models/common.model';
import { CvAdmin, CvPublic } from '../models/cv.model';

@Injectable({
  providedIn: 'root'
})
export class CvService {
  private readonly http = inject(HttpClient);

  private readonly publicUrl = `${environment.apiUrl}/cvs`;
  private readonly adminUrl = `${environment.apiUrl}/admin/cvs`;

  getPublicCvs(): Observable<CvPublic[]> {
    return this.http.get<CvPublic[]>(this.publicUrl);
  }

  getAdminCvs(): Observable<CvAdmin[]> {
    return this.http.get<CvAdmin[]>(this.adminUrl);
  }

  uploadCv(locale: AppLang, file: File): Observable<CvAdmin> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<CvAdmin>(
      `${this.adminUrl}/${locale}`,
      formData
    );
  }

  deleteCv(locale: AppLang): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.adminUrl}/${locale}`
    );
  }

  downloadUrl(locale: AppLang): string {
    return `${this.publicUrl}/${locale}/download`;
  }
}
