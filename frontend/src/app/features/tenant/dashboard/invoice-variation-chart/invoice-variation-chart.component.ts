import {
  Component,
  inject,
  signal,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { Invoice, InvoiceType } from '../../../../core/models/interfaces';
import { Chart, ChartConfiguration } from 'chart.js/auto';

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const CHART_TYPES: { type: InvoiceType; label: string; color: string }[] = [
  { type: 'water', label: 'Agua', color: 'rgb(59, 130, 246)' },
  { type: 'electricity', label: 'Electricidad', color: 'rgb(234, 179, 8)' },
  { type: 'internet', label: 'Internet', color: 'rgb(34, 197, 94)' },
  { type: 'gas', label: 'Gas', color: 'rgb(249, 115, 22)' },
];

@Component({
  selector: 'app-invoice-variation-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-variation-chart.component.html',
  styleUrls: ['./invoice-variation-chart.component.scss'],
})
export class InvoiceVariationChartComponent implements OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private invoiceService = inject(InvoiceService);

  loading = signal(true);
  error = signal<string | null>(null);
  hasData = signal(false);

  private chart: Chart<'bar'> | null = null;

  constructor() {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    this.invoiceService.getTenantInvoices().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          const chartData = this.buildChartData(res.data);
          this.hasData.set(chartData.hasAnyData);
          if (chartData.hasAnyData) {
            this.scheduleChartBuild(chartData);
          }
        } else {
          this.hasData.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar las facturas.');
        this.hasData.set(false);
      },
    });
  }

  private buildChartData(invoices: Invoice[]): {
    labels: string[];
    datasets: { label: string; data: number[]; backgroundColor: string }[];
    hasAnyData: boolean;
  } {
    const year = new Date().getFullYear();
    const byTypeAndMonth = new Map<string, number>();

    for (const inv of invoices) {
      if (!inv.periodStart || inv.periodStart.year !== year) continue;
      const type = inv.type as InvoiceType;
      if (!CHART_TYPES.some(c => c.type === type)) continue;

      const key = `${type}|${inv.periodStart.month}`;
      const existing = byTypeAndMonth.get(key) ?? 0;
      byTypeAndMonth.set(key, existing + inv.amount);
    }

    const labels = MONTH_NAMES;
    const datasets = CHART_TYPES.map(({ type, label, color }) => {
      const data = MONTH_NAMES.map((_, i) => {
        const key = `${type}|${i + 1}`;
        return byTypeAndMonth.get(key) ?? 0;
      });
      return { label, data, backgroundColor: color };
    });

    const hasAnyData = datasets.some(d => d.data.some(v => v > 0));

    return { labels, datasets, hasAnyData };
  }

  private scheduleChartBuild(chartData: {
    labels: string[];
    datasets: { label: string; data: number[]; backgroundColor: string }[];
  }): void {
    let attempts = 0;
    const maxAttempts = 20;
    const tryBuild = () => {
      if (this.chartCanvas?.nativeElement) {
        this.buildChart(chartData);
      } else if (attempts++ < maxAttempts) {
        setTimeout(tryBuild, 50);
      }
    };
    setTimeout(tryBuild, 0);
  }

  private buildChart(chartData: {
    labels: string[];
    datasets: { label: string; data: number[]; backgroundColor: string }[];
  }): void {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;

    this.chart?.destroy();

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: chartData.datasets.map(d => ({
          label: d.label,
          data: d.data,
          backgroundColor: d.backgroundColor,
          borderColor: d.backgroundColor,
          borderWidth: 1,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 16,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: false,
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: { size: 10 },
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Importe (€)',
              font: { size: 12 },
            },
          },
        },
      },
    };

    this.chart = new Chart(canvas, config);
  }

}
