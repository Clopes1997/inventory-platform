import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUsers } from './usersSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import type { UserDto } from '../../types/api';

export default function UserList() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Users</h1>
        <div className="loading-spinner-wrap" aria-busy="true" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <span>Loading users…</span>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="page-container">
        <div className="page-card">
          <h1 className="page-title">Users</h1>
          <p className="error" role="alert">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-card">
        <header className="page-header">
          <h1 className="page-title">Users</h1>
          <div className="page-header-actions">
            <Link to="/users/new" className="btn btn-primary" data-testid="link-new-user">
              New User
            </Link>
          </div>
        </header>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="empty-state">No users found.</div>
                  </td>
                </tr>
              ) : (
              items.map((u: UserDto) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.role || 'VIEWER'}</td>
                  <td>
                    <Link to={`/users/${u.id}/edit`} className="btn btn-secondary" data-testid="user-edit-link">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
