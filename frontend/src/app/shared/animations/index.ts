import {
  trigger,
  transition,
  style,
  animate,
  query,
  stagger,
  group,
  state,
} from '@angular/animations';

export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(12px)' }),
    animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

export const fadeInUp = trigger('fadeInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' })),
  ]),
]);

export const slideInOut = trigger('slideInOut', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-10px)' }),
    animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' })),
  ]),
]);

export const listStagger = trigger('listStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(15px)' }),
      stagger(60, [
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

export const cardStagger = trigger('cardStagger', [
  transition(':enter', [
    query('.c-stat-card, .c-card, .l-dashboard__half, .l-dashboard__full', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger(120, [
        animate('500ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);

export const modalAnimation = trigger('modalAnimation', [
  transition(':enter', [
    group([
      query('.c-modal__content', [
        style({ opacity: 0, transform: 'scale(0.85) translateY(20px)' }),
        animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      ], { optional: true }),
      style({ backgroundColor: 'rgba(0,0,0,0)' }),
      animate('200ms ease-out', style({ backgroundColor: 'rgba(0,0,0,0.5)' })),
    ]),
  ]),
  transition(':leave', [
    group([
      query('.c-modal__content', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' })),
      ], { optional: true }),
      animate('200ms ease-in', style({ backgroundColor: 'rgba(0,0,0,0)' })),
    ]),
  ]),
]);

export const routeAnimation = trigger('routeAnimation', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({ position: 'absolute', top: 0, left: 0, width: '100%' }),
    ], { optional: true }),
    query(':leave', [
      style({ opacity: 1 }),
      animate('150ms ease-in', style({ opacity: 0 })),
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 }),
      animate('250ms ease-out', style({ opacity: 1 })),
    ], { optional: true }),
  ]),
]);

export const spinPulse = trigger('spinPulse', [
  state('saving', style({ opacity: 0.7, transform: 'scale(0.98)' })),
  state('idle', style({ opacity: 1, transform: 'scale(1)' })),
  transition('idle => saving', [
    animate('200ms ease-in'),
  ]),
  transition('saving => idle', [
    animate('250ms ease-out'),
  ]),
]);

export const tableRowAnimation = trigger('tableRowAnimation', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-10px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
  transition(':leave', [
    animate('250ms ease-in', style({ opacity: 0, transform: 'translateX(10px)', height: 0, padding: 0, margin: 0 })),
  ]),
]);

export const tableBodyStagger = trigger('tableBodyStagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(8px)' }),
      stagger(40, [
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ], { optional: true }),
  ]),
]);
