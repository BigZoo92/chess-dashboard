import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import App from './App';
import { SettingsProvider } from './context/settings-context';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster position="top-right" />
      </SettingsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
