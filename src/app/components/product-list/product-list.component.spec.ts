import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { ProductListComponent } from './product-list.component';
import { ProductService } from 'src/app/services/product.service';
import { AuthService } from 'src/app/services/auth.service';
import { Product } from 'src/app/common/product';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productService: jasmine.SpyObj<ProductService>;
  let authService: jasmine.SpyObj<AuthService>;
  const products: Product[] = [
    Object.assign(new Product(1, 'CAM-1', 'Camera', 'Compact camera', 99, '', true, 4, new Date(), new Date()), { categoryId: 7, categoryName: 'Tech' }),
    Object.assign(new Product(2, 'LENS-1', 'Lens', 'Camera lens', 49, '', true, 5, new Date(), new Date()), { categoryId: 12, categoryName: 'Accessories' }),
    Object.assign(new Product(3, 'BOOK-1', 'Field Notes', 'A lined notebook', 12, '', true, 8, new Date(), new Date()), { categoryId: 7, categoryName: 'Tech' })
  ];

  beforeEach(async(() => {
    productService = jasmine.createSpyObj('ProductService', ['getCatalogProducts', 'getProductCategories']);
    productService.getCatalogProducts.and.returnValue(of(products));
    productService.getProductCategories.and.returnValue(of([
      { id: 7, categoryName: 'Books' },
      { id: 12, categoryName: 'Games' }
    ]));
    authService = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authService.getCurrentUser.and.returnValue(null);

    TestBed.configureTestingModule({
      declarations: [ProductListComponent],
      imports: [CommonModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: ProductService, useValue: productService },
        { provide: AuthService, useValue: authService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({})),
            snapshot: {
              paramMap: {
                has: () => false,
                get: () => null
              }
            }
          }
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all products when no filters are selected', () => {
    expect(component.products.length).toBe(3);
    expect(productService.getCatalogProducts).toHaveBeenCalled();
  });

  it('matches exact and partial text case-insensitively', () => {
    component.searchTerm = 'camera';
    component.applyFilters();

    expect(component.products.map(product => product.id)).toEqual([1, 2]);
  });

  it('combines multiple selected categories with search', () => {
    component.selectedCategoryIds = [7, 12];
    component.searchTerm = 'lens';
    component.applyFilters();

    expect(component.products.map(product => product.id)).toEqual([2]);
  });

  it('returns an empty list when there are no matches', () => {
    component.searchTerm = 'not in this catalog';
    component.applyFilters();

    expect(component.products).toEqual([]);
    expect(component.totalElements).toBe(0);
  });
});
