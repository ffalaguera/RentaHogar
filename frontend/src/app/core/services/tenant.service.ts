import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantAssignment, ApiResponse } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  registerTenant(data: {
    fullName: string;
    email: string;
    phone?: string;
    gender?: 'male' | 'female';
    propertyId: string;
    // Opcional: número de habitación cuando la propiedad es por habitaciones
    room?: number | null;
    monthlyRent: number;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.apiUrl, data);
  }

  getTenants(params?: { search?: string; propertyId?: string }): Observable<ApiResponse<TenantAssignment[]>> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.propertyId) httpParams = httpParams.set('propertyId', params.propertyId);

    return this.http.get<ApiResponse<TenantAssignment[]>>(this.apiUrl, { params: httpParams });
  }

  getTenantById(id: string): Observable<ApiResponse<TenantAssignment>> {
    return this.http.get<ApiResponse<TenantAssignment>>(`${this.apiUrl}/${id}`);
  }

  removeTenant(tenantId: string, propertyId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${tenantId}/property/${propertyId}`);
  }

  removeTenantByAssignmentId(assignmentId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/assignment/${assignmentId}`);
  }
}
