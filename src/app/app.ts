import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatMenuModule, MatTooltipModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly auth = inject(AuthService);

  protected readonly navigation = [
    { path: '/dashboard', label: 'Dashboard', icon: 'space_dashboard' },
    { path: '/documents', label: 'Documents', icon: 'description' },
    { path: '/chat', label: 'Chat', icon: 'forum' },
    { path: '/conversations', label: 'History', icon: 'history' }
  ];

  protected logout(): void {
    this.auth.logout('manual');
  }
}
