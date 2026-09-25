import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { setToken } from '../../api/auth';
import type { AuthResponseDto } from '../../types/api';
import toast from 'react-hot-toast';
import { loginSchema } from '../../validation/schemas';
import FieldError from '../../components/FieldError';
import { getErrorMessage } from '../../utils/errorMessage';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    const result = loginSchema.safeParse({
      username: username.trim(),
      password,
    });
    if (!result.success) {
      const formErrors: { username?: string; password?: string } = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        if (path in formErrors) return;
        formErrors[path as keyof typeof formErrors] = err.message;
      });
      setFieldErrors(formErrors);
      return;
    }
    setLoading(true);
    api
      .post<AuthResponseDto>('/auth/login', { username: result.data.username, password: result.data.password })
      .then((res) => {
        setToken(res.data.token);
        navigate('/dashboard', { replace: true });
      })
      .catch((err: unknown) => {
        const msg = getErrorMessage(err);
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo">AF</span>
          <h1 className="login-title">Autoflex</h1>
          <p className="login-subtitle">Inventory &amp; Production Control</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              aria-invalid={Boolean(fieldErrors.username)}
              aria-describedby={fieldErrors.username ? 'login-username-error' : undefined}
            />
            <FieldError id="login-username-error" message={fieldErrors.username} />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
            />
            <FieldError id="login-password-error" message={fieldErrors.password} />
          </div>
          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="hint">
          Use the account provisioned by your administrator.
        </p>
      </div>
    </div>
  );
}
