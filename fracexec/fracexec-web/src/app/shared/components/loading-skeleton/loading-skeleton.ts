import { Component, Input } from '@angular/core';

export type SkeletonType = 'card' | 'list' | 'table';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  template: `
    <div class="skeleton-wrapper" role="status" aria-label="Carregando">
      @if (type === 'card') {
        <div class="skeleton-block skeleton-card"></div>
      } @else if (type === 'list') {
        @for (item of listRows; track item) {
          <div class="skeleton-block skeleton-line"></div>
        }
      } @else if (type === 'table') {
        <div class="skeleton-block skeleton-header"></div>
        @for (item of tableRows; track item) {
          <div class="skeleton-block skeleton-row"></div>
        }
      }
    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .skeleton-block {
      background: linear-gradient(
        90deg,
        var(--color-surface-muted)  25%,
        var(--color-border-default) 50%,
        var(--color-surface-muted)  75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius-sm);
      display: block;
      width: 100%;
    }

    /* card: single tall block */
    .skeleton-card {
      height: 200px;
    }

    /* list: 3 rows of 56px with 8px gap */
    .skeleton-line {
      height: 56px;
      margin-bottom: var(--spacing-2);
    }
    .skeleton-line:last-child {
      margin-bottom: 0;
    }

    /* table: header + 4 rows of 40px */
    .skeleton-header {
      height: 40px;
      margin-bottom: 2px;
    }
    .skeleton-row {
      height: 40px;
      margin-bottom: 2px;
    }
    .skeleton-row:last-child {
      margin-bottom: 0;
    }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class LoadingSkeleton {
  @Input({ required: true }) type!: SkeletonType;

  readonly listRows  = [1, 2, 3];
  readonly tableRows = [1, 2, 3, 4];
}
