import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../core/services/invoice.service';
import { SafeUrlPipe } from '../../../shared/pipes/safe-url.pipe';
import { PropertyService } from '../../../core/services/property.service';
import { Invoice, Property } from '../../../core/models/interfaces';
import { fadeIn, modalAnimation, tableBodyStagger } from '../../../shared/animations';

@Component({
  selector: 'app-owner-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeUrlPipe],
  templateUrl: './invoices.component.html',
  styleUrls: ['../properties/properties.component.scss', './invoices.component.scss'],
  animations: [fadeIn, modalAnimation, tableBodyStagger],
})
export class OwnerInvoicesComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private propertyService = inject(PropertyService);

  invoices = signal<Invoice[]>([]);
  properties = signal<Property[]>([]);
  loading = signal(true);
  showModal = signal(false);
  showDetailModal = signal(false);
  selectedInvoiceId = signal<string | null>(null);
  saving = signal(false);

  form = {
    propertyId: '',
    type: 'electricity' as string,
    amount: 0,
    monthStart: new Date().getMonth() + 1,
    yearStart: new Date().getFullYear(),
    monthEnd: new Date().getMonth() + 1,
    yearEnd: new Date().getFullYear(),
    notes: '',
  };
  documentFile: File | null = null;

  typeLabels: Record<string, string> = {
    water: '💧 Agua', gas: '🔥 Gas', electricity: '⚡ Electricidad',
    internet: '🌐 Internet', community: '🏢 Comunidad', insurance: '🛡️ Seguro', other: '📋 Otro',
  };

  ngOnInit(): void {
    this.loadInvoices();
    this.propertyService.getProperties({ limit: 50 }).subscribe({
      next: (res) => this.properties.set(res.data),
    });
  }

  loadInvoices(): void {
    this.invoiceService.getInvoices().subscribe({
      next: (res) => { this.invoices.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal(): void {
    const now = new Date();
    this.form = {
      propertyId: '',
      type: 'electricity',
      amount: 0,
      monthStart: now.getMonth() + 1,
      yearStart: now.getFullYear(),
      monthEnd: now.getMonth() + 1,
      yearEnd: now.getFullYear(),
      notes: '',
    };
    this.documentFile = null;
    this.showModal.set(true);
  }

  onDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (allowed.includes(file.type)) {
        this.documentFile = file;
      } else {
        alert('Formato no permitido. Solo imágenes (JPG, PNG, GIF, WebP) o PDF.');
        input.value = '';
      }
    }
  }

  removeDocument(): void {
    this.documentFile = null;
  }

  saveInvoice(): void {
    this.saving.set(true);
    const data = {
      ...this.form,
      periodStart: { month: this.form.monthStart, year: this.form.yearStart },
      periodEnd: { month: this.form.monthEnd, year: this.form.yearEnd },
    };
    this.invoiceService.createInvoice(data, this.documentFile || undefined).subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.documentFile = null; this.loadInvoices(); },
      error: () => this.saving.set(false),
    });
  }

  selectedInvoice = () => {
    const id = this.selectedInvoiceId();
    return id ? this.invoices().find((i) => i._id === id) ?? null : null;
  };

  openDetailModal(inv: Invoice): void {
    this.selectedInvoiceId.set(inv._id);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedInvoiceId.set(null);
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

  markAsPaid(id: string): void {
    this.invoiceService.markAsPaid(id).subscribe(() => this.loadInvoices());
  }

  deleteInvoice(id: string): void {
    if (confirm('¿Eliminar esta factura?')) {
      this.invoiceService.deleteInvoice(id).subscribe(() => this.loadInvoices());
    }
  }
}
