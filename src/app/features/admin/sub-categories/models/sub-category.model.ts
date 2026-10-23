import {
  DeletionFilter
} from '../../../../core/models/page-response.model';

export interface SubCategory {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;

  // Facultatif : l’interface fonctionne aussi sans ce champ.
  categoryName?: string | null;
}

export interface SubCategoryPayload {
  name: string;
  description: string;
  categoryId: string;
}

export interface SubCategoryQuery {
  categoryId: string | null;
  search: string;
  deletion: DeletionFilter;
  page: number;
  size: number;
}