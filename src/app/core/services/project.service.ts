import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { MessageResponse } from '../models/common.model';
import { PageResponse } from '../models/page-response.model';
import {
  AdminProjectQuery,
  ProjectAdmin,
  ProjectAdminRequest,
  ProjectPublic,
  PublicProjectQuery
} from '../models/project.model';

import { buildHttpParams } from '../http/query-params';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly http = inject(HttpClient);

  private readonly publicUrl = `${environment.apiUrl}/projects`;
  private readonly adminUrl = `${environment.apiUrl}/admin/projects`;

  // ----------------------------------------------------------
  // Public
  // ----------------------------------------------------------

  getPublicProjects(
    query: PublicProjectQuery = {}
  ): Observable<PageResponse<ProjectPublic>> {
    return this.http.get<PageResponse<ProjectPublic>>(
      this.publicUrl,
      {
        params: buildHttpParams(query)
      }
    );
  }

  getPublicProject(
    slug: string
  ): Observable<ProjectPublic> {
    return this.http.get<ProjectPublic>(
      `${this.publicUrl}/${slug}`
    );
  }

  getTopPublicProjects(
    limit = 5
  ): Observable<ProjectPublic[]> {
    return this.http.get<ProjectPublic[]>(
      `${this.publicUrl}/top`,
      {
        params: buildHttpParams({ limit })
      }
    );
  }

  // ----------------------------------------------------------
  // Admin
  // ----------------------------------------------------------

  getAdminProjects(
    query: AdminProjectQuery = {}
  ): Observable<PageResponse<ProjectAdmin>> {
    return this.http.get<PageResponse<ProjectAdmin>>(
      this.adminUrl,
      {
        params: buildHttpParams(query)
      }
    );
  }

  getAdminProject(id: string): Observable<ProjectAdmin> {
    return this.http.get<ProjectAdmin>(
      `${this.adminUrl}/${id}`
    );
  }

  getNextProjectPosition(): Observable<number> {
    return this.http.get<number>(
      `${this.adminUrl}/next-position`
    );
  }

  createProject(
    payload: ProjectAdminRequest
  ): Observable<ProjectAdmin> {
    return this.http.post<ProjectAdmin>(
      this.adminUrl,
      payload
    );
  }

  updateProject(
    id: string,
    payload: ProjectAdminRequest
  ): Observable<ProjectAdmin> {
    return this.http.put<ProjectAdmin>(
      `${this.adminUrl}/${id}`,
      payload
    );
  }

  deleteProject(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.adminUrl}/${id}`
    );
  }
}
