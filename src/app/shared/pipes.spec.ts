import { FileSizePipe, RelativeTimePipe } from './pipes';

describe('pipes', () => {
  it('formats file sizes', () => {
    const pipe = new FileSizePipe();
    expect(pipe.transform(512)).toBe('512 B');
    expect(pipe.transform(2048)).toBe('2.0 KB');
    expect(pipe.transform(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(pipe.transform(null)).toBe('-');
  });

  it('formats relative times', () => {
    const pipe = new RelativeTimePipe();
    expect(pipe.transform(new Date().toISOString())).toBe('just now');
    expect(pipe.transform(new Date(Date.now() - 5 * 60_000).toISOString())).toBe('5 min ago');
    expect(pipe.transform(new Date(Date.now() - 3 * 3_600_000).toISOString())).toBe('3 h ago');
    expect(pipe.transform(null)).toBe('-');
  });
});
