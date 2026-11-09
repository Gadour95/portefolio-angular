import { AppLang } from './common.model';

export interface CvAdmin {
  id: string;
  locale: AppLang;
  filePath: string;
  url: string;
  filename: string;
  fileSize: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CvPublic {
  locale: AppLang;
  url: string;
  filename: string;
  fileSize: number | null;
  updatedAt: string;
}
