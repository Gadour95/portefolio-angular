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
  Category
} from '../models/category.model';

import {
  AdminCategoryService
} from './admin-category.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryLookupService {
  private readonly api = inject(AdminCategoryService);

  findAll(
    deletion: DeletionFilter
  ): Observable<Category[]> {
    return this.api.findAll({
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
          search: '',
          deletion,
          page: nextPage,
          size: 100
        });
      }),

      reduce(
        (categories, page) => [
          ...categories,
          ...page.content
        ],
        [] as Category[]
      )
    );
  }
}