import { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { setOnUnauthorized } from './api/onUnauthorized';
import ProductList from './features/products/ProductList';
import ProductForm from './features/products/ProductForm';
import RawMaterialList from './features/rawMaterials/RawMaterialList';
import RawMaterialForm from './features/rawMaterials/RawMaterialForm';
import ProductionSuggestion from './features/production/ProductionSuggestion';
import UserList from './features/users/UserList';
import UserForm from './features/users/UserForm';
import ProfilePage from './features/users/ProfilePage';
import RequireAdmin from './features/users/RequireAdmin';
import Login from './features/auth/Login';
import RequireAuth from './features/auth/RequireAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Dashboard from './features/dashboard/Dashboard';
import CatalogPage from './features/catalog/CatalogPage';
import ImportPage from './features/catalog/ImportPage';
import { fetchMe } from './features/auth/authSlice';
import { useAppDispatch } from './store';
import './App.css';

function AppLayout() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <div className="app app-with-sidebar">
      <Sidebar />
      <main className="main main-with-sidebar" role="main">
        <Routes>
          <Route path="/products" element={<ProductList />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/imports" element={<RequireAdmin><ImportPage /></RequireAdmin>} />
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />
          <Route path="/raw-materials" element={<RawMaterialList />} />
          <Route path="/raw-materials/new" element={<RawMaterialForm />} />
          <Route path="/raw-materials/:id/edit" element={<RawMaterialForm />} />
          <Route path="/production" element={<ProductionSuggestion />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users" element={<RequireAdmin><UserList /></RequireAdmin>} />
          <Route path="/users/new" element={<RequireAdmin><UserForm /></RequireAdmin>} />
          <Route path="/users/:id/edit" element={<RequireAdmin><UserForm /></RequireAdmin>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setOnUnauthorized(() => navigate('/login', { replace: true }));
    return () => setOnUnauthorized(null);
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<RequireAuth><ErrorBoundary><AppLayout /></ErrorBoundary></RequireAuth>} />
    </Routes>
  );
}

export default App;
