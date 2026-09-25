import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  fetchUserById,
  createUser,
  updateUser,
  clearCurrent,
  clearError,
} from './usersSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import toast from 'react-hot-toast';
import { userCreateSchema, userUpdateSchema } from '../../validation/schemas';
import FieldError from '../../components/FieldError';
import { getErrorMessage } from '../../utils/errorMessage';

const ROLES = ['ADMIN', 'OPERATOR', 'VIEWER'] as const;
const MAX_USERNAME_LENGTH = 255;

interface UserFormProps {
  /** When set (e.g. from /profile), use this id instead of route params. */
  userId?: string;
  /** When true, back link and post-save navigation go to home; title is "My account". */
  profileMode?: boolean;
}

export default function UserForm({ userId: userIdProp, profileMode = false }: UserFormProps = {}) {
  const { id: idFromRoute } = useParams<{ id: string }>();
  const id = userIdProp ?? idFromRoute;
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { current, error } = useAppSelector((state) => state.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const isAdmin = currentUser?.role === 'ADMIN';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('VIEWER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string; role?: string }>({});

  useEffect(() => {
    if (isEdit && id) {
      dispatch(fetchUserById(id));
    }
    return () => { dispatch(clearCurrent()); };
  }, [dispatch, isEdit, id]);

  useEffect(() => {
    if (current) {
      setUsername(current.username ?? '');
      setRole(current.role ?? 'VIEWER');
    }
  }, [current]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    if (isEdit && id) {
      const result = userUpdateSchema.safeParse({
        username: username.trim(),
        password: password || undefined,
        role: isAdmin ? (role as 'ADMIN' | 'OPERATOR' | 'VIEWER') : undefined,
      });
      if (!result.success) {
        const formErrors: { username?: string; password?: string; role?: string } = {};
        result.error.issues.forEach((err) => {
          const path = err.path[0] as string;
          if (path in formErrors) return;
          formErrors[path as keyof typeof formErrors] = err.message;
        });
        setFieldErrors(formErrors);
        return;
      }
      const payload: { username: string; role?: string; password?: string } = {
        username: result.data.username,
        role: isAdmin ? result.data.role : undefined,
      };
      if (password && password.length >= 6) payload.password = password;
      setIsSubmitting(true);
      dispatch(updateUser({ id: Number(id), ...payload }))
        .unwrap()
        .then(() => {
          toast.success(profileMode ? 'Profile updated.' : 'User updated.');
          navigate(profileMode ? '/' : '/users');
        })
        .catch((err: unknown) => {
          toast.error(getErrorMessage(err));
        })
        .finally(() => setIsSubmitting(false));
    } else {
      const result = userCreateSchema.safeParse({
        username: username.trim(),
        password,
        role: role as 'ADMIN' | 'OPERATOR' | 'VIEWER',
      });
      if (!result.success) {
        const formErrors: { username?: string; password?: string; role?: string } = {};
        result.error.issues.forEach((err) => {
          const path = err.path[0] as string;
          if (path in formErrors) return;
          formErrors[path as keyof typeof formErrors] = err.message;
        });
        setFieldErrors(formErrors);
        return;
      }
      setIsSubmitting(true);
      dispatch(createUser(result.data))
        .unwrap()
        .then(() => {
          toast.success('User created.');
          navigate('/users');
        })
        .catch((err: unknown) => {
          toast.error(getErrorMessage(err));
        })
        .finally(() => setIsSubmitting(false));
    }
  };

  const isSelf = isEdit && currentUser && current && currentUser.id === current.id;
  const isEditingOther = isEdit && current && currentUser && current.id !== currentUser.id;
  if (isEditingOther && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-container">
      <div className="page-card">
        <h1 className="page-title">{profileMode ? 'My account' : isEdit ? 'Edit User' : 'New User'}</h1>
        <Link to={profileMode ? '/' : '/users'} className="btn btn-secondary back-link">
          {profileMode ? 'Back to home' : 'Back to list'}
        </Link>
      {error && (
        <p className="error" role="alert">
          {error}
          <button type="button" className="btn btn-secondary" onClick={() => dispatch(clearError())}>
            Dismiss
          </button>
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="user-username">Username</label>
          <input
            id="user-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={MAX_USERNAME_LENGTH}
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? 'user-username-error' : undefined}
          />
          <FieldError id="user-username-error" message={fieldErrors.username} />
        </div>
        <div className="form-group">
          <label htmlFor="user-password">
            Password {isEdit && '(leave blank to keep current)'}
          </label>
          <input
            id="user-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? '••••••••' : ''}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'user-password-error' : undefined}
          />
          {!isEdit && <small className="text-muted">Min 6 characters</small>}
          <FieldError id="user-password-error" message={fieldErrors.password} />
        </div>
        {isAdmin && (
          <div className="form-group">
            <label htmlFor="user-role">Role</label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={!!isSelf}
              aria-invalid={Boolean(fieldErrors.role)}
              aria-describedby={fieldErrors.role ? 'user-role-error' : undefined}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {isSelf && <small className="text-muted">You cannot change your own role.</small>}
            <FieldError id="user-role-error" message={fieldErrors.role} />
          </div>
        )}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
      </form>
      </div>
    </div>
  );
}
