import { Injectable, inject } from '@angular/core';

import {
  EMPTY,
  Observable,
  expand,
  reduce
} from 'rxjs';

import {
  DeletionFilter
} from '../../../../core/models/page-response.model';

import {
  SubCategory
} from '../models/sub-category.model';

import {
  AdminSubCategoryService
} from './admin-sub-category.service';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryLookupService {
  private readonly api = inject(AdminSubCategoryService);

  findByCategory(
    categoryId: string
  ): Observable<SubCategory[]> {
    return this.load(categoryId, 'ALL');
  }

  findActiveByCategory(
    categoryId: string
  ): Observable<SubCategory[]> {
    return this.load(categoryId, 'ACTIVE');
  }

  private load(
    categoryId: string,
    deletion: DeletionFilter
  ): Observable<SubCategory[]> {
    return this.api.findAll({
      categoryId,
      search: '',
      deletion,
      page: 0,
      size: 100
    }).pipe(
      expand(page => {
        const nextPage = page.page + 1;

        if (
          page.last ||
          nextPage >= page.totalPages
        ) {
          return EMPTY;
        }

        return this.api.findAll({
          categoryId,
          search: '',
          deletion,
          page: nextPage,
          size: 100
        });
      }),

      reduce(
        (items, page) => [
          ...items,
          ...page.content
        ],
        [] as SubCategory[]
      )
    );
  }
}