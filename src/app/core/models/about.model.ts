import { LocalizedText } from './common.model';

export interface AboutPublic {
  description: string;
  location: string;
  availability: string;
  email: string;
}

export interface AboutAdminRequest {
  description: LocalizedText;
  location: LocalizedText;
  availability: LocalizedText;
  email: string;
}

export interface AboutAdmin extends AboutAdminRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
}
