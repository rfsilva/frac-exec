import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    @if (breadcrumb && breadcrumb.length) {
      <!-- P5: aria-label distinto do sidebar ("Menu de navegação") -->
      <nav class="breadcrumb" aria-label="Localização atual">
        <!-- P3: track $index evita colisão com valores duplicados -->
        @for (crumb of breadcrumb; track $index; let last = $last) {
          <!-- P6: aria-current="page" no último item para screen readers -->
          <span
            class="crumb"
            [class.crumb--current]="last"
            [attr.aria-current]="last ? 'page' : null"
          >{{ crumb }}</span>
          @if (!last) { <span class="sep" aria-hidden="true">/</span> }
        }
      </nav>
    }
    <h1 class="page-title">{{ title }}</h1>
  `,
  styles: [`
    :host {
      display: block;
      padding: var(--spacing-5) var(--spacing-6);
      border-bottom: 1px solid var(--color-border-default);
      background-color: var(--color-surface-card);
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      margin-bottom: var(--spacing-1);
    }

    .crumb {
      font-size: 12px;
      color: var(--color-text-muted);
      font-family: var(--font-body);
    }

    .crumb--current {
      color: var(--color-text-secondary);
      font-weight: 500;
    }

    .sep {
      color: var(--color-text-muted);
      font-size: 12px;
    }

    .page-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1.3;
    }
  `]
})
export class PageHeader {
  @Input({ required: true }) title!: string;
  @Input() breadcrumb?: string[];
}
