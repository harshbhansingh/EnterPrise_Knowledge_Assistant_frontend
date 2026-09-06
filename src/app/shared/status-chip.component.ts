import { Component, computed, input } from '@angular/core';
import { DocumentStatus } from '../core/models/api.models';

const LABELS: Record<DocumentStatus, { label: string; icon: string; css: string }> = {
  UPLOADED: { label: 'Uploaded', icon: 'schedule', css: 'info' },
  PROCESSING: { label: 'Processing', icon: 'autorenew', css: 'warning' },
  INDEXED: { label: 'Indexed', icon: 'check_circle', css: 'success' },
  FAILED: { label: 'Failed', icon: 'error', css: 'danger' },
  DELETED: { label: 'Deleted', icon: 'delete', css: 'muted' }
};

/** Coloured pill showing a document processing status. */
@Component({
  selector: 'app-status-chip',
  template: `
    <span class="chip" [class]="'chip chip-' + meta().css" [class.spin]="status() === 'PROCESSING'">
      <span class="material-symbols-outlined icon">{{ meta().icon }}</span>
      {{ meta().label }}
    </span>
  `,
  styles: `
    .chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
    .icon { font-size: 16px; }
    .chip-info { background: var(--eka-info-soft); color: var(--eka-info); }
    .chip-warning { background: var(--eka-warning-soft); color: var(--eka-warning); }
    .chip-success { background: var(--eka-success-soft); color: var(--eka-success); }
    .chip-danger { background: var(--eka-danger-soft); color: var(--eka-danger); }
    .chip-muted { background: #eef0f3; color: var(--eka-muted); }
    .spin .icon { animation: rotate 1.4s linear infinite; }
    @keyframes rotate { to { transform: rotate(360deg); } }
  `
})
export class StatusChipComponent {
  readonly status = input.required<DocumentStatus>();
  protected readonly meta = computed(() => LABELS[this.status()] ?? LABELS.UPLOADED);
}
