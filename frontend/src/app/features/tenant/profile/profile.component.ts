import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-tenant-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="l-page">
      <header class="l-page__header">
        <h2 class="l-page__title">Mi Perfil</h2>
      </header>
      <div class="l-grid l-grid--2">
        <article class="c-card">
          <header class="c-card__header">
            <h3 class="c-card__title">Información personal</h3>
          </header>
          <form class="c-form" (ngSubmit)="saveProfile()">
            <div class="c-form__group" style="text-align: center; margin-bottom: 1.5rem; position: relative; display: inline-block; width: 100%;">
              <div style="position: relative; display: inline-block;">
                <span class="c-avatar c-avatar--xl"
                  style="width: 8rem; height: 8rem; font-size: 2.5rem;"
                  [style.background-image]="getAvatarUrl() ? 'url(' + getAvatarUrl() + ')' : ''"
                  [style.background-size]="'cover'"
                  [style.background-position]="'center'">
                  <span *ngIf="!getAvatarUrl()">{{ getInitials() }}</span>
                  <span *ngIf="uploadingAvatar()" style="position: absolute; inset: 0; background: rgba(0,0,0,0.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">⏳</span>
                </span>
                <button type="button" class="c-button c-button--sm"
                  style="position: absolute; bottom: 0; right: 0; border-radius: 50%; width: 3rem; height: 3rem; padding: 0; min-width: auto; box-shadow: 0 2px 8px rgba(0,0,0,0.3); background: #667eea; border: 3px solid white; cursor: pointer; font-size: 1.2rem;"
                  (click)="triggerFileInput()" [disabled]="uploadingAvatar()" title="Cambiar foto de perfil">
                  {{ uploadingAvatar() ? '⏳' : '📷' }}
                </button>
              </div>
              <input #fileInput type="file" accept="image/*" style="display: none;" (change)="onFileSelected($event)" />
              <p *ngIf="uploadingAvatar()" style="margin-top: 0.5rem; font-size: 0.875rem; color: #667eea;">Subiendo foto...</p>
            </div>
            <div class="c-form__group">
              <label class="c-form__label" for="pName">Nombre completo</label>
              <input id="pName" class="c-form__input" [(ngModel)]="fullName" name="fullName" required />
            </div>
            <div class="c-form__group">
              <label class="c-form__label" for="pEmail">Email</label>
              <input id="pEmail" class="c-form__input" [value]="authService.user()?.email" disabled />
              <p class="c-form__hint">El email no se puede cambiar.</p>
            </div>
            <div class="c-form__group">
              <label class="c-form__label" for="pPhone">Teléfono</label>
              <input id="pPhone" class="c-form__input" [(ngModel)]="phone" name="phone" placeholder="+34 600 000 000" />
            </div>
            <button type="submit" class="c-button" [disabled]="savingProfile()">
              {{ savingProfile() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
            <p *ngIf="profileMsg()" style="margin-top: 0.75rem; font-size: 0.875rem;"
              [style.color]="profileError() ? '#f56565' : '#48bb78'">{{ profileMsg() }}</p>
          </form>
        </article>

        <article class="c-card">
          <header class="c-card__header">
            <h3 class="c-card__title">Cambiar contraseña</h3>
          </header>
          <form class="c-form" (ngSubmit)="changePassword()">
            <div class="c-form__group">
              <label class="c-form__label" for="curPass">Contraseña actual</label>
              <input id="curPass" type="password" class="c-form__input" [(ngModel)]="currentPassword" name="currentPassword" required />
            </div>
            <div class="c-form__group">
              <label class="c-form__label" for="newPass">Nueva contraseña</label>
              <input id="newPass" type="password" class="c-form__input" [(ngModel)]="newPassword" name="newPassword" required />
            </div>
            <button type="submit" class="c-button c-button--secondary" [disabled]="savingPass()">
              {{ savingPass() ? 'Cambiando...' : 'Cambiar contraseña' }}
            </button>
            <p *ngIf="passMsg()" style="margin-top: 0.75rem; font-size: 0.875rem;"
              [style.color]="passError() ? '#f56565' : '#48bb78'">{{ passMsg() }}</p>
          </form>
        </article>
      </div>
    </section>
  `,
  styles: [],
})
export class TenantProfileComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  authService = inject(AuthService);

  fullName = '';
  phone = '';
  currentPassword = '';
  newPassword = '';
  savingProfile = signal(false);
  savingPass = signal(false);
  profileMsg = signal('');
  profileError = signal(false);
  passMsg = signal('');
  passError = signal(false);
  uploadingAvatar = signal(false);

  ngOnInit(): void {
    const u = this.authService.user();
    if (u) {
      this.fullName = u.fullName;
      this.phone = u.phone || '';
    }
  }

  getInitials(): string {
    return this.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getAvatarUrl(): string | null {
    const user = this.authService.user();
    return user?.avatar || null;
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.profileError.set(true);
      this.profileMsg.set('Por favor, selecciona un archivo de imagen.');
      setTimeout(() => this.profileMsg.set(''), 3000);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.profileError.set(true);
      this.profileMsg.set('La imagen es demasiado grande. Máximo 2MB.');
      setTimeout(() => this.profileMsg.set(''), 3000);
      return;
    }

    this.uploadingAvatar.set(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      this.authService.updateProfile({ avatar: base64 }).subscribe({
        next: () => {
          this.uploadingAvatar.set(false);
          this.profileError.set(false);
          this.profileMsg.set('Foto de perfil actualizada.');
          setTimeout(() => this.profileMsg.set(''), 3000);
        },
        error: () => {
          this.uploadingAvatar.set(false);
          this.profileError.set(true);
          this.profileMsg.set('Error al subir la foto.');
          setTimeout(() => this.profileMsg.set(''), 3000);
        },
      });
    };
    reader.onerror = () => {
      this.uploadingAvatar.set(false);
      this.profileError.set(true);
      this.profileMsg.set('Error al leer el archivo.');
      setTimeout(() => this.profileMsg.set(''), 3000);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  saveProfile(): void {
    this.savingProfile.set(true);
    this.profileError.set(false);
    this.authService.updateProfile({ fullName: this.fullName, phone: this.phone }).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.profileMsg.set('Perfil actualizado.');
        setTimeout(() => this.profileMsg.set(''), 3000);
      },
      error: () => {
        this.savingProfile.set(false);
        this.profileError.set(true);
        this.profileMsg.set('Error al guardar el perfil.');
        setTimeout(() => this.profileMsg.set(''), 3000);
      },
    });
  }

  changePassword(): void {
    this.savingPass.set(true);
    this.passError.set(false);
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.savingPass.set(false);
        this.passMsg.set('Contraseña actualizada.');
        this.currentPassword = '';
        this.newPassword = '';
        setTimeout(() => this.passMsg.set(''), 3000);
      },
      error: (err) => {
        this.savingPass.set(false);
        this.passError.set(true);
        this.passMsg.set(err.error?.message || 'Error al cambiar la contraseña.');
        setTimeout(() => this.passMsg.set(''), 5000);
      },
    });
  }
}
