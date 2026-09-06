import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { DashboardSummary } from '../../core/models/api.models';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { NotificationService } from '../../core/services/notification.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { FileSizePipe, RelativeTimePipe } from '../../shared/pipes';
import { StatusChipComponent } from '../../shared/status-chip.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MatButtonModule, MatProgressSpinnerModule, StatusChipComponent, EmptyStateComponent,
    FileSizePipe, RelativeTimePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly notifications = inject(NotificationService);
  protected readonly auth = inject(AuthService);

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.summary().subscribe({
      next: summary => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(this.notifications.describe(err, 'Could not load the dashboard'));
        this.loading.set(false);
      }
    });
  }
}
