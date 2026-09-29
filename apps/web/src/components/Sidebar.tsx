import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCurrentUser } from '../features/auth/authSlice';
import { clearToken } from '../api/auth';

const SIDEBAR_WIDTH = 240;

export default function Sidebar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', menuOpen);
    return () => document.body.classList.remove('sidebar-open');
  }, [menuOpen]);

  const handleLogout = () => {
    dispatch(clearCurrentUser());
    clearToken();
    navigate('/login', { replace: true });
    setMenuOpen(false);
  };

  const navClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'sidebar-link active' : 'sidebar-link';

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      />
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}
        style={{ width: SIDEBAR_WIDTH }}
        aria-label="Main navigation"
      >
        <div className="sidebar-brand">
          <span className="sidebar-logo">IP</span>
          <span className="sidebar-app-name">Inventory</span>
        </div>
        <nav className="sidebar-nav">
          <span className="sidebar-menu-label">Menu</span>
          <NavLink to="/dashboard" end className={navClassName} onClick={() => setMenuOpen(false)} data-testid="nav-dashboard">
            Dashboard
          </NavLink>
          <NavLink to="/production" className={navClassName} onClick={() => setMenuOpen(false)} data-testid="nav-production-suggestion">
            Production Suggestions
          </NavLink>
          <NavLink to="/raw-materials" className={navClassName} onClick={() => setMenuOpen(false)} data-testid="nav-raw-materials">
            Raw Materials
          </NavLink>
          <NavLink to="/products" end className={navClassName} onClick={() => setMenuOpen(false)} data-testid="nav-products">
            Products
          </NavLink>
          <NavLink to="/profile" className={navClassName} onClick={() => setMenuOpen(false)} data-testid="nav-profile">
            Profile
          </NavLink>
          <NavLink to="/catalog" className={navClassName} onClick={() => setMenuOpen(false)}>Brands and cities</NavLink>
          {currentUser?.role === 'ADMIN' && (
            <NavLink to="/users" className={navClassName} onClick={() => setMenuOpen(false)} data-testid="nav-users">
              Users
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="btn btn-primary sidebar-logout"
            onClick={handleLogout}
            aria-label="Log out"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
