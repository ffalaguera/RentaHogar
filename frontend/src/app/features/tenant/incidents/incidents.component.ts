import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentService } from '../../../core/services/incident.service';
import { Incident } from '../../../core/models/interfaces';
import { fadeIn, modalAnimation, fadeInOut } from '../../../shared/animations';

@Component({
  selector: 'app-tenant-incidents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidents.component.html',
  styleUrl: '../../owner/properties/properties.component.scss',
  animations: [fadeIn, modalAnimation, fadeInOut],
})
export class TenantIncidentsComponent implements OnInit {
  incidentService = inject(IncidentService);

  incidents = signal<Incident[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  successMsg = signal('');

  form = { title: '', description: '', type: 'plumbing' as string, priority: 'medium' as string };

  typeLabels: Record<string, string> = {
    plumbing: '🔧 Fontanería', electrical: '⚡ Eléctrica', structural: '🧱 Estructura',
    appliance: '🔌 Electrodoméstico', heating: '🔥 Calefacción', pest: '🐛 Plagas', other: '📋 Otra',
  };

  statusLabels: Record<string, string> = {
    open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada',
  };

  statusClasses: Record<string, string> = {
    open: 'red', in_progress: 'yellow', resolved: 'green', closed: 'gray',
  };

  ngOnInit(): void {
    this.loadIncidents();
  }

  loadIncidents(): void {
    this.incidentService.getIncidents().subscribe({
      next: (res: any) => { this.incidents.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal(): void {
    this.form = { title: '', description: '', type: 'plumbing', priority: 'medium' };
    this.successMsg.set('');
    this.showModal.set(true);
  }

  submitIncident(): void {
    if (!this.form.title || !this.form.description) return;
    this.saving.set(true);
    this.incidentService.createIncident(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMsg.set('¡Incidencia enviada! Tu casero ha sido notificado por email.');
        this.loadIncidents();
        setTimeout(() => this.showModal.set(false), 2500);
      },
      error: () => this.saving.set(false),
    });
  }
}
