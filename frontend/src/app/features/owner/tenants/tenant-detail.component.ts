import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { TenantAssignment } from '../../../core/models/interfaces';

@Component({
  selector: 'app-owner-tenant-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="l-page" *ngIf="assignment()">
      <header class="l-page__header">
        <div>
          <h2 class="l-page__title">Perfil del inquilino</h2>
          <p class="l-page__subtitle">Detalles del inquilino y su vivienda</p>
        </div>
        <div class="l-page__actions">
          <a routerLink="/owner/tenants" class="c-button c-button--secondary">← Volver a inquilinos</a>
        </div>
      </header>

      <div class="l-grid l-grid--2 g-mb-6">
        <article class="c-card">
          <div class="c-card__body">
            <div class="l-flex l-flex--gap-4" style="align-items: center;">
              <div class="c-avatar c-avatar--lg">
                {{ getInitials(assignment()!.tenant.fullName) }}
              </div>
              <div>
                <h3 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.25rem;">
                  {{ assignment()!.tenant.fullName }}
                </h3>
                <p style="color: #4a5568; margin-bottom: 0.25rem;">{{ assignment()!.tenant.email }}</p>
                <p style="color: #4a5568; margin-bottom: 0.25rem;" *ngIf="assignment()!.tenant.phone">
                  📞 {{ assignment()!.tenant.phone }}
                </p>
                <p style="color: #4a5568;" *ngIf="assignment()!.tenant.gender">
                  Sexo: {{ assignment()!.tenant.gender === 'male' ? 'Hombre' : 'Mujer' }}
                </p>
              </div>
            </div>
          </div>
        </article>

        <article class="c-card">
          <div class="c-card__body">
            <h3 class="c-card__title">Vivienda asignada</h3>
            <p><strong>Propiedad:</strong> {{ assignment()!.property.name }}</p>
            <p><strong>Alquiler:</strong> {{ (assignment()!.monthlyRent ?? assignment()!.property.monthlyRent) | number:'1.2-2' }}€/mes</p>
            <p><strong>Dirección:</strong>
              {{ assignment()!.property.address.street }},
              {{ assignment()!.property.address.city }}
              {{ assignment()!.property.address.postalCode }}
            </p>
            <p *ngIf="assignment()!.startDate"><strong>Desde:</strong> {{ assignment()!.startDate | date:'dd/MM/yyyy' }}</p>
          </div>
        </article>
      </div>
    </section>

    <div class="c-empty" *ngIf="!assignment()">
      <p class="c-empty__icon">🔍</p>
      <p class="c-empty__title">Inquilino no encontrado</p>
      <p class="c-empty__text">Revisa que el enlace sea correcto.</p>
      <a routerLink="/owner/tenants" class="c-button c-button--secondary">Volver a inquilinos</a>
    </div>
  `,
})
export class OwnerTenantDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tenantService = inject(TenantService);

  assignment = signal<TenantAssignment | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.tenantService.getTenantById(id).subscribe({
      next: (res) => this.assignment.set(res.data),
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}

