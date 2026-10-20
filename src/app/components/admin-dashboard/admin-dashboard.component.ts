import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  pendingVendors: any[] = [];
  approvedVendors: any[] = [];
  vendors: any[] = [];
  products: any[] = [];
  dashboardStats: any = {
    pendingVendors: 0,
    approvedVendors: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalCustomers: 0,
    rejectedVendors: 0
  };

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadDashboardStats();
    this.loadPendingVendors();
    this.loadApprovedVendors();
    this.loadProducts();
  }

  loadDashboardStats() {
    this.adminService.getDashboardStats().subscribe(stats => {
      this.dashboardStats = { ...this.dashboardStats, ...(stats || {}) };
    });
  }

  loadPendingVendors() {
    this.adminService.getPendingVendors().subscribe(data => this.pendingVendors = data);
  }

  loadApprovedVendors() {
    this.adminService.getApprovedVendors().subscribe(data => this.approvedVendors = data);
  }

  loadProducts() {
    this.adminService.getProducts().subscribe(data => this.products = data);
  }

  get pendingVendorsCount(): number {
    return this.pendingVendors.length || Number(this.dashboardStats.pendingVendors || 0);
  }

  get approvedVendorsCount(): number {
    return this.approvedVendors.length || Number(this.dashboardStats.approvedVendors || 0);
  }

  get totalVendorsCount(): number {
    return Number(this.dashboardStats.totalVendors || 0) || this.pendingVendors.length + this.approvedVendors.length;
  }

  get categoriesCount(): number {
    return new Set(this.products.map(product => product.category_name || product.categoryName).filter(Boolean)).size;
  }

  approveVendor(id: number) {
    this.adminService.approveVendor(id).subscribe(() => {
      this.loadDashboardStats();
      this.loadPendingVendors();
      this.loadApprovedVendors();
    });
  }

  rejectVendor(id: number) {
    this.adminService.rejectVendor(id).subscribe(() => {
      this.loadDashboardStats();
      this.loadPendingVendors();
      this.loadApprovedVendors();
    });
  }
}
