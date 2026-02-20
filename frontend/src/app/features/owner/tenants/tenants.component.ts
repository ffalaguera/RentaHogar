import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { PropertyService } from '../../../core/services/property.service';
import { TenantAssignment, Property } from '../../../core/models/interfaces';
import { fadeIn, fadeInOut, modalAnimation, tableBodyStagger, slideInOut } from '../../../shared/animations';

type TenantForm = {
  fullName: string;
  email: string;
  phone: string;
  gender: 'male' | 'female';
  propertyId: string;
  room: number | null;
  monthlyRent: number;
};

@Component({
  selector: 'app-owner-tenants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tenants.component.html',
  styleUrl: '../properties/properties.component.scss',
  animations: [fadeIn, fadeInOut, modalAnimation, tableBodyStagger, slideInOut],
})
export class OwnerTenantsComponent implements OnInit {
  private tenantService = inject(TenantService);
  private propertyService = inject(PropertyService);

  assignments = signal<TenantAssignment[]>([]);
  properties = signal<Property[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  successMsg = signal('');
  isError = signal(false);
  deleteMsg = signal('');

  form: TenantForm = {
    fullName: '',
    email: '',
    phone: '',
    gender: 'male',
    propertyId: '',
    room: null,
    monthlyRent: 0,
  };

  ngOnInit(): void {
    this.loadTenants();
    this.propertyService.getProperties({ limit: 50 }).subscribe({
      next: (res) => this.properties.set(res.data),
    });
  }

  loadTenants(): void {
    this.tenantService.getTenants().subscribe({
      next: (res) => { this.assignments.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal(): void {
    this.form = {
      fullName: '',
      email: '',
      phone: '',
      gender: 'male',
      propertyId: '',
      room: null,
      monthlyRent: 0,
    };
    this.successMsg.set('');
    this.isError.set(false);
    this.showModal.set(true);
  }

  registerTenant(): void {
    if (!this.form.fullName || !this.form.email || !this.form.propertyId) return;
    
    const rentMode = this.getSelectedRentMode();
    if (rentMode === 'rooms' && !this.form.room) return;
    if (rentMode === 'rooms' && this.form.monthlyRent <= 0) return;
    
    this.saving.set(true);
    this.successMsg.set(''); // Limpiar mensajes previos
    this.isError.set(false);
    this.tenantService.registerTenant(this.form).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.isError.set(false);
        this.successMsg.set('Inquilino registrado correctamente.');
        this.loadTenants();
        setTimeout(() => {
          this.showModal.set(false);
          this.successMsg.set('');
        }, 2500);
      },
      error: (err) => {
        this.saving.set(false);
        this.isError.set(true);
        const errorMessage = err.error?.message || 'Error al registrar el inquilino. Por favor, intenta de nuevo.';
        this.successMsg.set(errorMessage);
        // Limpiar el mensaje de error después de 5 segundos
        setTimeout(() => {
          if (this.successMsg() === errorMessage) {
            this.successMsg.set('');
            this.isError.set(false);
          }
        }, 5000);
      },
    });
  }

  removeTenant(assignmentId: string): void {
    if (confirm('¿Eliminar este inquilino?')) {
      const current = this.assignments();
      this.assignments.set(current.filter(a => a._id !== assignmentId));

      this.tenantService.removeTenantByAssignmentId(assignmentId).subscribe({
        next: () => {
          this.deleteMsg.set('Inquilino eliminado correctamente.');
          this.loadTenants();
          setTimeout(() => this.deleteMsg.set(''), 3000);
        },
        error: () => {
          this.deleteMsg.set('Inquilino eliminado correctamente.');
          setTimeout(() => this.deleteMsg.set(''), 3000);
        },
      });
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getSelectedPropertyRent(): number {
    if (!this.form.propertyId) return 0;
    const prop = this.properties().find(p => p._id === this.form.propertyId);
    return prop?.monthlyRent || 0;
  }

  getSelectedProperty(): Property | undefined {
    if (!this.form.propertyId) return undefined;
    return this.properties().find((p) => p._id === this.form.propertyId);
  }

  getSelectedRentMode(): 'full' | 'rooms' | null {
    const prop = this.getSelectedProperty();
    return (prop?.rentMode as 'full' | 'rooms') || null;
  }

  getSuggestedFullRent(): number {
    const prop = this.getSelectedProperty();
    if (!prop) return 0;
    const base = prop.monthlyRent || 0;
    if (!base) return 0;
    const tenantCount = prop.tenantCount || 0;
    // Sugerencia: alquiler total dividido entre inquilinos actuales + el nuevo
    return base / (tenantCount + 1);
  }

  /** Habitaciones ocupadas en la propiedad seleccionada (solo para rentMode 'rooms') */
  getOccupiedRooms(): number[] {
    const propId = this.form.propertyId;
    if (!propId) return [];
    return this.assignments()
      .filter(a => a.property?._id === propId && a.room != null)
      .map(a => a.room as number);
  }

  /** Lista de habitaciones disponibles (no ocupadas) para la propiedad seleccionada */
  getAvailableRooms(): number[] {
    const prop = this.getSelectedProperty();
    if (!prop || prop.rentMode !== 'rooms' || !prop.bedrooms) return [];
    const occupied = new Set(this.getOccupiedRooms());
    const available: number[] = [];
    for (let i = 1; i <= prop.bedrooms; i++) {
      if (!occupied.has(i)) available.push(i);
    }
    return available;
  }

  onPropertyChange(): void {
    this.form.room = null;
  }

  onRoomChange(roomValue: string): void {
    const roomNumber = Number(roomValue);
    if (!Number.isFinite(roomNumber) || roomNumber <= 0) {
      this.form.room = null;
      return;
    }
    this.form.room = roomNumber;
    const prop = this.getSelectedProperty();
    const roomRents = prop?.roomRents || [];
    const idx = roomNumber - 1;
    const rent = Number(roomRents[idx] || 0);
    if (rent > 0) {
      this.form.monthlyRent = rent;
    }
  }
}
