export const DEMO_NOW = '2026-03-02T17:00:00.000Z';
export const demoHeaders = (role = 'customer', user = 'customer-1') => ({ authorization: `Bearer demo:${user}:${role}`, 'content-type': 'application/json' });
