import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastrService } from 'ngx-toastr';

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
    private router: Router,
    private toastr: ToastrService
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.toastr.error('Invalid or expired token', 'Error');
      this.router.navigate(['/login']);
      console.log("Reset Token from URL:", this.token);  // Debugging purpose
    }
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      const passwordData = {
        token: this.token,
        newPassword: this.resetForm.value.newPassword,
      };

      this.authService.resetPassword(passwordData).subscribe(
        () => {
          this.toastr.success('Password successfully updated!', 'Success');
          this.router.navigate(['/login']);
        },
        () => {
          this.toastr.error('Error resetting password.', 'Error');
        }
      );
    }
  }
}
