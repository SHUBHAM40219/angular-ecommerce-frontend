import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProductCategoryMenuComponent } from './product-category-menu.component';
import { ProductService } from 'src/app/services/product.service';

describe('ProductCategoryMenuComponent', () => {
  let component: ProductCategoryMenuComponent;
  let fixture: ComponentFixture<ProductCategoryMenuComponent>;

  beforeEach(async () => {
    const productService = jasmine.createSpyObj('ProductService', ['getProductCategories']);
    productService.getProductCategories.and.returnValue(of([
      { id: 1, categoryName: 'Books' },
      { id: 2, categoryName: 'Coffee Mugs' }
    ]));

    await TestBed.configureTestingModule({
      declarations: [ProductCategoryMenuComponent],
      providers: [{ provide: ProductService, useValue: productService }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCategoryMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
