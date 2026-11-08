import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { MessageResponse } from '../models/common.model';
import {
  Skill,
  SkillCategory,
  SkillCategoryPublic,
  SkillCategoryRequest,
  SkillRequest
} from '../models/skill.model';

@Injectable({
  providedIn: 'root'
})
export class SkillService {
  private readonly http = inject(HttpClient);

  private readonly publicUrl = `${environment.apiUrl}/skills`;
  private readonly adminSkillsUrl =
    `${environment.apiUrl}/admin/skills`;

  private readonly adminCategoriesUrl =
    `${environment.apiUrl}/admin/skill-categories`;

  // ----------------------------------------------------------
  // Public
  // ----------------------------------------------------------

  getPublicSkills(): Observable<SkillCategoryPublic[]> {
    return this.http.get<SkillCategoryPublic[]>(
      this.publicUrl
    );
  }

  // ----------------------------------------------------------
  // Admin — catégories
  // ----------------------------------------------------------

  getAdminSkillCategories(): Observable<SkillCategory[]> {
    return this.http.get<SkillCategory[]>(
      this.adminCategoriesUrl
    );
  }

  getAdminSkillCategory(
    id: string
  ): Observable<SkillCategory> {
    return this.http.get<SkillCategory>(
      `${this.adminCategoriesUrl}/${id}`
    );
  }

  createSkillCategory(
    payload: SkillCategoryRequest
  ): Observable<SkillCategory> {
    return this.http.post<SkillCategory>(
      this.adminCategoriesUrl,
      payload
    );
  }

  updateSkillCategory(
    id: string,
    payload: SkillCategoryRequest
  ): Observable<SkillCategory> {
    return this.http.put<SkillCategory>(
      `${this.adminCategoriesUrl}/${id}`,
      payload
    );
  }

  deleteSkillCategory(
    id: string
  ): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.adminCategoriesUrl}/${id}`
    );
  }

  // ----------------------------------------------------------
  // Admin — compétences
  // ----------------------------------------------------------

  getAdminSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(this.adminSkillsUrl);
  }

  getAdminSkill(id: string): Observable<Skill> {
    return this.http.get<Skill>(
      `${this.adminSkillsUrl}/${id}`
    );
  }

  createSkill(payload: SkillRequest): Observable<Skill> {
    return this.http.post<Skill>(
      this.adminSkillsUrl,
      payload
    );
  }

  updateSkill(
    id: string,
    payload: SkillRequest
  ): Observable<Skill> {
    return this.http.put<Skill>(
      `${this.adminSkillsUrl}/${id}`,
      payload
    );
  }

  deleteSkill(id: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.adminSkillsUrl}/${id}`
    );
  }
}
