import { Component, ElementRef, OnInit, effect, inject, input, signal, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { Conversation, Message, SystemInfo } from '../../core/models/api.models';
import { ConversationService } from '../../core/services/conversation.service';
import { NotificationService } from '../../core/services/notification.service';
import { SystemService } from '../../core/services/system.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { RelativeTimePipe } from '../../shared/pipes';
import { SourceListComponent } from '../../shared/source-list.component';

const SUGGESTIONS = [
  'What is the annual leave policy?',
  'What is the expense reimbursement limit?',
  'Who approves travel expenses?',
  'What is the password policy?',
  'What happens if an employee loses their company laptop?'
];

/**
 * Chat page: conversation list on the left, messages in the centre. Each assistant message shows
 * the sources it was grounded on. Follow-up questions reuse the conversation history server-side.
 */
@Component({
  selector: 'app-chat',
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatTooltipModule, SourceListComponent, EmptyStateComponent, RelativeTimePipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit {
  /** Bound from the route (chat/:id); undefined on /chat. */
  readonly id = input<string>();

  private readonly conversationService = inject(ConversationService);
  private readonly notifications = inject(NotificationService);
  private readonly systemService = inject(SystemService);
  private readonly router = inject(Router);
  private readonly messageList = viewChild<ElementRef<HTMLElement>>('messageList');

  protected readonly systemInfo = signal<SystemInfo | null>(null);
  protected readonly conversations = signal<Conversation[]>([]);
  protected readonly conversationsLoading = signal(true);
  protected readonly active = signal<Conversation | null>(null);
  protected readonly messages = signal<Message[]>([]);
  protected readonly messagesLoading = signal(false);
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly question = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(4000)] });
  protected readonly suggestions = SUGGESTIONS;

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) {
        this.openConversation(id);
      } else {
        this.active.set(null);
        this.messages.set([]);
      }
    });
  }

  ngOnInit(): void {
    this.loadConversations();
    this.systemService.info().subscribe({
      next: info => this.systemInfo.set(info),
      error: () => this.systemInfo.set(null)
    });
  }

  protected loadConversations(): void {
    this.conversationsLoading.set(true);
    this.conversationService.list().subscribe({
      next: page => {
        this.conversations.set(page.content);
        this.conversationsLoading.set(false);
      },
      error: err => {
        this.conversationsLoading.set(false);
        this.notifications.error(this.notifications.describe(err, 'Could not load conversations'));
      }
    });
  }

  protected openConversation(id: string): void {
    this.messagesLoading.set(true);
    this.error.set(null);
    this.conversationService.get(id).subscribe({
      next: detail => {
        this.active.set(detail.conversation);
        this.messages.set(detail.messages);
        this.messagesLoading.set(false);
        this.scrollToBottom();
      },
      error: err => {
        this.messagesLoading.set(false);
        this.error.set(this.notifications.describe(err, 'Conversation not found'));
      }
    });
  }

  protected startNew(): void {
    void this.router.navigate(['/chat']);
    this.question.reset('');
  }

  protected useSuggestion(text: string): void {
    this.question.setValue(text);
    this.send();
  }

  /** The composer is a plain form (no FormGroup), so the native submit must be intercepted here. */
  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.send();
  }

  protected onEnter(event: Event): void {
    const keyboard = event as KeyboardEvent;
    if (!keyboard.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  protected send(): void {
    const text = this.question.value.trim();
    if (!text || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.error.set(null);
    const current = this.active();
    if (current) {
      this.sendTo(current.id, text);
      return;
    }
    this.conversationService.create().subscribe({
      next: conversation => {
        this.active.set(conversation);
        this.conversations.update(list => [conversation, ...list]);
        this.sendTo(conversation.id, text);
        void this.router.navigate(['/chat', conversation.id], { replaceUrl: true });
      },
      error: err => {
        this.sending.set(false);
        this.error.set(this.notifications.describe(err, 'Could not start a conversation'));
      }
    });
  }

  private sendTo(conversationId: string, text: string): void {
    const optimistic: Message = {
      id: `pending-${Date.now()}`, conversationId, role: 'USER', content: text, sources: [], metadata: {},
      createdAt: new Date().toISOString()
    };
    this.messages.update(list => [...list, optimistic]);
    this.question.reset('');
    this.scrollToBottom();
    this.conversationService.sendMessage(conversationId, text).subscribe({
      next: response => {
        this.messages.update(list => [...list.filter(m => m.id !== optimistic.id), response.userMessage, response.assistantMessage]);
        this.active.set(response.conversation);
        this.conversations.update(list => [response.conversation, ...list.filter(c => c.id !== response.conversation.id)]);
        this.sending.set(false);
        this.scrollToBottom();
      },
      error: err => {
        this.messages.update(list => list.filter(m => m.id !== optimistic.id));
        this.question.setValue(text);
        this.sending.set(false);
        this.error.set(this.notifications.describe(err, 'The assistant could not answer. Please try again.'));
      }
    });
  }

  protected deleteConversation(conversation: Conversation, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Delete "${conversation.title}"?`)) {
      return;
    }
    this.conversationService.delete(conversation.id).subscribe({
      next: () => {
        this.conversations.update(list => list.filter(c => c.id !== conversation.id));
        if (this.active()?.id === conversation.id) {
          this.startNew();
        }
        this.notifications.success('Conversation deleted');
      },
      error: err => this.notifications.error(this.notifications.describe(err, 'Delete failed'))
    });
  }

  protected isGrounded(message: Message): boolean {
    return message.metadata?.['grounded'] !== false;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.messageList()?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    }, 0);
  }
}
