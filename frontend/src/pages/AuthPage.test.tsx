import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import { AuthPage } from './AuthPage';
import * as api from '../api';
import { ApiError } from '../api';

function renderAuthPage(initialEntry: string | { pathname: string; state?: unknown } = '/login') {
  const entry = typeof initialEntry === 'string' ? initialEntry : initialEntry;
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/logs" element={<div>Logs page reached</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('AuthPage — lookup', () => {
  it('routes a known email to the password step', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'lookupEmail').mockResolvedValue({ exists: true });
    renderAuthPage();
    await user.type(screen.getByLabelText('Email'), 'sam@example.com');
    await user.click(screen.getByText('Continue'));
    expect(await screen.findByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText(/sam@example\.com/)).toBeInTheDocument();
  });

  it('routes an unknown email to the create-account step', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'lookupEmail').mockResolvedValue({ exists: false });
    renderAuthPage();
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.click(screen.getByText('Continue'));
    expect(await screen.findByText('Create your account')).toBeInTheDocument();
  });

  it('blocks an invalid email client-side without calling the API', async () => {
    const user = userEvent.setup();
    const lookupSpy = vi.spyOn(api, 'lookupEmail');
    renderAuthPage();
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByText('Continue'));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(lookupSpy).not.toHaveBeenCalled();
  });

  it('shows a network-failure message and re-enables the button', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'lookupEmail').mockRejectedValue(new Error('network down'));
    renderAuthPage();
    await user.type(screen.getByLabelText('Email'), 'sam@example.com');
    await user.click(screen.getByText('Continue'));
    expect(await screen.findByText("Couldn't reach BeanQuest. Try again.")).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('renders both Google and magic-link buttons as inert and tab-reachable', async () => {
    const user = userEvent.setup();
    const lookupSpy = vi.spyOn(api, 'lookupEmail');
    renderAuthPage();
    const google = screen.getByText('Continue with Google').closest('button')!;
    const magicLink = screen.getByText('Email me a magic link').closest('button')!;
    expect(google).toHaveAttribute('aria-disabled', 'true');
    expect(magicLink).toHaveAttribute('aria-disabled', 'true');
    await user.click(google);
    await user.click(magicLink);
    expect(lookupSpy).not.toHaveBeenCalled();
  });

  it('shows the redirected context bar and "Please log in to continue" when arriving with a from path', () => {
    renderAuthPage({ pathname: '/login', state: { from: '/roasting-methods' } });
    expect(screen.getByText(/Redirected from \/roasting-methods/)).toBeInTheDocument();
    expect(screen.getByText('Please log in to continue')).toBeInTheDocument();
  });
});

async function goToPasswordStep(user: ReturnType<typeof userEvent.setup>) {
  vi.spyOn(api, 'lookupEmail').mockResolvedValue({ exists: true });
  await user.type(screen.getByLabelText('Email'), 'sam@example.com');
  await user.click(screen.getByText('Continue'));
  await screen.findByText('Welcome back');
}

describe('AuthPage — password', () => {
  it('shows no attempt count above the third failure', async () => {
    const user = userEvent.setup();
    renderAuthPage();
    await goToPasswordStep(user);
    vi.spyOn(api, 'login').mockRejectedValue(new ApiError(401, 'invalid credentials', 4));
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByText('Log in'));
    expect(await screen.findByText("That password isn't right.")).toBeInTheDocument();
  });

  it('shows the attempt count from the third failure (attemptsLeft <= 2)', async () => {
    const user = userEvent.setup();
    renderAuthPage();
    await goToPasswordStep(user);
    vi.spyOn(api, 'login').mockRejectedValue(new ApiError(401, 'invalid credentials', 2));
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByText('Log in'));
    expect(await screen.findByText("That password isn't right. 2 attempts left.")).toBeInTheDocument();
  });

  it('signs in and navigates to /logs on a correct password', async () => {
    const user = userEvent.setup();
    renderAuthPage();
    await goToPasswordStep(user);
    vi.spyOn(api, 'login').mockResolvedValue({ access_token: 'tok123', token_type: 'bearer' });
    await user.type(screen.getByLabelText('Password'), 'correctpassword');
    await user.click(screen.getByText('Log in'));
    expect(await screen.findByText('Logs page reached')).toBeInTheDocument();
  });

  it('switches to the locked screen on a 429 and counts down', async () => {
    const user = userEvent.setup();
    renderAuthPage();
    await goToPasswordStep(user);
    vi.spyOn(api, 'login').mockRejectedValue(new ApiError(429, 'rate limited', null, 278));
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByText('Log in'));
    expect(await screen.findByText('Too many attempts')).toBeInTheDocument();
    expect(screen.getByText(/Try again in 4:38/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Try again in 4:37/)).toBeInTheDocument(), { timeout: 2000 });
  }, 10000);

  it('returns to the password step once the lock expires', async () => {
    const user = userEvent.setup();
    renderAuthPage();
    await goToPasswordStep(user);
    vi.spyOn(api, 'login').mockRejectedValue(new ApiError(429, 'rate limited', null, 1));
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByText('Log in'));
    await screen.findByText('Too many attempts');
    expect(await screen.findByText('Welcome back', {}, { timeout: 3000 })).toBeInTheDocument();
  }, 10000);
});

describe('AuthPage — create', () => {
  async function goToCreateStep(user: ReturnType<typeof userEvent.setup>) {
    vi.spyOn(api, 'lookupEmail').mockResolvedValue({ exists: false });
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.click(screen.getByText('Continue'));
    await screen.findByText('Create your account');
  }

  it('disables Create account until the password rule passes and both names are filled', async () => {
    const user = userEvent.setup();
    renderAuthPage();
    await goToCreateStep(user);
    const submit = screen.getByText('Create account').closest('button')!;
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText('First name'), 'Sam');
    await user.type(screen.getByLabelText('Last name'), 'Okafor');
    await user.type(screen.getByLabelText('Password'), 'short1');
    expect(submit).toBeDisabled();
    await user.clear(screen.getByLabelText('Password'));
    await user.type(screen.getByLabelText('Password'), 'Str0ngPass!word');
    expect(submit).toBeEnabled();
  });

  it('signs up and navigates to /logs', async () => {
    const user = userEvent.setup();
    renderAuthPage();
    await goToCreateStep(user);
    vi.spyOn(api, 'signup').mockResolvedValue({ access_token: 'tok123', token_type: 'bearer' });
    await user.type(screen.getByLabelText('First name'), 'Sam');
    await user.type(screen.getByLabelText('Last name'), 'Okafor');
    await user.type(screen.getByLabelText('Password'), 'Str0ngPass!word');
    await user.click(screen.getByText('Create account'));
    expect(await screen.findByText('Logs page reached')).toBeInTheDocument();
  });

  it('routes a 409 conflict to the password step with an explanatory message', async () => {
    const user = userEvent.setup();
    renderAuthPage();
    await goToCreateStep(user);
    vi.spyOn(api, 'signup').mockRejectedValue(new ApiError(409, 'Email already registered'));
    await user.type(screen.getByLabelText('First name'), 'Sam');
    await user.type(screen.getByLabelText('Last name'), 'Okafor');
    await user.type(screen.getByLabelText('Password'), 'Str0ngPass!word');
    await user.click(screen.getByText('Create account'));
    expect(await screen.findByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText(/already has an account/)).toBeInTheDocument();
  });
});
