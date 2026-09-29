import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './store';

const Router = import.meta.env.MODE === 'demo' ? HashRouter : BrowserRouter;
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Provider store={store}>
        <Router>
          <App />
          <Toaster position="top-center" toastOptions={{ duration: 5000 }} />
        </Router>
      </Provider>
    </React.StrictMode>
  );
}
