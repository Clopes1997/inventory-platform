import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { getOnUnauthorized } from './api/onUnauthorized';

vi.mock('./features/auth/RequireAuth', () => ({ default: () => <div>Private page</div> }));
vi.mock('./features/auth/Login', () => ({ default: () => <div>Login page</div> }));

describe('expired session navigation', () => {
  it('navigates immediately to login and removes the handler on unmount', () => {
    const view = render(<MemoryRouter initialEntries={['/products']}><App /></MemoryRouter>);
    expect(screen.getByText('Private page')).toBeInTheDocument();
    act(() => getOnUnauthorized()?.());
    expect(screen.getByText('Login page')).toBeInTheDocument();
    view.unmount();
    expect(getOnUnauthorized()).toBeNull();
  });
});
