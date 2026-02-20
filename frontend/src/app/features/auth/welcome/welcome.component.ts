import { Component, inject, OnInit, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private zone = inject(NgZone);

  @ViewChild('overlay') overlayRef!: ElementRef<HTMLDivElement>;
  @ViewChild('waveEmoji') waveRef!: ElementRef<HTMLDivElement>;
  @ViewChild('welcomeTitle') titleRef!: ElementRef<HTMLHeadingElement>;
  @ViewChild('dividerLine') dividerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('welcomeSubtitle') subtitleRef!: ElementRef<HTMLParagraphElement>;

  welcomeText = '';
  subtitleText = '';
  showOverlay = false;

  ngOnInit(): void {
    const user = this.authService.user();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const firstName = user.fullName?.split(' ')[0] || '';
    if (user.gender === 'female') {
      this.welcomeText = `¡Bienvenida, ${firstName}!`;
    } else if (user.gender === 'male') {
      this.welcomeText = `¡Bienvenido, ${firstName}!`;
    }

    this.subtitleText = user.role === 'owner'
      ? 'Tu panel de gestión te espera'
      : 'Nos alegra verte de nuevo';
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.startAnimation();
      });
    });
  }

  private startAnimation(): void {
    const overlay = this.overlayRef?.nativeElement;
    if (!overlay) return;

    overlay.classList.add('active');

    const particles = overlay.querySelectorAll('.w-particle');
    const floatClasses = ['w-float-1', 'w-float-2', 'w-float-3', 'w-float-4'];
    const delays = [200, 400, 600, 300, 500, 700, 350, 550];

    particles.forEach((p, i) => {
      setTimeout(() => {
        p.classList.add('animate');
        setTimeout(() => {
          p.classList.remove('animate');
          p.classList.add(floatClasses[i % 4]);
        }, 600);
      }, delays[i]);
    });

    this.waveRef?.nativeElement.classList.add('animate');
    this.titleRef?.nativeElement.classList.add('animate');
    this.dividerRef?.nativeElement.classList.add('animate');
    this.subtitleRef?.nativeElement.classList.add('animate');

    setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        this.zone.run(() => {
          const role = this.authService.user()?.role;
          this.router.navigate([role === 'owner' ? '/owner/dashboard' : '/tenant/dashboard']);
        });
      }, 900);
    }, 3500);
  }
}
