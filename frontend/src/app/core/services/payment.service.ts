import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment, PaymentSummary, ApiResponse } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  createPayment(data: any): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(this.apiUrl, data);
  }

  getPayments(params?: Record<string, string>): Observable<ApiResponse<Payment[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) httpParams = httpParams.set(key, value);
      });
    }
    return this.http.get<ApiResponse<Payment[]>>(this.apiUrl, { params: httpParams });
  }

  markAsPaid(id: string, paymentMethod?: string): Observable<ApiResponse<Payment>> {
    return this.http.patch<ApiResponse<Payment>>(`${this.apiUrl}/${id}/pay`, { paymentMethod });
  }

  getOverduePayments(): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.apiUrl}/overdue`);
  }

  getDashboardSummary(): Observable<ApiResponse<PaymentSummary>> {
    return this.http.get<ApiResponse<PaymentSummary>>(`${this.apiUrl}/summary`);
  }

  getTenantPayments(): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.apiUrl}/my-payments`);
  }

  deletePayment(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
