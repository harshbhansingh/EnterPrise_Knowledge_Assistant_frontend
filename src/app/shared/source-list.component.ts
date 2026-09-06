import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SourceReference } from '../core/models/api.models';

/** Citations of an assistant answer: document, section, chunk index and similarity score. */
@Component({
  selector: 'app-source-list',
  imports: [RouterLink, MatTooltipModule],
  template: `
    @if (sources().length) {
      <div class="sources">
        <div class="sources-title">
          <span class="material-symbols-outlined">library_books</span>
          Sources ({{ sources().length }})
        </div>
        @for (source of sources(); track source.chunkId) {
          <div class="source" [class.cited]="source.cited">
            <span class="label">[{{ source.label }}]</span>
            <div class="body">
              <a class="doc" [routerLink]="['/documents', source.documentId]">{{ source.documentName }}</a>
              <span class="meta">
                @if (source.section) { <span>{{ source.section }}</span> <span class="dot">&middot;</span> }
                <span>chunk {{ source.chunkIndex + 1 }}</span>
                <span class="dot">&middot;</span>
                <span matTooltip="Cosine similarity between the question and this chunk">similarity {{ (source.similarity * 100).toFixed(0) }}%</span>
                @if (source.cited) { <span class="dot">&middot;</span> <span class="cited-flag">cited in answer</span> }
              </span>
              <p class="excerpt">{{ source.excerpt }}</p>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: `
    .sources { margin-top: 12px; border-top: 1px dashed var(--eka-border); padding-top: 10px; }
    .sources-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--eka-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
    .sources-title .material-symbols-outlined { font-size: 16px; }
    .source { display: flex; gap: 10px; padding: 8px 10px; border-radius: 8px; background: #f8fafc; margin-bottom: 6px; border: 1px solid transparent; }
    .source.cited { border-color: #c7d7ff; background: #f3f6ff; }
    .label { font-weight: 700; color: var(--eka-primary); font-size: 13px; }
    .body { min-width: 0; flex: 1; }
    .doc { font-weight: 600; font-size: 13px; text-decoration: none; }
    .meta { display: flex; flex-wrap: wrap; gap: 6px; font-size: 12px; color: var(--eka-muted); margin-top: 2px; }
    .dot { opacity: 0.6; }
    .cited-flag { color: var(--eka-success); font-weight: 600; }
    .excerpt { margin: 6px 0 0; font-size: 13px; color: #334155; line-height: 1.45; }
  `
})
export class SourceListComponent {
  readonly sources = input.required<SourceReference[]>();
}
