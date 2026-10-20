import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private readonly apiUrl = `${environment.apiBaseUrl}/vendor`;

  constructor(private http: HttpClient) {}

  getVendorProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(map(response => response?.data ?? response ?? {}));
  }

  getVendorProducts(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/products`).pipe(map(response => response?.data?.content ?? response?.data ?? []));
  }

  addCategory(categoryName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, { categoryName });
  }

  addProduct(payload: any, imageFile?: File | null): Observable<any> {
    const formData = new FormData();
    const productPayload = {
      categoryId: Number(payload.categoryId),
      sku: payload.sku?.trim(),
      name: payload.name?.trim(),
      description: payload.description?.trim(),
      unitPrice: Number(payload.unitPrice),
      active: Boolean(payload.active),
      unitsInStock: Number(payload.unitsInStock)
    };

    formData.append('product', new Blob([JSON.stringify(productPayload)], { type: 'application/json' }));

    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }

    return this.http.post(`${this.apiUrl}/add-product`, formData);
  }

  updateProduct(productId: number, payload: any, imageFile?: File | null): Observable<any> {
    const formData = new FormData();
    const productPayload = {
      categoryId: Number(payload.categoryId),
      sku: payload.sku?.trim(),
      name: payload.name?.trim(),
      description: payload.description?.trim(),
      unitPrice: Number(payload.unitPrice),
      active: Boolean(payload.active),
      unitsInStock: Number(payload.unitsInStock)
    };

    formData.append('product', new Blob([JSON.stringify(productPayload)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }

    return this.http.put(`${this.apiUrl}/update-product/${productId}`, formData);
  }

  deleteProduct(productId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-product/${productId}`);
  }
}
