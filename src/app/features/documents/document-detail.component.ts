import { Component, OnDestroy, OnInit, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { DocumentChunk, DocumentSummary, PageResponse } from '../../core/models/api.models';
import { DocumentService } from '../../core/services/document.service';
import { NotificationService } from '../../core/services/notification.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { FileSizePipe, RelativeTimePipe } from '../../shared/pipes';
import { StatusChipComponent } from '../../shared/status-chip.component';

const POLL_INTERVAL_MS = 2500;

/** Metadata, processing status and stored chunks of one document. */
@Component({
  selector: 'app-document-detail',
  imports: [RouterLink, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule, StatusChipComponent,
    EmptyStateComponent, FileSizePipe, RelativeTimePipe],
  templateUrl: './document-detail.component.html',
  styleUrl: './document-detail.component.scss'
})
export class DocumentDetailComponent implements OnInit, OnDestroy {
  readonly id = input.required<string>();

  private readonly documentService = inject(DocumentService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly document = signal<DocumentSummary | null>(null);
  protected readonly chunks = signal<PageResponse<DocumentChunk> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly chunkPage = signal(0);

  ngOnInit(): void {
    this.load();
    this.pollHandle = setInterval(() => {
      const status = this.document()?.status;
      if (status === 'UPLOADED' || status === 'PROCESSING') {
        this.load(false);
      }
    }, POLL_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
    }
  }

  protected load(showSpinner = true): void {
    if (showSpinner) {
      this.loading.set(true);
    }
    this.documentService.get(this.id()).subscribe({
      next: doc => {
        this.document.set(doc);
        this.loading.set(false);
        this.loadChunks();
      },
      error: err => {
        this.error.set(this.notifications.describe(err, 'Document not found'));
        this.loading.set(false);
      }
    });
  }

  protected loadChunks(): void {
    this.documentService.chunks(this.id(), this.chunkPage(), 10).subscribe({
      next: page => this.chunks.set(page),
      error: () => this.chunks.set(null)
    });
  }

  protected onChunkPage(event: PageEvent): void {
    this.chunkPage.set(event.pageIndex);
    this.loadChunks();
  }

  protected metadataEntries(): { key: string; value: string }[] {
    const metadata = this.document()?.metadata ?? {};
    return Object.entries(metadata).map(([key, value]) => ({ key, value: String(value) }));
  }

  protected sectionOf(chunk: DocumentChunk): string | null {
    const section = chunk.metadata?.['section'];
    return typeof section === 'string' ? section : null;
  }

  protected reindex(): void {
    this.busy.set(true);
    this.documentService.reindex(this.id()).subscribe({
      next: doc => {
        this.document.set(doc);
        this.busy.set(false);
        this.notifications.success('Re-indexing started');
      },
      error: err => {
        this.busy.set(false);
        this.notifications.error(this.notifications.describe(err, 'Re-index failed'));
      }
    });
  }

  protected remove(): void {
    const doc = this.document();
    if (!doc || !confirm(`Delete "${doc.filename}"?`)) {
      return;
    }
    this.busy.set(true);
    this.documentService.delete(doc.id).subscribe({
      next: () => {
        this.notifications.success('Document deleted');
        void this.router.navigate(['/documents']);
      },
      error: err => {
        this.busy.set(false);
        this.notifications.error(this.notifications.describe(err, 'Delete failed'));
      }
    });
  }
}
