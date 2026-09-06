import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Conversation, ConversationDetail, PageResponse, SendMessageResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/conversations`;

  list(page = 0, size = 50): Observable<PageResponse<Conversation>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<Conversation>>(this.base, { params });
  }

  create(title?: string): Observable<Conversation> {
    return this.http.post<Conversation>(this.base, title ? { title } : {});
  }

  get(id: string): Observable<ConversationDetail> {
    return this.http.get<ConversationDetail>(`${this.base}/${id}`);
  }

  sendMessage(id: string, question: string, documentIds?: string[]): Observable<SendMessageResponse> {
    return this.http.post<SendMessageResponse>(`${this.base}/${id}/messages`, { question, documentIds });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
