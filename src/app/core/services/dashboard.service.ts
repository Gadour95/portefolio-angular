import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  DashboardCharts,
  DashboardOverview,
  DashboardRecentActivity,
  DashboardStats
} from '../models/dashboard.model';

import { buildHttpParams } from '../http/query-params';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);

  private readonly url =
    `${environment.apiUrl}/admin/dashboard`;

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(
      `${this.url}/stats`
    );
  }

  getCharts(months = 6): Observable<DashboardCharts> {
    return this.http.get<DashboardCharts>(
      `${this.url}/charts`,
      {
        params: buildHttpParams({ months })
      }
    );
  }

  getRecentActivity(
    limit = 5
  ): Observable<DashboardRecentActivity> {
    return this.http.get<DashboardRecentActivity>(
      `${this.url}/recent-activity`,
      {
        params: buildHttpParams({ limit })
      }
    );
  }

  getOverview(
    months = 6,
    recentLimit = 5
  ): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(
      `${this.url}/overview`,
      {
        params: buildHttpParams({ months, recentLimit })
      }
    );
  }
}
