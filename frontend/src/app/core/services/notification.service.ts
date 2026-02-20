import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  unreadCount = signal(0);

  constructor(private http: HttpClient) {}

  getNotifications(unreadOnly = false): Observable<{ success: boolean; data: Notification[]; unreadCount: number }> {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    return this.http
      .get<{ success: boolean; data: Notification[]; unreadCount: number }>(`${this.apiUrl}${params}`)
      .pipe(tap((res) => this.unreadCount.set(res.unreadCount)));
  }

  markAsRead(id: string): Observable<{ success: boolean; data: Notification }> {
    return this.http
      .patch<{ success: boolean; data: Notification }>(`${this.apiUrl}/${id}/read`, {})
      .pipe(tap(() => this.unreadCount.update((count) => Math.max(0, count - 1))));
  }

  markAllAsRead(): Observable<{ success: boolean; message: string }> {
    return this.http
      .patch<{ success: boolean; message: string }>(`${this.apiUrl}/read-all`, {})
      .pipe(tap(() => this.unreadCount.set(0)));
  }

  deleteNotification(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
