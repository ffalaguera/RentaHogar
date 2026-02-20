import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Property, ApiResponse } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private apiUrl = `${environment.apiUrl}/properties`;

  constructor(private http: HttpClient) {}

  getProperties(params?: { search?: string; type?: string; page?: number; limit?: number }): Observable<ApiResponse<Property[]>> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<ApiResponse<Property[]>>(this.apiUrl, { params: httpParams });
  }

  getPropertyById(id: string): Observable<ApiResponse<Property>> {
    return this.http.get<ApiResponse<Property>>(`${this.apiUrl}/${id}`);
  }

  createProperty(data: any): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(this.apiUrl, data);
  }

  updateProperty(id: string, data: any): Observable<ApiResponse<Property>> {
    return this.http.put<ApiResponse<Property>>(`${this.apiUrl}/${id}`, data);
  }

  deleteProperty(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
