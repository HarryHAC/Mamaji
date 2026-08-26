import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { ShopkeeperProvider } from './context/ShopkeeperContext';
import { AIAgentProvider } from './context/AIAgentContext';
import AuthScreen from './components/auth/AuthScreen';
import RoleSelectModal from './components/entry/RoleSelectModal';
import Navbar from './components/common/Navbar';
import NotificationToast from './components/common/NotificationToast';
import AIAgentOverlay from './components/common/AIAgentOverlay';
import CustomerHome from './components/customer/CustomerHome';
import ShopkeeperHome from './components/shopkeeper/ShopkeeperHome';

function MainAppContent() {
  const { isAuthenticated, authReady } = useAuth();
  const { role } = useApp();

  if (!authReady) return null; // brief flash guard while session restores

  return (
    <div className="app-viewport-wrapper">
      <div className="mobile-device-frame">
        <NotificationToast />

        {!isAuthenticated && <AuthScreen />}

        {isAuthenticated && role === 'entry' && <RoleSelectModal />}

        {isAuthenticated && role !== 'entry' && (
          <>
            <Navbar />
            {role === 'customer' && <CustomerHome />}
            {role === 'shopkeeper' && <ShopkeeperHome />}
          </>
        )}

        {/* Persistent hands-free AI Agent — only for logged-in customers */}
        {isAuthenticated && role === 'customer' && <AIAgentOverlay />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ShopkeeperProvider>
          <AIAgentProvider>
            <MainAppContent />
          </AIAgentProvider>
        </ShopkeeperProvider>
      </AppProvider>
    </AuthProvider>
  );
}
