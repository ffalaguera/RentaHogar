import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="l-app">
      <div class="l-app__sidebar" [class.l-app__sidebar--open]="layout.sidebarOpen()">
        <app-sidebar />
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
  styles: [],
})
export class OwnerLayoutComponent {
  layout = inject<LayoutService>(LayoutService);
}
