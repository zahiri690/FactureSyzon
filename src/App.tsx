import { HashRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import Layout from './components/Layout';
import DocumentForm from './components/DocumentForm';
import { DataProvider } from './lib/store';
import { AuthProvider, useAuth } from './lib/auth';
import Banks from './pages/Banks';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import DocumentDetail from './pages/DocumentDetail';
import DocumentsList from './pages/DocumentsList';
import Library from './pages/Library';
import Login from './pages/Login';
import Resources from './pages/Resources';

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Login />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <RequireAuth>
          <HashRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="devis" element={<DocumentsList kind="devis" />} />
                <Route path="devis/nouveau" element={<DocumentForm kind="devis" />} />
                <Route path="devis/:id" element={<DocumentDetail kind="devis" />} />
                <Route path="devis/:id/modifier" element={<DocumentForm kind="devis" />} />
                <Route path="factures" element={<DocumentsList kind="facture" />} />
                <Route path="factures/nouvelle" element={<DocumentForm kind="facture" />} />
                <Route path="factures/:id" element={<DocumentDetail kind="facture" />} />
                <Route path="factures/:id/modifier" element={<DocumentForm kind="facture" />} />
                <Route path="banques" element={<Banks />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="bibliotheque" element={<Library />} />
                <Route path="ressources" element={<Resources />} />
                <Route path="*" element={<Dashboard />} />
              </Route>
            </Routes>
          </HashRouter>
        </RequireAuth>
      </DataProvider>
    </AuthProvider>
  );
}

