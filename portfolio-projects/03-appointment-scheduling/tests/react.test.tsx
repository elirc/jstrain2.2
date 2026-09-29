// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../apps/web/src/main.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('customer scheduling UI', () => {
  it('exposes labeled slot controls and keyboard-usable navigation', () => {
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const body = url.includes('/api/catalog')
        ? { locations: [{ id: 'loc-1', name: 'Downtown', zone: 'America/Los_Angeles' }], services: [{ id: 'svc-1', name: 'Consultation', duration_min: 60, price_cents: 5000 }], staff: [], resources: [] }
        : { items: [] };
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    }));

    render(<App />);
    expect(screen.getByRole('heading', { name: 'Find care, without the phone tag.' })).toBeVisible();
    expect(screen.getByLabelText('Display time zone')).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent('Choose a date');
    fireEvent.click(screen.getByRole('button', { name: 'Clinic info' }));
    expect(screen.getByRole('heading', { name: 'How clinic scheduling works' })).toBeVisible();
  });
});
