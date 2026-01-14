import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import AdminNavLink from './AdminNavLink';

// Mock the UserContext
const mockUseUserContext = vi.fn();
vi.mock('@/context/UserContext', () => ({
  useUserContext: () => mockUseUserContext(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

const messages = {
  Admin: {
    nav: {
      dashboard: 'Dashboard',
    },
  },
};

describe('AdminNavLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render admin link when user role is admin', () => {
    mockUseUserContext.mockReturnValue({
      user: { name: 'testadmin', role: 'admin' },
      setUser: vi.fn(),
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AdminNavLink />
      </NextIntlClientProvider>
    );

    const link = screen.getByRole('link', { name: /dashboard/i });
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/en/admin');
  });

  it('should return null when user role is not admin', () => {
    mockUseUserContext.mockReturnValue({
      user: { name: 'testuser', role: 'user' },
      setUser: vi.fn(),
    });

    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AdminNavLink />
      </NextIntlClientProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should return null when user is null', () => {
    mockUseUserContext.mockReturnValue({
      user: null,
      setUser: vi.fn(),
    });

    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AdminNavLink />
      </NextIntlClientProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should use correct locale in link href', () => {
    mockUseUserContext.mockReturnValue({
      user: { name: 'testadmin', role: 'admin' },
      setUser: vi.fn(),
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AdminNavLink />
      </NextIntlClientProvider>
    );

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/en/admin');
  });

  it('should apply correct CSS classes', () => {
    mockUseUserContext.mockReturnValue({
      user: { name: 'testadmin', role: 'admin' },
      setUser: vi.fn(),
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AdminNavLink />
      </NextIntlClientProvider>
    );

    const link = screen.getByRole('link');
    const className = link.getAttribute('class') || '';
    expect(className).toContain('text-white');
    expect(className).toContain('hover:text-blue-900');
    expect(className).toContain('text-base');
    expect(className).toContain('font-bold');
    expect(className).toContain('py-3');
    expect(className).toContain('px-5');
  });
});
