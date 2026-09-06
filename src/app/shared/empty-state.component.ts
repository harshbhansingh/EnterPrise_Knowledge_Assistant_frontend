import { Component, input } from '@angular/core';

/** Friendly placeholder for lists without content. */
@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty">
      <span class="material-symbols-outlined">{{ icon() }}</span>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      <ng-content />
    </div>
  `,
  styles: `
    .empty { text-align: center; padding: 40px 20px; color: var(--eka-muted); }
    .material-symbols-outlined { font-size: 44px; color: #b6c2d2; }
    h3 { margin: 12px 0 4px; color: var(--eka-text); font-weight: 600; }
    p { margin: 0 0 14px; }
  `
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly description = input('');
}
