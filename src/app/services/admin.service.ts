import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  private normalizeList(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.content)) {
      return response.content;
    }

    return [];
  }

  getVendors(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/vendors`).pipe(map(response => this.normalizeList(response)));
  }

  getPendingVendors(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/vendors/pending`).pipe(map(response => this.normalizeList(response)));
  }

  getApprovedVendors(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/vendors/approved`).pipe(map(response => this.normalizeList(response)));
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`).pipe(map(response => response?.data ?? response ?? {}));
  }

  getProducts(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/products`).pipe(map(response => this.normalizeList(response)));
  }

  approveVendor(vendorId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/approve-vendor/${vendorId}`, {});
  }

  rejectVendor(vendorId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/reject-vendor/${vendorId}`, {});
  }
}
