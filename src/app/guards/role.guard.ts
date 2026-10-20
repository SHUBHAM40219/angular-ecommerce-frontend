import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const allowedRoles = route.data['roles'] as string[] | undefined;
    const user = this.authService.getCurrentUser();
    const userRole = (user?.role || '').toUpperCase();

    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    if (user && allowedRoles.some(role => role.toUpperCase() === userRole)) {
      return true;
    }

    return this.router.createUrlTree(['/products']);
  }
}
