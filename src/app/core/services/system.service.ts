import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SystemInfo } from '../models/api.models';

/** Runtime facts (model names, demo mode) used to set expectations in the UI. */
@Injectable({ providedIn: 'root' })
export class SystemService {
  private readonly http = inject(HttpClient);

  info(): Observable<SystemInfo> {
    return this.http.get<SystemInfo>(`${environment.apiBaseUrl}/system/info`);
  }
}
