import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { Payment } from '../../../core/models/interfaces';

@Component({
  selector: 'app-owner-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrl: '../properties/properties.component.scss',
})
export class OwnerPaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);

  payments = signal<Payment[]>([]);
  loading = signal(true);
  saving = signal(false);
  msg = signal('');
  isError = signal(false);

  filterMonth = signal<number | null>(null);
  filterYear = signal<number | null>(null);
  filterStatus = signal<'all' | 'pending' | 'paid' | 'overdue'>('all');

  monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  yearsList(): number[] {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  }

  ngOnInit(): void {
    this.loadPayments();
    const now = new Date();
    this.filterMonth.set(now.getMonth() + 1);
    this.filterYear.set(now.getFullYear());
  }

  loadPayments(): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    const month = this.filterMonth();
    const year = this.filterYear();
    const status = this.filterStatus();
    if (month) params['month'] = String(month);
    if (year) params['year'] = String(year);
    if (status !== 'all') params['status'] = status;

    this.paymentService.getPayments(params).subscribe({
      next: (res) => {
        this.payments.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(): void {
    this.loadPayments();
  }

  setFilterMonth(month: number | null): void {
    this.filterMonth.set(month);
    this.loadPayments();
  }

  setFilterYear(year: number | null): void {
    this.filterYear.set(year);
    this.loadPayments();
  }

  setFilterStatus(status: 'all' | 'pending' | 'paid' | 'overdue'): void {
    this.filterStatus.set(status);
    this.loadPayments();
  }

  markAsPaid(payment: Payment): void {
    this.saving.set(true);
    this.msg.set('');
    this.paymentService.markAsPaid(payment._id).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadPayments();
        this.msg.set('Pago marcado como cobrado.');
        this.isError.set(false);
        setTimeout(() => this.msg.set(''), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.msg.set(err.error?.message || 'Error al actualizar.');
        this.isError.set(true);
        setTimeout(() => this.msg.set(''), 4000);
      },
    });
  }

  getStatusLabel(status: string): string {
    return status === 'paid' ? 'Cobrado' : status === 'overdue' ? 'Retraso' : 'Pendiente';
  }

  getStatusClass(status: string): string {
    return status === 'paid' ? 'c-badge--green' : status === 'overdue' ? 'c-badge--red' : 'c-badge--yellow';
  }
}
