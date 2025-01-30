import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    if (token) {
      // You can also add logic to check if the token is valid (not expired)
      return true;
    } else {
      this.router.navigate(['login']);
      return false;
    }
  }
}