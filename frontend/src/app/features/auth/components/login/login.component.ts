import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const credentials = this.loginForm.value;
      console.log('Login details:', credentials);

      this.authService.login(credentials).subscribe(
        (response: { token: any }) => {
          console.log('response', response);
          const token = response.token;
          console.log('token', token);

          if (token) {
            localStorage.setItem('token', token);
            this.toastr.success('Login successful!', 'Success');
            this.router.navigate(['/dashboard']);
          }
        },
        (error: any) => {
          this.toastr.error('Login failed. Please check your credentials and try again.', 'Error');
          console.error('Login failed', error);
        }
      );
    }
  }

  redirectToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  redirectToRegister(): void {
    this.router.navigate(['/register']);
  }
}
