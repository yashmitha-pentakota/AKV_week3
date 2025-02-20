import { TestBed } from '@angular/core/testing';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../authguards/auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
