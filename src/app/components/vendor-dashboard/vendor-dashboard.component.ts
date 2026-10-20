import { Component, OnDestroy, OnInit } from '@angular/core';
import { VendorService } from '../../services/vendor.service';
import { ProductCategory, ProductService } from '../../services/product.service';

@Component({
  selector: 'app-vendor-dashboard',
  templateUrl: './vendor-dashboard.component.html',
  styleUrls: ['./vendor-dashboard.component.css']
})
export class VendorDashboardComponent implements OnInit, OnDestroy {
  products: any[] = [];
  categories: ProductCategory[] = [];
  vendorProfile: any = null;
  saveMessage = '';
  errorMessage = '';
  categorySuccessMessage = '';
  categoryErrorMessage = '';
  newCategoryName = '';
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  editingProductId: number | null = null;
  private previewObjectUrl: string | null = null;

  newProduct = {
    categoryId: null as number | null,
    sku: '',
    name: '',
    description: '',
    unitPrice: null as number | null,
    active: true,
    unitsInStock: null as number | null
  };

  constructor(private vendorService: VendorService, private productService: ProductService) {}

  ngOnInit() {
    this.loadVendorProfile();
    this.loadProducts();
    this.productService.getProductCategories().subscribe(data => {
      this.categories = data;
      if (!this.newProduct.categoryId && data.length > 0) {
        const firstCategory = data[0] as any;
        const selected = Number(firstCategory?.id ?? firstCategory?.categoryId ?? firstCategory?.category_id ?? 0);
        this.newProduct.categoryId = selected || null;
      }
    });
  }

  ngOnDestroy() {
    this.clearPreviewObjectUrl();
  }

  get approvalStatus(): string {
    if (!this.vendorProfile) {
      return 'PENDING';
    }

    return (this.vendorProfile.status || this.vendorProfile.approvalStatus || (this.vendorProfile.isApproved ? 'APPROVED' : 'PENDING')).toUpperCase();
  }

  get isApprovedVendor(): boolean {
    return this.approvalStatus === 'APPROVED'
      || this.vendorProfile?.isApproved === true
      || this.vendorProfile?.is_approved === true;
  }

  loadVendorProfile() {
    this.vendorService.getVendorProfile().subscribe({
      next: (profile) => {
        this.vendorProfile = profile || {};
      },
      error: () => {
        this.vendorProfile = { status: 'PENDING', isApproved: false };
      }
    });
  }

  loadProducts() {
    this.vendorService.getVendorProducts().subscribe(data => this.products = data);
  }

  productImageUrl(product: any): string {
    return this.productService.resolveImageUrl(product.imageUrl ?? product.image_url ?? null);
  }

  addCategory() {
    const categoryName = this.newCategoryName.trim();
    this.categorySuccessMessage = '';
    this.categoryErrorMessage = '';

    if (!this.isApprovedVendor) {
      this.categoryErrorMessage = 'Only admin-approved vendors can add categories.';
      return;
    }

    if (!categoryName || categoryName.length > 60) {
      this.categoryErrorMessage = 'Enter a category name of up to 60 characters.';
      return;
    }

    this.vendorService.addCategory(categoryName).subscribe({
      next: (response) => {
        const category = response?.data ?? response;
        const addedCategory = {
          id: Number(category.id ?? category.categoryId),
          categoryName: category.categoryName ?? category.name ?? categoryName
        };

        if (!addedCategory.id) {
          this.categoryErrorMessage = 'Category was created, but its ID was not returned. Reload the dashboard to continue.';
          return;
        }

        this.categories = [...this.categories, addedCategory];
        this.newProduct.categoryId = addedCategory.id;
        this.newCategoryName = '';
        this.categorySuccessMessage = `Category "${addedCategory.categoryName}" added and selected.`;
      },
      error: (error) => {
        this.categoryErrorMessage = error?.error?.message || 'Could not add category. Please try again.';
      }
    });
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      this.selectedImage = null;
      this.clearPreview();
      return;
    }

    const allowedImageExtension = /\.(jpe?g|png|gif|webp)$/i.test(file.name);
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageExtension || (file.type && !allowedMimeTypes.includes(file.type))) {
      this.errorMessage = 'Choose a JPG, PNG, GIF, or WEBP image.';
      this.selectedImage = null;
      this.clearPreview();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'Image size must be 10 MB or less.';
      this.selectedImage = null;
      this.clearPreview();
      return;
    }

    this.selectedImage = file;
    this.clearPreviewObjectUrl();
    this.previewObjectUrl = URL.createObjectURL(file);
    this.imagePreview = this.previewObjectUrl;
    this.errorMessage = '';
  }

  private clearPreviewObjectUrl() {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }

  private clearPreview() {
    this.clearPreviewObjectUrl();
    this.imagePreview = null;
  }

  validateProduct(): string | null {
    if (!this.newProduct.name || !this.newProduct.name.trim()) {
      return 'Product name is required.';
    }

    if (!this.newProduct.sku || !this.newProduct.sku.trim()) {
      return 'SKU is required.';
    }

    if (!this.newProduct.categoryId) {
      return 'Please select a category.';
    }

    if (!this.newProduct.description || !this.newProduct.description.trim()) {
      return 'Description is required.';
    }

    if (this.newProduct.unitPrice === null || Number(this.newProduct.unitPrice) <= 0) {
      return 'Unit price must be greater than zero.';
    }

    if (this.newProduct.unitsInStock === null || Number(this.newProduct.unitsInStock) < 0) {
      return 'Stock quantity is required and cannot be negative.';
    }

    return null;
  }

  saveProduct() {
    if (!this.isApprovedVendor) {
      this.errorMessage = 'Only admin-approved vendors can add or manage products.';
      this.saveMessage = '';
      return;
    }

    const validationError = this.validateProduct();
    if (validationError) {
      this.errorMessage = validationError;
      this.saveMessage = '';
      return;
    }

    this.errorMessage = '';
    this.saveMessage = '';

    const request = this.editingProductId === null
      ? this.vendorService.addProduct(this.newProduct, this.selectedImage)
      : this.vendorService.updateProduct(this.editingProductId, this.newProduct, this.selectedImage);

    request.subscribe({
      next: () => {
        this.saveMessage = this.editingProductId === null
          ? 'Product has been successfully saved.'
          : 'Product has been successfully updated.';
        this.resetProductForm();
        this.loadProducts();
      },
      error: (error) => {
        this.saveMessage = '';
        this.errorMessage = error?.error?.message || 'Failed to save product. Please check all fields and try again.';
      }
    });
  }

  editProduct(product: any) {
    if (!this.isApprovedVendor) {
      return;
    }

    this.editingProductId = Number(product.id);
    this.newProduct = {
      categoryId: Number(product.categoryId ?? product.category?.id ?? product.category_id) || null,
      sku: product.sku ?? '',
      name: product.name ?? '',
      description: product.description ?? '',
      unitPrice: Number(product.unitPrice ?? product.unitprice) || null,
      active: Boolean(product.active),
      unitsInStock: Number(product.unitsInStock ?? product.units_in_stock) || 0
    };
    this.selectedImage = null;
    this.imagePreview = this.productService.resolveImageUrl(product.imageUrl ?? product.image_url ?? null);
    this.saveMessage = '';
    this.errorMessage = '';
  }

  cancelEdit() {
    this.resetProductForm();
    this.saveMessage = '';
    this.errorMessage = '';
  }

  private resetProductForm() {
    this.editingProductId = null;
    this.newProduct = {
      categoryId: this.categories[0]?.id ?? null,
      sku: '',
      name: '',
      description: '',
      unitPrice: null,
      active: true,
      unitsInStock: null
    };
    this.selectedImage = null;
    this.clearPreview();
  }

  deleteProduct(id: number) {
    if (!window.confirm('Delete this product? This action cannot be undone.')) {
      return;
    }

    this.errorMessage = '';
    this.vendorService.deleteProduct(id).subscribe({
      next: () => this.loadProducts(),
      error: error => this.errorMessage = error?.error?.message || 'Could not delete product. Please try again.'
    });
  }
}
