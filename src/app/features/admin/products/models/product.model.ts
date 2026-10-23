import {
  DeletionFilter
} from '../../../../core/models/page-response.model';

export type ProductStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'DELETED';

export type ProductSort =
  | 'price_asc'
  | 'price_desc'
  | 'oldest'
  | 'newest';

export interface ProductMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  position: number;
}

export interface AdminProduct {
  id: string;
  name: string;

  shortDescription?: string | null;
  description?: string | null;

  brand: string | null;
  sku: string;

  originalPrice: number;
  sellingPrice: number;

  // Disponible dans le contexte administrateur si exposé par le DTO.
  purchasePrice?: number;

  stockQuantity: number;
  status: ProductStatus;

  categoryId: string;
  categoryName?: string | null;

  subCategoryId: string;
  subCategoryName?: string | null;

  // Pas supposés présents dans la réponse de liste.
  images?: ProductMedia[];
  video?: ProductMedia | null;
}

export interface ProductQuery {
  categoryId: string | null;
  subCategoryId: string | null;

  search: string;
  brand: string;

  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean | null;

  statuses: ProductStatus[];
  deletion: DeletionFilter;
  sort: ProductSort;

  page: number;
  size: number;
}

export interface ProductPayload {
  name: string;
  shortDescription: string;
  description: string;
  brand: string;
  sku: string;

  purchasePrice: number;
  originalPrice: number;
  sellingPrice: number;

  stockQuantity: number;

  categoryId: string;
  subCategoryId: string;
}

export interface ProductUpdatePayload extends ProductPayload {
  replaceImages: boolean;
  replaceVideo: boolean;
}