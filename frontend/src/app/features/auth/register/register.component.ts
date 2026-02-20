import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="c-auth">
      <section class="c-auth__card">
        <header class="c-auth__header">
          <h1 class="c-auth__logo">🏠 RentaHogar</h1>
          <p class="c-auth__subtitle">Crea tu cuenta de propietario</p>
        </header>
        <div class="c-auth__body">
          <button type="button" class="c-auth__back" routerLink="/">
            ← Volver al inicio
          </button>
          <h2 class="c-auth__title">Registro</h2>
          <form class="c-form" (ngSubmit)="onSubmit()">
            <div class="c-form__group">
              <label class="c-form__label" for="fullName">Nombre completo</label>
              <input id="fullName" type="text" class="c-form__input" placeholder="Tu nombre" [(ngModel)]="fullName" name="fullName" required />
            </div>
            <div class="c-form__group">
              <label class="c-form__label" for="regEmail">Correo electrónico</label>
              <input id="regEmail" type="email" class="c-form__input" placeholder="tu&#64;email.com" [(ngModel)]="email" name="email" required />
            </div>
            <div class="c-form__group">
              <label class="c-form__label" for="regPhone">Teléfono (opcional)</label>
              <input id="regPhone" type="tel" class="c-form__input" placeholder="+34 600 000 000" [(ngModel)]="phone" name="phone" />
            </div>
            <div class="c-form__group">
              <label class="c-form__label">Género</label>
              <div class="c-form__radio-group" style="display: flex; gap: 1.5rem; margin-top: 0.5rem;">
                <label class="c-form__radio-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="radio" name="gender" value="male" [(ngModel)]="gender" />
                  <span>Hombre</span>
                </label>
                <label class="c-form__radio-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="radio" name="gender" value="female" [(ngModel)]="gender" />
                  <span>Mujer</span>
                </label>
              </div>
            </div>
            <div class="c-form__group">
              <label class="c-form__label" for="regPass">Contraseña</label>
              <input id="regPass" type="password" class="c-form__input" placeholder="Mínimo 6 caracteres" [(ngModel)]="password" name="password" required />
            </div>
            <p class="c-form__error" *ngIf="error()">{{ error() }}</p>
            <button type="submit" class="c-button c-button--full c-button--lg" [disabled]="loading()">
              <span class="c-button__spinner" *ngIf="loading()"></span>
              {{ loading() ? 'Registrando...' : 'Crear cuenta' }}
            </button>
          </form>
        </div>
        <footer class="c-auth__footer">
          <p>¿Ya tienes cuenta? <a routerLink="/login" class="c-auth__link">Iniciar sesión</a></p>
        </footer>
      </section>
    </main>
  `,
  styleUrl: '../login/login.component.scss',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  fullName = '';
  email = '';
  phone = '';
  gender: 'male' | 'female' = 'male';
  password = '';
  error = signal('');
  loading = signal(false);

  onSubmit(): void {
    if (!this.fullName || !this.email || !this.password) {
      this.error.set('Completa los campos obligatorios.');
      return;
    }
    if (this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.register({ fullName: this.fullName, email: this.email, password: this.password, phone: this.phone, gender: this.gender }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.router.navigate(['/welcome']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al registrarse.');
      },
    });
  }
}
