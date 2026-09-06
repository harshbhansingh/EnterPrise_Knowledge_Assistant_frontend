import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RagQueryRequest, RagQueryResponse } from '../models/api.models';

/** Stateless question answering (no conversation history); used for quick questions from the dashboard. */
@Injectable({ providedIn: 'root' })
export class RagService {
  private readonly http = inject(HttpClient);

  query(request: RagQueryRequest): Observable<RagQueryResponse> {
    return this.http.post<RagQueryResponse>(`${environment.apiBaseUrl}/rag/query`, request);
  }
}
