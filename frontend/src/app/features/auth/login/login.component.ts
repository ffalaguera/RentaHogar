import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Por favor, completa todos los campos.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          const user = res.data.user;
          if (user.mustChangePassword) {
            this.router.navigate(['/change-password']);
          } else {
            this.router.navigate(['/welcome']);
          }
        }
      },
      error: (err) => {
        this.loading.set(false);
        let msg = err.error?.message;
        if (!msg) {
          if (err.status === 0 || err.message?.includes('Http failure') || err.message?.includes('Unknown Error')) {
            msg =
              'No se pudo conectar con el servidor. Si usas la versión desplegada, el backend puede tardar 30-60 segundos en activarse (plan gratuito). Intenta de nuevo.';
          } else if (err.status === 401) {
            msg = 'Credenciales incorrectas. Verifica el email y la contraseña.';
          } else {
            msg = 'Error al iniciar sesión. Intenta de nuevo.';
          }
        }
        this.error.set(msg);
      },
    });
  }
}
