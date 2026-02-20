import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models/interfaces';
import { fadeIn, modalAnimation, cardStagger } from '../../../shared/animations';

@Component({
  selector: 'app-owner-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
  animations: [fadeIn, modalAnimation, cardStagger],
})
export class OwnerPropertiesComponent implements OnInit {
  private propertyService = inject(PropertyService);

  properties = signal<Property[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingProperty = signal<Property | null>(null);
  saving = signal(false);

  form = {
    name: '', type: 'apartment' as string,
    street: '', city: '', postalCode: '', country: 'España',
    monthlyRent: 0,
    // Modo de alquiler: 'full' (completo) o 'rooms' (por habitaciones)
    rentMode: 'full' as 'full' | 'rooms',
    // Lista de alquileres por habitación cuando rentMode === 'rooms'
    roomRents: [] as number[],
    bedrooms: 1, bathrooms: 1, squareMeters: 0, description: '',
  };

  typeLabels: Record<string, string> = {
    apartment: 'Piso', house: 'Casa', studio: 'Estudio', room: 'Habitación', commercial: 'Local',
  };

  typeEmojis: Record<string, string> = {
    apartment: '🏢', house: '🏡', studio: '🏠', room: '🚪', commercial: '🏪',
  };

  /** Icono y etiqueta del tipo de contrato */
  rentModeConfig: Record<string, { icon: string; label: string }> = {
    full: { icon: '📄', label: 'Contrato vivienda completa' },
    rooms: { icon: '📄', label: 'Contrato por habitaciones' },
  };

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.propertyService.getProperties({ limit: 50 }).subscribe({
      next: (res) => { this.properties.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openNewModal(): void {
    this.editingProperty.set(null);
    this.form = {
      name: '',
      type: 'apartment',
      street: '',
      city: '',
      postalCode: '',
      country: 'España',
      monthlyRent: 0,
      rentMode: 'full',
      roomRents: [],
      bedrooms: 1,
      bathrooms: 1,
      squareMeters: 0,
      description: '',
    };
    this.showModal.set(true);
  }

  openEditModal(prop: Property): void {
    this.editingProperty.set(prop);
    this.form = {
      name: prop.name,
      type: prop.type,
      street: prop.address.street,
      city: prop.address.city,
      postalCode: prop.address.postalCode,
      country: prop.address.country || 'España',
      monthlyRent: prop.monthlyRent,
      rentMode: prop.rentMode || 'full',
      roomRents: prop.roomRents ? [...prop.roomRents] : [],
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      squareMeters: prop.squareMeters,
      description: prop.description || '',
    };
    this.showModal.set(true);
  }

  saveProperty(): void {
    this.saving.set(true);
    // Cuando la propiedad es por habitaciones, calculamos el alquiler total
    // como la suma de los alquileres de cada habitación.
    let monthlyRent = this.form.monthlyRent;
    if (this.form.rentMode === 'rooms') {
      monthlyRent = (this.form.roomRents || []).reduce(
        (sum, val) => sum + Number(val || 0),
        0,
      );
    }

    const data = {
      name: this.form.name, type: this.form.type,
      address: { street: this.form.street, city: this.form.city, postalCode: this.form.postalCode, country: this.form.country },
      monthlyRent,
      rentMode: this.form.rentMode,
      roomRents: this.form.rentMode === 'rooms' ? this.form.roomRents : [],
      bedrooms: this.form.bedrooms,
      bathrooms: this.form.bathrooms, squareMeters: this.form.squareMeters, description: this.form.description,
    };

    const editing = this.editingProperty();
    const obs = editing
      ? this.propertyService.updateProperty(editing._id, data)
      : this.propertyService.createProperty(data);

    obs.subscribe({
      next: () => { this.saving.set(false); this.showModal.set(false); this.loadProperties(); },
      error: () => this.saving.set(false),
    });
  }

  getBedroomNumbers(): number[] {
    const count = this.form.bedrooms || 0;
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  deleteProperty(id: string): void {
    if (confirm('¿Seguro que quieres eliminar esta propiedad?')) {
      this.propertyService.deleteProperty(id).subscribe(() => this.loadProperties());
    }
  }
}
