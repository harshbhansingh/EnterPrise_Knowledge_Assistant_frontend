import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

const APP_NAME = 'Enterprise Knowledge Assistant';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: `Sign in - ${APP_NAME}`
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    title: `Create account - ${APP_NAME}`
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: `Dashboard - ${APP_NAME}`
  },
  {
    path: 'documents',
    canActivate: [authGuard],
    loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent),
    title: `Documents - ${APP_NAME}`
  },
  {
    path: 'documents/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/documents/document-detail.component').then(m => m.DocumentDetailComponent),
    title: `Document - ${APP_NAME}`
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent),
    title: `Chat - ${APP_NAME}`
  },
  {
    path: 'chat/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent),
    title: `Chat - ${APP_NAME}`
  },
  {
    path: 'conversations',
    canActivate: [authGuard],
    loadComponent: () => import('./features/conversations/conversation-history.component')
      .then(m => m.ConversationHistoryComponent),
    title: `Conversation history - ${APP_NAME}`
  },
  { path: '**', redirectTo: 'dashboard' }
];
