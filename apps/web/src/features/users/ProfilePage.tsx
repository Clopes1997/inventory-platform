import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store';
import UserForm from './UserForm';

/**
 * Profile / "My account" page. Renders UserForm for the current user only.
 * Available to all authenticated users; for editing other users, admins use /users (RequireAdmin).
 */
export default function ProfilePage() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  if (!currentUser) return <Navigate to="/" replace />;
  return <UserForm userId={String(currentUser.id)} profileMode />;
}
