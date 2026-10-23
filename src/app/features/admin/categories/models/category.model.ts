import {
  DeletionFilter
} from '../../../../core/models/page-response.model';

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface CategoryPayload {
  name: string;
  description: string;
}

export interface CategoryQuery {
  search: string;
  deletion: DeletionFilter;
  page: number;
  size: number;
}