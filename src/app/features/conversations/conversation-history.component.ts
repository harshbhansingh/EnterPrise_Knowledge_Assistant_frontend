import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Conversation, PageResponse } from '../../core/models/api.models';
import { ConversationService } from '../../core/services/conversation.service';
import { NotificationService } from '../../core/services/notification.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { RelativeTimePipe } from '../../shared/pipes';

/** Paged list of all conversations with open/delete actions. */
@Component({
  selector: 'app-conversation-history',
  imports: [RouterLink, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule, EmptyStateComponent, RelativeTimePipe],
  template: `
    <div class="eka-page">
      <h1 class="eka-page-title">Conversation history</h1>
      <p class="eka-page-subtitle">Every question you asked, with the answers and their sources.</p>
      <section class="eka-card">
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="32" /></div>
        } @else if (error()) {
          <div class="eka-error-banner"><span class="material-symbols-outlined">error</span> {{ error() }}
            <button mat-button (click)="load()">Retry</button></div>
        } @else if (page(); as p) {
          @if (p.content.length === 0) {
            <app-empty-state icon="history" title="No conversations yet" description="Start chatting to build your history.">
              <a mat-flat-button routerLink="/chat">Open chat</a>
            </app-empty-state>
          } @else {
            <ul class="list">
              @for (conversation of p.content; track conversation.id) {
                <li>
                  <a class="main" [routerLink]="['/chat', conversation.id]">
                    <span class="material-symbols-outlined">chat_bubble</span>
                    <span class="text">
                      <strong>{{ conversation.title }}</strong>
                      <small>{{ conversation.messageCount }} messages &middot; created {{ conversation.createdAt | relativeTime }} &middot; last activity {{ conversation.updatedAt | relativeTime }}</small>
                    </span>
                  </a>
                  <div class="actions">
                    <a mat-stroked-button [routerLink]="['/chat', conversation.id]">Open</a>
                    <button mat-button class="danger" (click)="remove(conversation)">Delete</button>
                  </div>
                </li>
              }
            </ul>
            <mat-paginator [length]="p.totalElements" [pageIndex]="p.page" [pageSize]="p.size" [pageSizeOptions]="[10, 20, 50]" (page)="onPage($event)" />
          }
        }
      </section>
    </div>
  `,
  styles: `
    .loading { display: flex; justify-content: center; padding: 40px; }
    .list { list-style: none; margin: 0; padding: 0; }
    .list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 4px; border-bottom: 1px solid var(--eka-border); }
    .list li:last-child { border-bottom: none; }
    .main { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; min-width: 0; flex: 1; }
    .main .material-symbols-outlined { color: var(--eka-primary); }
    .text { display: flex; flex-direction: column; min-width: 0; }
    .text strong { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .text small { color: var(--eka-muted); }
    .actions { display: flex; gap: 6px; }
    .danger { color: var(--eka-danger); }
  `
})
export class ConversationHistoryComponent implements OnInit {
  private readonly conversationService = inject(ConversationService);
  private readonly notifications = inject(NotificationService);

  protected readonly page = signal<PageResponse<Conversation> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(10);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.conversationService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: page => {
        this.page.set(page);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(this.notifications.describe(err, 'Could not load conversations'));
        this.loading.set(false);
      }
    });
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected remove(conversation: Conversation): void {
    if (!confirm(`Delete "${conversation.title}"?`)) {
      return;
    }
    this.conversationService.delete(conversation.id).subscribe({
      next: () => {
        this.notifications.success('Conversation deleted');
        this.load();
      },
      error: err => this.notifications.error(this.notifications.describe(err, 'Delete failed'))
    });
  }
}
