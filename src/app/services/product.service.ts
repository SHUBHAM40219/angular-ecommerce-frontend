import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../common/product';
import { EMPTY, Observable } from 'rxjs';
import { expand, map, reduce } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ProductCategory {
  id: number;
  categoryName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private httpClient: HttpClient) { }

  getAllProducts(page: number = 0, pageSize: number = 20): Observable<GetResponseProducts> {
    const url = `${this.apiUrl}/products/public/all?page=${page}&size=${pageSize}`;
    return this.httpClient.get<any>(url).pipe(map(response => this.parsePageResponse(response)));
  }

  getCatalogProducts(pageSize: number = 100): Observable<Product[]> {
    return this.getAllProducts(0, pageSize).pipe(
      expand(response => response.page.number + 1 < response.page.totalPages
        ? this.getAllProducts(response.page.number + 1, pageSize)
        : EMPTY),
      map(response => response._embedded?.products ?? []),
      reduce((products, pageProducts) => products.concat(pageProducts), [] as Product[])
    );
  }

  getProductList(theCategoryId: number, page: number = 0, pageSize: number = 5): Observable<GetResponseProducts> {
    const url = `${this.apiUrl}/products/public/category/${theCategoryId}?page=${page}&size=${pageSize}`;
    return this.httpClient.get<any>(url).pipe(map(response => this.parsePageResponse(response)));
  }

  searchProducts(theKeyword: string, page: number = 0, pageSize: number = 5): Observable<GetResponseProducts> {
    const url = `${this.apiUrl}/products/public/search?name=${encodeURIComponent(theKeyword)}&page=${page}&size=${pageSize}`;
    return this.httpClient.get<any>(url).pipe(map(response => this.parsePageResponse(response)));
  }

  getProduct(theProductId: number): Observable<Product> {
    const url = `${this.apiUrl}/products/public/${theProductId}`;
    return this.httpClient.get<any>(url).pipe(
      map(response => this.mapProduct(this.extractData(response)))
    );
  }

  getProductCategories(): Observable<ProductCategory[]> {
    const url = `${this.apiUrl}/products/categories`;
    return this.httpClient.get<any>(url).pipe(
      map(response => {
        const categories = this.extractData(response);
        const list = Array.isArray(categories)
          ? categories
          : (Array.isArray(categories?.content)
            ? categories.content
            : (Array.isArray(categories?.categories)
              ? categories.categories
              : (Array.isArray(categories?.items)
                ? categories.items
                : [])));

        return list.map((category: any) => ({
          id: Number(category.id ?? category.categoryId ?? category.category_id ?? 0),
          categoryName: category.categoryName ?? category.name ?? 'Uncategorized'
        }));
      })
    );
  }

  resolveImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl || /^(https?:|data:)/i.test(imageUrl)) {
      return imageUrl || '';
    }

    const apiOrigin = this.apiUrl.replace(/\/api\/?$/, '');
    return `${apiOrigin}/${imageUrl.replace(/^\/+/, '')}`;
  }

  private parsePageResponse(response: any): GetResponseProducts {
    const payload = this.extractData(response);
    const page = payload && typeof payload === 'object' && 'content' in payload ? payload : {
      content: Array.isArray(payload) ? payload : [],
      size: Array.isArray(payload) ? payload.length : 0,
      totalElements: Array.isArray(payload) ? payload.length : 0,
      totalPages: 1,
      number: 0
    };

    const halProducts = payload?._embedded?.products;
    const items = Array.isArray(page.content)
      ? page.content
      : (Array.isArray(halProducts) ? halProducts : []);
    const pageInfo = payload?.page ?? page;

    return {
      _embedded: {
        products: items.map((product: any) => this.mapProduct(product))
      },
      page: {
        size: Number(pageInfo.size ?? items.length),
        totalElements: Number(pageInfo.totalElements ?? items.length),
        totalPages: Number(pageInfo.totalPages ?? 1),
        number: Number(pageInfo.number ?? 0)
      }
    };
  }

  private extractData(response: any): any {
    return response?.data ?? response;
  }

  private mapProduct(product: any): Product {
    if (!product) {
      return new Product(0, '', '', '', 0, '', true, 0, new Date(), new Date());
    }

    return {
      id: Number(product.id),
      sku: product.sku || '',
      name: product.name || '',
      description: product.description || '',
      unitPrice: Number(product.unitPrice ?? product.unitprice ?? product.unit_price ?? 0),
      imageUrl: this.resolveImageUrl(product.imageUrl || product.image_url || ''),
      active: Boolean(product.active),
      unitsInStock: Number(product.unitsInStock ?? product.units_in_stock ?? 0),
      dateCreated: product.dateCreated ? new Date(product.dateCreated) : new Date(),
      lastUpdated: product.lastUpdated ? new Date(product.lastUpdated) : new Date(),
      categoryId: Number(product.categoryId ?? product.category_id ?? product.category?.id ?? 0) || undefined,
      categoryName: product.categoryName ?? product.category_name ?? product.category?.categoryName ?? ''
    } as Product;
  }
}

interface GetResponseProducts {
  _embedded?: {
    products: Product[];
  },
  page: {
    size: number,
    totalElements: number,
    totalPages: number,
    number: number
  }
}
