import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  const auth = { token: 'jwt-token' as string | null, logout: vi.fn() };

  beforeEach(() => {
    auth.token = 'jwt-token';
    auth.logout.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth }
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds the bearer header to API calls', () => {
    http.get('/api/documents').subscribe();
    const request = controller.expectOne('/api/documents');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush([]);
  });

  it('does not add the header to login calls', () => {
    http.post('/api/auth/login', {}).subscribe();
    const request = controller.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('logs out on 401 responses, flagging expired tokens', () => {
    http.get('/api/documents').subscribe({ error: () => undefined });
    controller.expectOne('/api/documents').flush({ error: 'TOKEN_EXPIRED' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logout).toHaveBeenCalledWith('expired');
  });
});
