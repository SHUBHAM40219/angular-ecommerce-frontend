import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Product } from 'src/app/common/product';
import { ProductCategory, ProductService } from 'src/app/services/product.service';
import { AppUser, AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list-grid.component.html',
  styleUrls: []
})
export class ProductListComponent implements OnInit {

  products: Product[] = [];
  categories: ProductCategory[] = [];
  currentUser: AppUser | null = null;
  searchTerm = '';
  selectedCategoryIds: number[] = [];
  loading = true;
  loadError = '';
  currentPage = 1;
  pageSize = 12;
  totalPages = 0;
  totalElements = 0;
  private allProducts: Product[] = [];

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.route.paramMap.subscribe(params => {
      this.searchTerm = params.get('keyword') || '';
      const categoryId = Number(params.get('id'));
      this.selectedCategoryIds = categoryId ? [categoryId] : [];
      this.currentPage = 1;
      this.loadProducts();
    });
  }

  get isAdmin(): boolean {
    return this.currentUser?.role.toUpperCase() === 'ADMIN';
  }

  get isVendor(): boolean {
    return this.currentUser?.role.toUpperCase() === 'VENDOR';
  }

  loadProducts() {
    this.loading = true;
    this.loadError = '';
    forkJoin({
      products: this.productService.getCatalogProducts(),
      categories: this.productService.getProductCategories()
    }).subscribe({
      next: result => {
        this.allProducts = result.products;
        this.categories = result.categories;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Products could not be loaded. Please try again.';
        this.products = [];
        this.loading = false;
      }
    });
  }

  applyFilters() {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    const selectedCategories = new Set(this.selectedCategoryIds);
    const filtered = this.allProducts.filter(product => {
      const categoryId = product.categoryId || 0;
      const matchesCategory = selectedCategories.size === 0 || selectedCategories.has(categoryId);
      const searchableText = `${product.name} ${product.description} ${product.sku}`.toLocaleLowerCase();
      return matchesCategory && (!query || searchableText.includes(query));
    });

    this.totalElements = filtered.length;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    const start = (this.currentPage - 1) * this.pageSize;
    this.products = filtered.slice(start, start + this.pageSize);
  }

  toggleCategory(categoryId: number) {
    this.selectedCategoryIds = this.selectedCategoryIds.includes(categoryId)
      ? this.selectedCategoryIds.filter(id => id !== categoryId)
      : [...this.selectedCategoryIds, categoryId];
    this.currentPage = 1;
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategoryIds = [];
    this.currentPage = 1;
    this.applyFilters();
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  changePage(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      return;
    }

    this.currentPage = pageNumber;
    this.applyFilters();
  }

  previousPage() {
    this.changePage(this.currentPage - 1);
  }

  nextPage() {
    this.changePage(this.currentPage + 1);
  }
}
