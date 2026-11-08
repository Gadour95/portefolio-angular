export type MessageStatus = 'UNREAD' | 'READ';

export interface ContactMessageCreatePayload {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessageStatusRequest {
  status: MessageStatus;
}

export interface AdminContactMessageQuery {
  page?: number;
  size?: number;
  status?: MessageStatus;
  search?: string;
}
