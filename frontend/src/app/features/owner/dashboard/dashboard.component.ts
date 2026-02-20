import { Component, inject, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PaymentService } from '../../../core/services/payment.service';
import { IncidentService } from '../../../core/services/incident.service';
import { PropertyService } from '../../../core/services/property.service';
import { PaymentSummary, Payment, Incident, Property, User } from '../../../core/models/interfaces';
import { cardStagger, fadeIn, tableRowAnimation } from '../../../shared/animations';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [cardStagger, fadeIn, tableRowAnimation],
})
export class OwnerDashboardComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private incidentService = inject(IncidentService);
  private propertyService = inject(PropertyService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  summary = signal<PaymentSummary | null>(null);
  currentMonthPayments = signal<Payment[]>([]);
  incidents = signal<Incident[]>([]);
  properties = signal<Property[]>([]);
  loading = signal(true);

  monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  saving = signal(false);

  paidPayments(): Payment[] {
    return this.currentMonthPayments().filter((p) => p.status === 'paid');
  }

  pendingPayments(): Payment[] {
    return this.currentMonthPayments().filter((p) => p.status === 'pending');
  }

  overduePayments(): Payment[] {
    return this.currentMonthPayments().filter((p) => p.status === 'overdue');
  }

  getCurrentMonthLabel(): string {
    const now = new Date();
    return `${this.monthNames[now.getMonth() + 1]} ${now.getFullYear()}`;
  }

  getDaysOverdue(payment: Payment): number {
    if (payment.status !== 'overdue' || !payment.dueDate) return 0;
    const due = new Date(payment.dueDate);
    const now = new Date();
    return Math.max(0, Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
  }

  getPaymentColorLevel(payment: Payment): 'green' | 'yellow' | 'red' {
    const days = this.getDaysOverdue(payment);
    if (days > 5) return 'red';
    if (days > 3) return 'yellow';
    return 'green';
  }

  markPaymentAsPaid(payment: Payment): void {
    this.saving.set(true);
    this.paymentService.markAsPaid(payment._id).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadDashboard();
      },
      error: () => this.saving.set(false),
    });
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.paymentService.getDashboardSummary().subscribe({
      next: (res) => { this.summary.set(res.data); this.cdr.detectChanges(); },
    });

    const now = new Date();
    this.paymentService.getPayments({
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
    }).subscribe({
      next: (res) => { this.currentMonthPayments.set(res.data || []); this.cdr.detectChanges(); },
    });

    this.incidentService.getIncidents({ status: 'open' }).subscribe({
      next: (res) => { this.incidents.set(res.data.slice(0, 8)); this.cdr.detectChanges(); },
    });

    this.propertyService.getProperties({ limit: 20 }).subscribe({
      next: (res) => {
        this.properties.set(res.data);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: () => { this.loading.set(false); this.cdr.detectChanges(); },
    });
  }

  getPropertyTypeEmoji(type: string): string {
    const map: Record<string, string> = { apartment: '🏢', house: '🏡', studio: '🏠', room: '🛏️', commercial: '🏪' };
    return map[type] || '🏠';
  }

  getTenantEmojiForTenant(tenant: User): string {
    if (tenant.gender === 'female') return '👩🏻';
    if (tenant.gender === 'male') return '👨🏻';
    return '🧑';
  }

  getIncidentTypeLabel(type: string): string {
    const map: Record<string, string> = {
      plumbing: '🔧 Fontanería', electrical: '⚡ Eléctrica', structural: '🧱 Estructura',
      appliance: '🔌 Electrodoméstico', heating: '🔥 Calefacción', pest: '🐛 Plagas', other: '📋 Otra',
    };
    return map[type] || type;
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = { low: 'green', medium: 'primary', high: 'yellow', urgent: 'red' };
    return map[priority] || 'gray';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada' };
    return map[status] || status;
  }

  resolveIncident(id: string): void {
    if (!confirm('¿Resolver y eliminar esta incidencia? Esta acción no se puede deshacer.')) return;
    this.incidentService.deleteIncident(id).subscribe({
      next: () => {
        this.incidents.update((items) => items.filter((i) => i._id !== id));
        this.cdr.detectChanges();
      },
    });
  }

  goToTenantProfile(tenantId: string): void {
    this.router.navigate(['/owner/tenants', tenantId]);
  }
}
