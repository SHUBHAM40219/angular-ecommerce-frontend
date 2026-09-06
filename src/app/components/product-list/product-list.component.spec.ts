import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { ProductListComponent } from './product-list.component';
import { ProductService } from 'src/app/services/product.service';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productService: jasmine.SpyObj<ProductService>;

  beforeEach(async(() => {
    productService = jasmine.createSpyObj('ProductService', ['getProductList', 'getProductCategories']);
    productService.getProductList.and.returnValue(of([]));
    productService.getProductCategories.and.returnValue(of([
      { id: 7, categoryName: 'Books' },
      { id: 12, categoryName: 'Games' }
    ]));

    TestBed.configureTestingModule({
      declarations: [ProductListComponent],
      providers: [
        { provide: ProductService, useValue: productService },
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

  it('should use the first available category when no category id is provided', () => {
    expect(component.currentCategoryId).toBe(7);
    expect(productService.getProductCategories).toHaveBeenCalled();
    expect(productService.getProductList).toHaveBeenCalledWith(7);
  });
});
