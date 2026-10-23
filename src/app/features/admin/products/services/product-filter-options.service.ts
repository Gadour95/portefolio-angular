import { Injectable, inject } from '@angular/core';

import {
  EMPTY,
  Observable,
  expand,
  map,
  reduce
} from 'rxjs';

import {
  ProductQuery
} from '../models/product.model';

import {
  AdminProductService
} from './admin-product.service';

export interface ProductFilterOptions {
  brands: string[];
  maxPrice: number;
}

interface FilterAccumulator {
  brands: Set<string>;
  maxPrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductFilterOptionsService {
  private readonly api = inject(AdminProductService);

  load(): Observable<ProductFilterOptions> {
    const query: ProductQuery = {
      categoryId: null,
      subCategoryId: null,
      search: '',
      brand: '',
      minPrice: null,
      maxPrice: null,
      inStock: null,
      statuses: [],
      deletion: 'ALL',
      sort: 'newest',
      page: 0,
      size: 100
    };

    return this.api.findAll(query).pipe(
      expand(page => {
        const nextPage = page.page + 1;

        if (
          page.last ||
          nextPage >= page.totalPages
        ) {
          return EMPTY;
        }

        return this.api.findAll({
          ...query,
          page: nextPage
        });
      }),

      reduce(
        (result, page) => {
          for (const product of page.content) {
            if (
              typeof product.brand === 'string' &&
              product.brand.trim()
            ) {
              result.brands.add(product.brand);
            }

            if (
              typeof product.sellingPrice === 'number' &&
              Number.isFinite(product.sellingPrice)
            ) {
              result.maxPrice = Math.max(
                result.maxPrice,
                product.sellingPrice
              );
            }
          }

          return result;
        },

        {
          brands: new Set<string>(),
          maxPrice: 0
        } as FilterAccumulator
      ),

      map(result => ({
        brands: [...result.brands].sort((a, b) =>
          a.localeCompare(b)
        ),

        maxPrice: Math.max(
          1,
          Math.ceil(result.maxPrice)
        )
      }))
    );
  }
}