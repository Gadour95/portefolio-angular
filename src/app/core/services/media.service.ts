import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { MediaResponse } from '../models/common.model';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private readonly http = inject(HttpClient);

  private readonly imagesUrl =
    `${environment.apiUrl}/admin/media/images`;

  private readonly videosUrl =
    `${environment.apiUrl}/admin/media/videos`;

  /**
   * Upload d'une ou plusieurs images (projets, technologies, services, etc.).
   * Formats : JPG, JPEG, PNG, WEBP, AVIF, GIF, SVG — max 10 Mo par image.
   */
  uploadImages(
    files: File[]
  ): Observable<MediaResponse[]> {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('files', file);
    });

    return this.http.post<MediaResponse[]>(
      this.imagesUrl,
      formData
    );
  }

  /**
   * Upload d'une vidéo de projet.
   * Formats : MP4, WEBM, OGG, MOV — max 50 Mo.
   */
  uploadVideo(file: File): Observable<MediaResponse> {
    const formData = new FormData();

    formData.append('file', file);

    return this.http.post<MediaResponse>(
      this.videosUrl,
      formData
    );
  }
}
