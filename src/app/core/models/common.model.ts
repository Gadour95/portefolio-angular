export type AppLang = 'fr' | 'en' | 'ar';

export interface LocalizedText {
  fr: string;
  en: string;
  ar: string;
}

export interface MessageResponse {
  message: string;
}

export interface MediaResponse {
  path: string;
  url: string;
}
