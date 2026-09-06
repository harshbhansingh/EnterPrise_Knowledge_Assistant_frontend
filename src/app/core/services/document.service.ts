import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentChunk, DocumentStatus, DocumentSummary, PageResponse } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/documents`;

  list(page = 0, size = 20, status?: DocumentStatus): Observable<PageResponse<DocumentSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<PageResponse<DocumentSummary>>(this.base, { params });
  }

  get(id: string): Observable<DocumentSummary> {
    return this.http.get<DocumentSummary>(`${this.base}/${id}`);
  }

  chunks(id: string, page = 0, size = 20): Observable<PageResponse<DocumentChunk>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<DocumentChunk>>(`${this.base}/${id}/chunks`, { params });
  }

  /** Reports upload progress events so the UI can show a progress bar. */
  upload(file: File): Observable<HttpEvent<DocumentSummary>> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<DocumentSummary>(this.base, form, { reportProgress: true, observe: 'events' });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  reindex(id: string): Observable<DocumentSummary> {
    return this.http.post<DocumentSummary>(`${this.base}/${id}/reindex`, null);
  }
}
