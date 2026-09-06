import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Product } from 'src/app/common/product';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list-grid.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  products: Product[] = [];
  currentCategoryId = 0;
  searchMode: boolean = false;

  constructor(private productService: ProductService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe(() => {
      this.listProducts();
    });
  }

  listProducts() {
    this.searchMode = this.route.snapshot.paramMap.has('keyword');
    if(this.searchMode) {
      this.handleSearchProducts();
    }
    else {
      this.handleListProducts();
    }
  }

  handleSearchProducts() {
    const theKeyword: string = this.route.snapshot.paramMap.get('keyword')!;
    // now search for the products using keyword
    this.productService.searchProducts(theKeyword).subscribe(
      (data: Product[]) => {
        this.products = data;
      }
    );
  }

  handleListProducts() {
    const categoryId = this.route.snapshot.paramMap.get('id');

    if (categoryId) {
      this.currentCategoryId = +categoryId;
      this.productService.getProductList(this.currentCategoryId).subscribe(
        (data: Product[]) => {
          this.products = data;
        }
      );
      return;
    }

    this.productService.getProductCategories().subscribe(
      (data) => {
        if (data.length > 0) {
          this.currentCategoryId = data[0].id;
          this.productService.getProductList(this.currentCategoryId).subscribe(
            (products: Product[]) => {
              this.products = products;
            }
          );
        }
      }
    );
  }
}
