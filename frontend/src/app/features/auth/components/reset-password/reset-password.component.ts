import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  token: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      alert('Invalid or expired token');
      this.router.navigate(['/login']);
      console.log("Reset Token from URL:", this.token);  // In ngOnInit of ResetPasswordComponent

    }
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      const passwordData = {
        token: this.token,
        newPassword: this.resetForm.value.newPassword,
      };

      this.authService.resetPassword(passwordData).subscribe(
        (response) => {
          alert('Password successfully updated!');
          this.router.navigate(['/login']);
        },
        (error) => {
          alert('Error resetting password.');
        }
      );
    }
  }
}
