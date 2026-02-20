import { Component, inject, computed, effect, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, catchError, of } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { InvoiceVariationChartComponent } from './invoice-variation-chart/invoice-variation-chart.component';
import { TenantDashboardData } from '../../../core/models/interfaces';
import { Invoice } from '../../../core/models/interfaces';
import { cardStagger, fadeIn, fadeInOut, modalAnimation } from '../../../shared/animations';

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SafeUrlPipe, InvoiceVariationChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['../../owner/properties/properties.component.scss', './dashboard.component.scss'],
  animations: [cardStagger, fadeIn, fadeInOut, modalAnimation],
})
export class TenantDashboardComponent {
  private dashboardService = inject(DashboardService);
  private invoiceService = inject(InvoiceService);
  private cdr = inject(ChangeDetectorRef);

  showDetailModal = signal(false);
  selectedInvoice = signal<Invoice | null>(null);

  private apiResult = toSignal(
    this.dashboardService.getTenantDashboard().pipe(
      map((res) => ({ data: res.data, loading: false })),
      catchError(() => of({ data: null as TenantDashboardData | null, loading: false }))
    ),
    { initialValue: { data: null as TenantDashboardData | null, loading: true } }
  );

  data = computed(() => this.apiResult()!.data);
  loading = computed(() => this.apiResult()!.loading);

  constructor() {
    effect(() => {
      const r = this.apiResult();
      if (r && !r.loading) {
        queueMicrotask(() => this.cdr.detectChanges());
      }
    });
  }

  invoiceTypeLabels: Record<string, string> = {
    water: '💧 Agua', gas: '🔥 Gas', electricity: '⚡ Electricidad',
    internet: '🌐 Internet', community: '🏢 Comunidad', insurance: '🛡️ Seguro', other: '📋 Otro',
  };

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada' };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { open: 'red', in_progress: 'yellow', resolved: 'green', closed: 'gray' };
    return map[status] || 'gray';
  }

  getPropertyTypeLabel(type: string): string {
    const map: Record<string, string> = {
      apartment: 'Apartamento',
      house: 'Casa',
      studio: 'Estudio',
      room: 'Habitación',
      commercial: 'Local comercial',
    };
    return map[type] || type;
  }

  openDetailModal(inv: Invoice): void {
    this.selectedInvoice.set(inv);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedInvoice.set(null);
  }

  getDocumentUrl(documentUrl: string | undefined): string {
    return this.invoiceService.getDocumentUrl(documentUrl);
  }

  formatPeriod(inv: Invoice): string {
    if (!inv?.periodStart || !inv?.periodEnd) return '—';
    const pad = (n: number) => String(n).padStart(2, '0');
    const start = `${pad(inv.periodStart.month)}/${inv.periodStart.year}`;
    const end = `${pad(inv.periodEnd.month)}/${inv.periodEnd.year}`;
    return `${start} - ${end}`;
  }
}
