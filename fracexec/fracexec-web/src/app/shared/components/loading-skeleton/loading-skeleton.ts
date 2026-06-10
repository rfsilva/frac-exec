import { Component, Input } from '@angular/core';

export type SkeletonType = 'card' | 'list' | 'table';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  templateUrl: './loading-skeleton.html',
  styleUrl: './loading-skeleton.scss'
})
export class LoadingSkeleton {
  @Input({ required: true }) type!: SkeletonType;

  readonly listRows  = [1, 2, 3];
  readonly tableRows = [1, 2, 3, 4];
}
