import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthRole, AuthService, LoginRequest } from 'src/app/services/auth.service';

type AuthMode = 'login' | 'signup';
type AuthRoleType = 'admin' | 'vendor' | 'customer';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  authMode: AuthMode = 'login';
  selectedRole: AuthRoleType | null = null;

  loginRoles: AuthRoleType[] = ['admin', 'vendor', 'customer'];
  signupRoles: AuthRoleType[] = ['vendor', 'customer'];

  form: LoginRequest = {
    email: '',
    password: '',
    role: 'CUSTOMER'
  };

  signupForm = {
    name: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    address: ''
  };

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  showLoginPassword = false;
  showSignupPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const mode = params.get('mode');
      this.authMode = mode === 'signup' ? 'signup' : 'login';
      this.selectedRole = null;
      this.successMessage = '';
      this.errorMessage = '';
    });
  }

  chooseMode(mode: AuthMode) {
    this.authMode = mode;
    this.selectedRole = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.router.navigate([], { queryParams: { mode }, replaceUrl: true });
  }

  chooseRole(role: AuthRoleType) {
    this.selectedRole = role;
    this.form.role = role.toUpperCase() as AuthRole;
    this.successMessage = '';
    this.errorMessage = '';
  }

  backToRoles() {
    this.selectedRole = null;
    this.successMessage = '';
    this.errorMessage = '';
  }

  togglePasswordVisibility(type: 'login' | 'signup') {
    if (type === 'login') {
      this.showLoginPassword = !this.showLoginPassword;
    } else {
      this.showSignupPassword = !this.showSignupPassword;
    }
  }

  login() {
    if (!this.selectedRole) {
      this.errorMessage = 'Please select a role before logging in.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const loginPayload: LoginRequest = {
      email: this.form.email.trim(), // safe default
      password: this.form.password || '',
      role: (this.form.role || this.selectedRole).toUpperCase() as AuthRole
    };

    this.authService.login(loginPayload).subscribe({
      next: (response) => {
        const data = response?.data ?? response;
        const token = data?.accessToken ?? response?.accessToken;

        if (!token) {
          this.errorMessage = 'Login succeeded but no token was returned.';
          this.isSubmitting = false;
          return;
        }

        const user = this.authService.setAuthenticatedUser(response);
        if (!user) {
          this.errorMessage = 'Login succeeded but user data could not be restored.';
          this.isSubmitting = false;
          return;
        }

        if (user.role === 'ADMIN') {
          this.router.navigateByUrl('/admin');
        } else if (user.role === 'VENDOR') {
          this.router.navigateByUrl('/vendor');
        } else {
          this.router.navigateByUrl('/customer');
        }
      },
      error: (error) => {
        const validationMessage = error?.error?.data && typeof error.error.data === 'object'
          ? Object.values(error.error.data)[0]
          : null;
        const message = String(validationMessage || error?.error?.message || 'Invalid credentials or role access.');
        this.errorMessage = /exist|already/i.test(message)
          ? 'Account already exists. Please try another email or log in.'
          : message;
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  signup() {
    if (!this.selectedRole) {
      this.errorMessage = 'Please select a role before signing up.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.signupForm.name.trim() || !this.signupForm.email.trim() || !this.signupForm.password ||
        !this.signupForm.phone.trim() || !this.signupForm.address.trim() ||
        (this.selectedRole === 'vendor' && !this.signupForm.company.trim())) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (!/^\d{10}$/.test(this.signupForm.phone.trim())) {
      this.errorMessage = 'Please enter a valid 10-digit phone number.';
      return;
    }

    this.isSubmitting = true;
    const role = this.selectedRole;
    const username = (this.signupForm.email || '').split('@')[0] || 'user';

    const requestPayload = role === 'vendor'
      ? {
          username,
          email: this.signupForm.email,
          password: this.signupForm.password,
          phone: this.signupForm.phone,
          address: this.signupForm.address,
          companyName: this.signupForm.company,
          contactPerson: this.signupForm.name
        }
      : {
          email: this.signupForm.email,
          password: this.signupForm.password,
          fullName: this.signupForm.name,
          phone: this.signupForm.phone,
          address: this.signupForm.address
        };

    const request$ = role === 'vendor'
      ? this.authService.registerVendor(requestPayload)
      : this.authService.registerCustomer(requestPayload);

    request$.subscribe({
      next: (response) => {
        this.successMessage = response?.message || (
          role === 'vendor'
            ? 'Vendor signup submitted. Admin approval is required before product upload.'
            : 'Customer signup successful. You can browse and purchase immediately.'
        );
        this.isSubmitting = false;
      },
      error: (error) => {
        const validationMessage = error?.error?.data && typeof error.error.data === 'object'
          ? Object.values(error.error.data)[0]
          : null;
        const message = String(validationMessage || error?.error?.message || 'Signup failed. Please try again.');
        this.errorMessage = /exist|already/i.test(message)
          ? 'Account already exists. Please use a different email or log in.'
          : message;
        this.isSubmitting = false;
      }
    });
  }
}
