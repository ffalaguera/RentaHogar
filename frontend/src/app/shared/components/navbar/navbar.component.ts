import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { LayoutService } from '../../../core/services/layout.service';
import { Notification, SearchResults } from '../../../core/models/interfaces';
import { fadeInOut, slideInOut, listStagger } from '../../../shared/animations';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  animations: [fadeInOut, slideInOut, listStagger],
})
export class NavbarComponent implements OnInit {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  dashboardService = inject(DashboardService);
  router = inject(Router);
  layout = inject(LayoutService);

  searchQuery = '';
  searchResults = signal<SearchResults | null>(null);
  showSearch = signal(false);
  showNotifications = signal(false);
  showUserMenu = signal(false);
  notifications = signal<Notification[]>([]);
  searching = signal(false);
  highlightedIndex = signal(0);
  blurTimeout: any = null;

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (res) => this.notifications.set(res.data.slice(0, 10)),
    });
  }

  onSearch(): void {
    if (this.searchQuery.length < 2) {
      this.searchResults.set(null);
      this.showSearch.set(false);
      this.highlightedIndex.set(0);
      return;
    }
    
    if (this.authService.isOwner()) {
      this.searching.set(true);
      this.showSearch.set(true);
      this.highlightedIndex.set(0);
      
      this.dashboardService.search(this.searchQuery).subscribe({
        next: (res) => {
          this.searchResults.set(res.data);
          this.searching.set(false);
        },
        error: () => {
          this.searching.set(false);
          this.searchResults.set({ properties: [], tenants: [] });
        },
      });
    }
  }

  onEnterKey(): void {
    if (this.searchResults() && this.searchResults()!.tenants.length > 0) {
      const tenant = this.searchResults()!.tenants[this.highlightedIndex()];
      this.goToTenant(tenant);
    }
  }

  goToTenant(tenant: any): void {
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
      this.blurTimeout = null;
    }
    const tenantId = tenant._id || tenant.id;
    if (tenantId) {
      this.router.navigate(['/owner/tenants', tenantId]);
      this.closeDropdowns();
      this.searchQuery = '';
      this.searchResults.set(null);
    }
  }

  handleSearchBlur(): void {
    // Delay closing to allow click events on results
    this.blurTimeout = setTimeout(() => {
      this.showSearch.set(false);
    }, 200);
  }

  toggleNotifications(): void {
    this.showNotifications.update((v) => !v);
    this.showUserMenu.set(false);
    this.showSearch.set(false);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update((v) => !v);
    this.showNotifications.set(false);
    this.showSearch.set(false);
  }

  toggleSidebar(): void {
    this.layout.toggleSidebar();
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
    });
  }

  markAsRead(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe();
    }
  }

  closeDropdowns(): void {
    this.showNotifications.set(false);
    this.showUserMenu.set(false);
    this.showSearch.set(false);
    if (this.blurTimeout) {
      clearTimeout(this.blurTimeout);
      this.blurTimeout = null;
    }
  }

  getInitials(): string {
    const name = this.authService.user()?.fullName || '';
    return name
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

  logout(): void {
    this.authService.logout();
  }
}
