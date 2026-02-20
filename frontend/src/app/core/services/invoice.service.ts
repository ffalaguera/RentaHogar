import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invoice, ApiResponse } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  createInvoice(data: any, document?: File): Observable<ApiResponse<Invoice>> {
    if (document) {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      formData.append('document', document);
      return this.http.post<ApiResponse<Invoice>>(this.apiUrl, formData);
    }
    return this.http.post<ApiResponse<Invoice>>(this.apiUrl, data);
  }

  getDocumentUrl(documentUrl: string | undefined): string {
    if (!documentUrl) return '';
    const base = this.apiUrl.replace(/\/api\/?$/, '');
    return documentUrl.startsWith('http') ? documentUrl : `${base}${documentUrl}`;
  }

  getInvoices(params?: Record<string, string>): Observable<ApiResponse<Invoice[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<ApiResponse<Invoice[]>>(this.apiUrl, { params: httpParams });
  }

  getInvoiceById(id: string): Observable<ApiResponse<Invoice>> {
    return this.http.get<ApiResponse<Invoice>>(`${this.apiUrl}/${id}`);
  }

  updateInvoice(id: string, data: Partial<Invoice>): Observable<ApiResponse<Invoice>> {
    return this.http.put<ApiResponse<Invoice>>(`${this.apiUrl}/${id}`, data);
  }

  markAsPaid(id: string): Observable<ApiResponse<Invoice>> {
    return this.http.patch<ApiResponse<Invoice>>(`${this.apiUrl}/${id}/pay`, {});
  }

  deleteInvoice(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  getTenantInvoices(): Observable<ApiResponse<Invoice[]>> {
    return this.http.get<ApiResponse<Invoice[]>>(`${this.apiUrl}/my-invoices`);
  }
}
