import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantDashboardData, SearchResults, ApiResponse } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getTenantDashboard(): Observable<ApiResponse<TenantDashboardData>> {
    return this.http.get<ApiResponse<TenantDashboardData>>(`${this.apiUrl}/tenant`);
  }

  search(query: string): Observable<ApiResponse<SearchResults>> {
    return this.http.get<ApiResponse<SearchResults>>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }
}
