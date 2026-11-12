import { LocalizedText } from './common.model';

export interface AboutLink {
  image: string | null;
  text: string;
  url: string;
}

export interface AboutLinkPublic {
  imageUrl: string | null;
  text: string;
  url: string;
}

export interface AboutPublic {
  description: string;
  location: string;
  availability: string;
  email: string;
  phones: string[];
  links: AboutLinkPublic[];
}

export interface AboutAdminRequest {
  description: LocalizedText;
  location: LocalizedText;
  availability: LocalizedText;
  email: string;
  phones: string[];
  links: AboutLink[];
}

export interface AboutAdmin extends AboutAdminRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
}
