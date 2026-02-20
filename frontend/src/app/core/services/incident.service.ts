import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Incident, ApiResponse } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private apiUrl = `${environment.apiUrl}/incidents`;

  constructor(private http: HttpClient) {}

  createIncident(data: { title: string; description: string; type: string; priority?: string }): Observable<ApiResponse<Incident>> {
    return this.http.post<ApiResponse<Incident>>(this.apiUrl, data);
  }

  getIncidents(params?: Record<string, string>): Observable<ApiResponse<Incident[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<ApiResponse<Incident[]>>(this.apiUrl, { params: httpParams });
  }

  getIncidentById(id: string): Observable<ApiResponse<Incident>> {
    return this.http.get<ApiResponse<Incident>>(`${this.apiUrl}/${id}`);
  }

  updateIncidentStatus(id: string, data: { status: string; ownerNotes?: string }): Observable<ApiResponse<Incident>> {
    return this.http.patch<ApiResponse<Incident>>(`${this.apiUrl}/${id}/status`, data);
  }

  deleteIncident(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  getPropertyIncidents(): Observable<ApiResponse<Incident[]>> {
    return this.http.get<ApiResponse<Incident[]>>(`${this.apiUrl}/my-property/all`);
  }
}
