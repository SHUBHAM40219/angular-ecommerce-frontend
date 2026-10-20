import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('authToken');
    const isApiRequest = request.url.startsWith('http://localhost:8080/api/');

    if (!token || !isApiRequest || request.url.includes('/api/auth/')) {
      return next.handle(request);
    }

    return next.handle(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
}
