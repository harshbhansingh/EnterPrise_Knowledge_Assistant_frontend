import { LowerCasePipe } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { DocumentStatus, DocumentSummary, PageResponse } from '../../core/models/api.models';
import { DocumentService } from '../../core/services/document.service';
import { NotificationService } from '../../core/services/notification.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { FileSizePipe, RelativeTimePipe } from '../../shared/pipes';
import { StatusChipComponent } from '../../shared/status-chip.component';

const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.docx'];
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const POLL_INTERVAL_MS = 2500;

/** Document library: upload with progress, paged list with status, delete and re-index actions. */
@Component({
  selector: 'app-documents',
  imports: [LowerCasePipe, RouterLink, MatButtonModule, MatMenuModule, MatPaginatorModule, MatProgressBarModule,
    MatProgressSpinnerModule, MatTooltipModule, StatusChipComponent, EmptyStateComponent, FileSizePipe, RelativeTimePipe],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent implements OnInit, OnDestroy {
  private readonly documentService = inject(DocumentService);
  private readonly notifications = inject(NotificationService);
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly page = signal<PageResponse<DocumentSummary> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly statusFilter = signal<DocumentStatus | null>(null);
  protected readonly uploadProgress = signal<number | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly uploadingName = signal<string | null>(null);
  protected readonly dragging = signal(false);
  protected readonly busyIds = signal<Set<string>>(new Set());
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);
  protected readonly acceptedExtensions = ACCEPTED_EXTENSIONS.join(',');
  protected readonly statuses: DocumentStatus[] = ['UPLOADED', 'PROCESSING', 'INDEXED', 'FAILED', 'DELETED'];

  ngOnInit(): void {
    this.load();
    this.pollHandle = setInterval(() => this.refreshIfProcessing(), POLL_INTERVAL_MS);
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
    this.error.set(null);
    this.documentService.list(this.pageIndex(), this.pageSize(), this.statusFilter() ?? undefined).subscribe({
      next: page => {
        this.page.set(page);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(this.notifications.describe(err, 'Could not load documents'));
        this.loading.set(false);
      }
    });
  }

  protected setFilter(status: DocumentStatus | null): void {
    this.statusFilter.set(status);
    this.pageIndex.set(0);
    this.load();
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.upload(file);
    }
    input.value = '';
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.upload(file);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(): void {
    this.dragging.set(false);
  }

  protected upload(file: File): void {
    this.uploadError.set(null);
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      this.uploadError.set('Only PDF, TXT and DOCX files are supported.');
      return;
    }
    if (file.size === 0) {
      this.uploadError.set('The selected file is empty.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      this.uploadError.set('The file exceeds the 20 MB limit.');
      return;
    }
    this.uploadingName.set(file.name);
    this.uploadProgress.set(0);
    this.documentService.upload(file).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response) {
          this.uploadProgress.set(null);
          this.uploadingName.set(null);
          this.notifications.success(`"${file.name}" uploaded. Indexing has started.`);
          this.pageIndex.set(0);
          this.load(false);
        }
      },
      error: err => {
        this.uploadProgress.set(null);
        this.uploadingName.set(null);
        this.uploadError.set(this.notifications.describe(err, 'Upload failed'));
      }
    });
  }

  protected reindex(doc: DocumentSummary): void {
    this.markBusy(doc.id, true);
    this.documentService.reindex(doc.id).subscribe({
      next: () => {
        this.notifications.success(`Re-indexing "${doc.filename}"`);
        this.markBusy(doc.id, false);
        this.load(false);
      },
      error: err => {
        this.notifications.error(this.notifications.describe(err, 'Re-index failed'));
        this.markBusy(doc.id, false);
      }
    });
  }

  protected remove(doc: DocumentSummary): void {
    if (!confirm(`Delete "${doc.filename}"? Its chunks will be removed from the knowledge base.`)) {
      return;
    }
    this.markBusy(doc.id, true);
    this.documentService.delete(doc.id).subscribe({
      next: () => {
        this.notifications.success(`"${doc.filename}" deleted`);
        this.markBusy(doc.id, false);
        this.load(false);
      },
      error: err => {
        this.notifications.error(this.notifications.describe(err, 'Delete failed'));
        this.markBusy(doc.id, false);
      }
    });
  }

  protected isBusy(id: string): boolean {
    return this.busyIds().has(id);
  }

  private markBusy(id: string, busy: boolean): void {
    const next = new Set(this.busyIds());
    if (busy) {
      next.add(id);
    } else {
      next.delete(id);
    }
    this.busyIds.set(next);
  }

  /** Polls while any visible document is still being indexed so statuses update without a refresh. */
  private refreshIfProcessing(): void {
    const current = this.page();
    if (current?.content.some(doc => doc.status === 'UPLOADED' || doc.status === 'PROCESSING')) {
      this.load(false);
    }
  }
}
