import { LocalizedText } from './common.model';

export interface ServiceOfferAdminRequest {
  name: LocalizedText;
  description: LocalizedText;
  image: string | null;
  position: number;
}

export interface ServiceOfferAdmin {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  image: string | null;
  imageUrl?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOfferPublic {
  id: string;
  name: string;
  description: string;
  image: string | null;
  imageUrl?: string | null;
  position: number;
}
