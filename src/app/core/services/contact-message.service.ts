import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { MessageResponse } from '../models/common.model';
import { PageResponse } from '../models/page-response.model';
import {
  AdminContactMessageQuery,
  ContactMessage,
  ContactMessageCreatePayload,
  ContactMessageStatusRequest,
  MessageStatus
} from '../models/contact-message.model';

import { buildHttpParams } from '../http/query-params';

@Injectable({
  providedIn: 'root'
})
export class ContactMessageService {
  private readonly http = inject(HttpClient);

  private readonly publicUrl =
    `${environment.apiUrl}/contact-messages`;

  private readonly adminUrl =
    `${environment.apiUrl}/admin/contact-messages`;

  // ----------------------------------------------------------
  // Public
  // ----------------------------------------------------------

  createContactMessage(
    payload: ContactMessageCreatePayload
  ): Observable<ContactMessage> {
    return this.http.post<ContactMessage>(
      this.publicUrl,
      payload
    );
  }

  // ----------------------------------------------------------
  // Admin
  // ----------------------------------------------------------

  getAdminContactMessages(
    query: AdminContactMessageQuery = {}
  ): Observable<PageResponse<ContactMessage>> {
    return this.http.get<PageResponse<ContactMessage>>(
      this.adminUrl,
      {
        params: buildHttpParams(query)
      }
    );
  }

  getAdminContactMessage(
    id: string
  ): Observable<ContactMessage> {
    return this.http.get<ContactMessage>(
      `${this.adminUrl}/${id}`
    );
  }

  updateContactMessageStatus(
    id: string,
    status: MessageStatus
  ): Observable<ContactMessage> {
    const payload: ContactMessageStatusRequest = { status };

    return this.http.patch<ContactMessage>(
      `${this.adminUrl}/${id}/status`,
      payload
    );
  }

  deleteContactMessage(
    id: string
  ): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.adminUrl}/${id}`
    );
  }
}
