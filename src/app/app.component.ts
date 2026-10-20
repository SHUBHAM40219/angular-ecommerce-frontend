import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AppUser, AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Shoppy';
  currentUser: AppUser | null = null;
  profileMenuOpen = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get displayName(): string {
    return this.currentUser?.name || this.currentUser?.email || 'User';
  }

  get displayInitials(): string {
    const value = this.displayName.trim();
    if (!value) {
      return 'U';
    }

    return value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('') || 'U';
  }

  get roleLabel(): string {
    const role = (this.currentUser?.role || '').toUpperCase();
    return role === 'ADMIN' ? 'Admin' : role === 'VENDOR' ? 'Vendor' : 'Customer';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInsideMenu = !!target.closest('.profile-menu-wrapper');

    if (!clickedInsideMenu) {
      this.profileMenuOpen = false;
    }
  }

  toggleProfileMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  navigateToProfile(): void {
    const role = (this.currentUser?.role || '').toUpperCase();
    this.profileMenuOpen = false;

    if (role === 'ADMIN') {
      this.router.navigateByUrl('/admin');
    } else if (role === 'VENDOR') {
      this.router.navigateByUrl('/vendor');
    } else {
      this.router.navigateByUrl('/customer');
    }
  }

  logout(): void {
    this.authService.logout();
    this.profileMenuOpen = false;
    this.router.navigateByUrl('/products');
  }
}
