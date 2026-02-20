import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-tenant-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NavbarComponent],
  template: `
    <div class="l-app">
      <div class="l-app__sidebar" [class.l-app__sidebar--open]="layout.sidebarOpen()">
        <aside class="c-sidebar c-sidebar--tenant">
          <div class="c-sidebar__header">
            <h2 class="c-sidebar__logo">🏠 RentaHogar</h2>
            <p class="c-sidebar__tagline">Portal del inquilino</p>
          </div>
          <nav class="c-sidebar__nav" aria-label="Navegación del inquilino">
            <a class="c-sidebar__link" routerLink="/tenant/dashboard" routerLinkActive="c-sidebar__link--active">
              <span class="c-sidebar__link-icon">📊</span>
              <span class="c-sidebar__link-text">Dashboard</span>
            </a>
            <a class="c-sidebar__link" routerLink="/tenant/incidents" routerLinkActive="c-sidebar__link--active">
              <span class="c-sidebar__link-icon">⚠️</span>
              <span class="c-sidebar__link-text">Incidencias</span>
            </a>
            <a class="c-sidebar__link" routerLink="/tenant/profile" routerLinkActive="c-sidebar__link--active">
              <span class="c-sidebar__link-icon">👤</span>
              <span class="c-sidebar__link-text">Mi Perfil</span>
            </a>
          </nav>
        </aside>
      </div>
      <div
        class="l-app__overlay"
        [class.l-app__overlay--visible]="layout.sidebarOpen()"
        (click)="layout.closeSidebar()"
      ></div>
      <div class="l-app__main">
        <app-navbar />
        <div class="l-app__content">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styleUrl: '../../components/sidebar/sidebar.component.scss',
})
export class TenantLayoutComponent {
  layout = inject<LayoutService>(LayoutService);
}
