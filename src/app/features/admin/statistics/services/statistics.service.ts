import { Injectable, inject } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';

import {
  environment
} from '../../../../../environments/environment';

import {
  SalesKpis,
  parseSalesKpis
} from '../models/statistics.model';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    `${environment.apiUrl}/api/admin/statistics`;

  getSalesKpis(): Observable<SalesKpis> {
    return this.http.get<unknown>(
      `${this.baseUrl}/sales`
    ).pipe(
      map(parseSalesKpis)
    );
  }
}