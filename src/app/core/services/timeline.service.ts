import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { MessageResponse } from '../models/common.model';
import {
  TimelineItem,
  TimelineItemRequest,
  TimelinePublicItem
} from '../models/timeline.model';

@Injectable({
  providedIn: 'root'
})
export class TimelineService {
  private readonly http = inject(HttpClient);

  private readonly publicUrl = `${environment.apiUrl}/timeline`;
  private readonly adminUrl = `${environment.apiUrl}/admin/timeline`;

  getPublicTimeline(): Observable<TimelinePublicItem[]> {
    return this.http.get<TimelinePublicItem[]>(this.publicUrl);
  }

  getAdminTimeline(): Observable<TimelineItem[]> {
    return this.http.get<TimelineItem[]>(this.adminUrl);
  }

  getAdminTimelineItem(id: string): Observable<TimelineItem> {
    return this.http.get<TimelineItem>(
      `${this.adminUrl}/${id}`
    );
  }

  createTimelineItem(
    payload: TimelineItemRequest
  ): Observable<TimelineItem> {
    return this.http.post<TimelineItem>(
      this.adminUrl,
      payload
    );
  }

  updateTimelineItem(
    id: string,
    payload: TimelineItemRequest
  ): Observable<TimelineItem> {
    return this.http.put<TimelineItem>(
      `${this.adminUrl}/${id}`,
      payload
    );
  }

  deleteTimelineItem(
    id: string
  ): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.adminUrl}/${id}`
    );
  }
}
