import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  signupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.signupForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/[^A-Za-z0-9]/), // At least one special character
        ],
      ],
    });
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      const userData = this.signupForm.value;
      console.log('userdata', userData);

      this.authService.register(userData).subscribe(
        () => {
          this.toastr.success('Registration successful!', 'Success');
          this.router.navigate(['/login']);
        },
        (error) => {
          if (error.status === 500) {
            this.toastr.error('User already exists. Please use a different email.', 'Error');
          } else {
            this.toastr.error('Registration failed. Please try again.', 'Error');
          }
          console.error('Registration failed', error);
        }
      );
    }
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
