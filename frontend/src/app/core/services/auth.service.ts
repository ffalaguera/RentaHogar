import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUser = signal<User | null>(null);

  user = computed(() => this.currentUser());
  isAuthenticated = computed(() => !!this.currentUser());
  isOwner = computed(() => this.currentUser()?.role === 'owner');
  isTenant = computed(() => this.currentUser()?.role === 'tenant');
  mustChangePassword = computed(() => !!this.currentUser()?.mustChangePassword);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        this.currentUser.set(JSON.parse(userData));
      } catch {
        this.logout();
      }
    }
  }

  register(data: { fullName: string; email: string; password: string; phone?: string; gender?: 'male' | 'female' }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((res) => {
        if (res.success) {
          this.setSession(res.data);
        }
      }),
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        if (res.success) {
          this.setSession(res.data);
        }
      }),
    );
  }

  private setSession(data: { user: User; token: string }): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.currentUser.set(data.user);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  getProfile(): Observable<{ success: boolean; data: User }> {
    return this.http.get<{ success: boolean; data: User }>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: Partial<User>): Observable<{ success: boolean; data: User }> {
    return this.http.put<{ success: boolean; data: User }>(`${this.apiUrl}/profile`, data).pipe(
      tap((res) => {
        if (res.success) {
          const updated = res.data;
          localStorage.setItem('user', JSON.stringify(updated));
          this.currentUser.set(updated);
        }
      }),
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword,
    }).pipe(
      tap((res) => {
        if (res.success) {
          this.clearMustChangePassword();
        }
      }),
    );
  }

  deleteAccount(): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/account`).pipe(
      tap(() => this.logout()),
    );
  }

  clearMustChangePassword(): void {
    const user = this.currentUser();
    if (user) {
      const updated = { ...user, mustChangePassword: false };
      localStorage.setItem('user', JSON.stringify(updated));
      this.currentUser.set(updated);
    }
  }
}
