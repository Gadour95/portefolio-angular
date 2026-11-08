import { LocalizedText } from './common.model';
import { Technology } from './technology.model';

export interface ProjectAdminRequest {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  role: LocalizedText;
  demoUrl: string | null;
  repoUrl: string | null;
  video: string | null;
  images: string[];
  technologyIds: string[];
  published: boolean;
  featured: boolean;
  position: number;
}

export interface ProjectAdmin {
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  role: LocalizedText;
  demoUrl: string | null;
  repoUrl: string | null;
  video: string | null;
  videoUrl: string | null;
  images: string[];
  imageUrls: string[];
  technologies: Technology[];
  published: boolean;
  featured: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPublic {
  id: string;
  slug: string;
  title: string;
  summary: string;
  role: string;
  demoUrl: string | null;
  repoUrl: string | null;
  video: string | null;
  images: string[];
  technologies: Technology[];
  published: boolean;
  featured: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProjectQuery {
  page?: number;
  size?: number;
  featured?: boolean;
  technologyId?: string;
}

export interface AdminProjectQuery {
  page?: number;
  size?: number;
  published?: boolean;
  featured?: boolean;
  search?: string;
}
