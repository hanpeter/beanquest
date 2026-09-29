import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import { setToken } from '../api';
import { NavDrawer } from './NavDrawer';

function renderDrawer() {
  return render(
    <MemoryRouter initialEntries={['/logs']}>
      <AuthProvider>
        <Routes>
          <Route path="/logs" element={<NavDrawer open onClose={vi.fn()} />} />
          <Route path="/login" element={<div>Login screen</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  localStorage.clear();
});

describe('NavDrawer — account section', () => {
  it('shows the signed-in account email', () => {
    setToken('tok', 'sam@example.com');
    renderDrawer();
    expect(screen.getByText('sam@example.com')).toBeInTheDocument();
  });

  it('confirms before logging out, then clears the session and returns to login', async () => {
    setToken('tok', 'sam@example.com');
    const user = userEvent.setup();
    renderDrawer();
    await user.click(screen.getByText('Log out'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Log out?')).toBeInTheDocument();
    await user.click(within(dialog).getByText('Log out'));
    expect(await screen.findByText('Login screen')).toBeInTheDocument();
    expect(localStorage.getItem('beanquest.access_token')).toBeNull();
  });

  it('cancelling the confirm dialog keeps the session', async () => {
    setToken('tok', 'sam@example.com');
    const user = userEvent.setup();
    renderDrawer();
    await user.click(screen.getByText('Log out'));
    await user.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Log out?')).not.toBeInTheDocument());
    expect(localStorage.getItem('beanquest.access_token')).toBe('tok');
  });
});
