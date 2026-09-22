import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, TextField, Typography } from '@mui/material';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import LockIcon from '@mui/icons-material/Lock';
import LanguageIcon from '@mui/icons-material/Language';
import MailOutlineIcon from '@mui/icons-material/Mail';
import { AuthShell, SoonButton } from '../components/AuthShell';
import { useAuth } from '../AuthContext';
import { ApiError, lookupEmail, login, signup } from '../api';
import { checkPassword, formatCountdown, isValidEmail, loginErrorMessage, normalizeEmail, PASSWORD_HELPER } from '../logic/auth';

type Mode = 'lookup' | 'password' | 'create' | 'locked';

const UNREACHABLE_MESSAGE = "Couldn't reach BeanQuest. Try again.";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const from = (location.state as { from?: string } | null)?.from ?? null;
  const redirectTo = from ?? '/logs';

  const [mode, setMode] = useState<Mode>('lookup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (mode !== 'locked') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [mode]);

  useEffect(() => {
    if (mode === 'locked' && lockUntil !== null && now >= lockUntil) {
      setMode('password');
      setLockUntil(null);
      setError(null);
    }
  }, [mode, lockUntil, now]);

  const backToLookup = () => {
    setMode('lookup');
    setPassword('');
    setError(null);
  };

  const handleLookup = async () => {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    const normalized = normalizeEmail(trimmed);
    setEmail(normalized);
    setPending(true);
    setError(null);
    try {
      const result = await lookupEmail(normalized);
      setMode(result?.exists ? 'password' : 'create');
    } catch {
      setError(UNREACHABLE_MESSAGE);
    } finally {
      setPending(false);
    }
  };

  const handleLogin = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await login({ email, password });
      if (result) {
        signIn(result.access_token, email);
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(loginErrorMessage(err.attemptsLeft));
      } else if (err instanceof ApiError && err.status === 429) {
        setMode('locked');
        setLockUntil(Date.now() + (err.retryAfter ?? 300) * 1000);
        setNow(Date.now());
      } else {
        setError(UNREACHABLE_MESSAGE);
      }
    } finally {
      setPending(false);
    }
  };

  const passwordCheck = checkPassword(password);
  const canCreate = passwordCheck.ok && firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleCreate = async () => {
    if (!canCreate) return;
    setPending(true);
    setError(null);
    try {
      const result = await signup({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email,
        password,
      });
      if (result) {
        signIn(result.access_token, email);
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setMode('password');
        setPassword('');
        setError('That address already has an account — log in instead.');
      } else if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError(UNREACHABLE_MESSAGE);
      }
    } finally {
      setPending(false);
    }
  };

  const onEnter = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fn();
  };

  if (mode === 'lookup') {
    return (
      <AuthShell contextBar={from ? `Redirected from ${from} — session expired.` : undefined}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          {!from && <LocalCafeIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
          <Typography variant="h6" sx={{ mt: 0.5 }}>
            {from ? 'Please log in to continue' : 'Log your coffee'}
          </Typography>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          fullWidth
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          disabled={pending}
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={onEnter(handleLookup)}
          sx={{ mb: 2 }}
        />
        <PrimaryButton onClick={handleLookup} disabled={pending}>
          {pending ? 'Checking…' : 'Continue'}
        </PrimaryButton>
        <Divider label="or" />
        <SoonButton icon={<LanguageIcon fontSize="small" />} label="Continue with Google" />
        <SoonButton icon={<MailOutlineIcon fontSize="small" />} label="Email me a magic link" />
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mt: 2 }}>
          {from ? "We'll take you back to that page afterwards." : "We'll check if you already have an account."}
        </Typography>
      </AuthShell>
    );
  }

  if (mode === 'create') {
    return (
      <AuthShell onBack={backToLookup}>
        <Typography variant="h6">Create your account</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          No account yet for <b>{email}</b>.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          fullWidth
          label="First name"
          autoComplete="given-name"
          disabled={pending}
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Last name"
          autoComplete="family-name"
          disabled={pending}
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          autoComplete="new-password"
          disabled={pending}
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={onEnter(handleCreate)}
        />
        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.75, mb: 2 }}>
          {PASSWORD_HELPER}
        </Typography>
        <PrimaryButton onClick={handleCreate} disabled={pending || !canCreate}>
          {pending ? 'Creating…' : 'Create account'}
        </PrimaryButton>
      </AuthShell>
    );
  }

  if (mode === 'locked') {
    const remaining = lockUntil !== null ? Math.max(0, (lockUntil - now) / 1000) : 0;
    return (
      <AuthShell onBack={backToLookup}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <LockIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
          <Typography variant="h6" sx={{ mt: 0.5 }}>Too many attempts</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mb: 2 }}>
          Log-in is paused for this account for <b>5 minutes</b>.
        </Typography>
        <TextField
          fullWidth
          label="Password"
          type="password"
          disabled
          value={password}
          sx={{ mb: 2 }}
        />
        <PrimaryButton onClick={() => {}} disabled>
          Try again in {formatCountdown(remaining)}
        </PrimaryButton>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mt: 2 }}>
          Counter clears on a successful log-in.
        </Typography>
      </AuthShell>
    );
  }

  // mode === 'password'
  return (
    <AuthShell onBack={backToLookup}>
      <Typography variant="h6">Welcome back</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Enter your password for <b>{email}</b>
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        fullWidth
        label="Password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        autoFocus
        disabled={pending}
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={onEnter(handleLogin)}
        sx={{ mb: 1 }}
        slotProps={{
          input: {
            endAdornment: (
              <LinkButton onClick={() => setShowPassword(s => !s)}>
                {showPassword ? 'Hide' : 'Show'}
              </LinkButton>
            ),
          },
        }}
      />
      <PrimaryButton onClick={handleLogin} disabled={pending || password.length === 0} sx={{ mt: 1 }}>
        {pending ? 'Logging in…' : 'Log in'}
      </PrimaryButton>
    </AuthShell>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  sx,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  sx?: object;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        width: '100%',
        border: 0,
        borderRadius: 1,
        py: 1.25,
        typography: 'body1',
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        bgcolor: disabled ? 'action.disabledBackground' : 'primary.main',
        color: disabled ? 'text.disabled' : 'primary.contrastText',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function LinkButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        border: 0,
        bgcolor: 'transparent',
        cursor: 'pointer',
        color: 'primary.main',
        typography: 'body2',
        p: 0,
      }}
    >
      {children}
    </Box>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 2 }}>
      <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
    </Box>
  );
}
