import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="c-sidebar" *ngIf="authService.isOwner()">
      <div class="c-sidebar__header">
        <h2 class="c-sidebar__logo">🏠 RentaHogar</h2>
        <p class="c-sidebar__tagline">Gestión de alquileres</p>
      </div>
      <nav class="c-sidebar__nav" aria-label="Navegación principal">
        <a class="c-sidebar__link" routerLink="/owner/dashboard" routerLinkActive="c-sidebar__link--active">
          <span class="c-sidebar__link-icon">📊</span>
          <span class="c-sidebar__link-text">Dashboard</span>
        </a>
        <a class="c-sidebar__link" routerLink="/owner/properties" routerLinkActive="c-sidebar__link--active">
          <span class="c-sidebar__link-icon">🏘️</span>
          <span class="c-sidebar__link-text">Propiedades</span>
        </a>
        <a class="c-sidebar__link" routerLink="/owner/tenants" routerLinkActive="c-sidebar__link--active">
          <span class="c-sidebar__link-icon">👥</span>
          <span class="c-sidebar__link-text">Inquilinos</span>
        </a>
        <a class="c-sidebar__link" routerLink="/owner/payments" routerLinkActive="c-sidebar__link--active">
          <span class="c-sidebar__link-icon">💰</span>
          <span class="c-sidebar__link-text">Cobros</span>
        </a>
        <a class="c-sidebar__link" routerLink="/owner/invoices" routerLinkActive="c-sidebar__link--active">
          <span class="c-sidebar__link-icon">📄</span>
          <span class="c-sidebar__link-text">Facturas</span>
        </a>
        <a class="c-sidebar__link" routerLink="/owner/profile" routerLinkActive="c-sidebar__link--active">
          <span class="c-sidebar__link-icon">👤</span>
          <span class="c-sidebar__link-text">Mi Perfil</span>
        </a>
      </nav>
      <footer class="c-sidebar__footer">
        <p class="c-sidebar__version">RentaHogar v1.0</p>
      </footer>
    </aside>
  `,
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  authService = inject(AuthService);
}
