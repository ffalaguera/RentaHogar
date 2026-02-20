import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-force-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './force-change-password.component.html',
  styleUrl: '../login/login.component.scss',
})
export class ForceChangePasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  error = signal('');
  success = signal('');
  loading = signal(false);

  onSubmit(): void {
    this.error.set('');
    this.success.set('');

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.error.set('Por favor, completa todos los campos.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.error.set('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    if (this.currentPassword === this.newPassword) {
      this.error.set('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    this.loading.set(true);

    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Contraseña actualizada correctamente. Redirigiendo...');
        setTimeout(() => {
          this.router.navigate(['/welcome']);
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al cambiar la contraseña.');
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
