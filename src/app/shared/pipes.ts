import { Pipe, PipeTransform } from '@angular/core';

/** 1234567 -> "1.2 MB" */
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
      return '-';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
  }
}

/** ISO timestamp -> "5 minutes ago" (falls back to a date for older values). */
@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    const seconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (seconds < 45) {
      return 'just now';
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours} h ago`;
    }
    const days = Math.round(hours / 24);
    if (days < 7) {
      return `${days} d ago`;
    }
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
