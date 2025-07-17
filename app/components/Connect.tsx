'use client';

import Button from "./Button";
import { usePrivy, useLogin, useLogout } from '@privy-io/react-auth';
import { useENS } from '../hooks/useENS';
import { useState, useEffect } from 'react';

export default function Connect({ className = "" }: { className?: string }) {
  const { ready, authenticated, user } = usePrivy();
  const { login } = useLogin();
  const { logout } = useLogout();
  const ensName = useENS(user?.wallet?.address);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleConnect = () => {
    if (authenticated) {
      logout();
    } else {
      login();
    }
  };

  const getConnectText = () => {
    if (!ready) return 'Loading...';
    if (authenticated && user) {
      if (user.wallet?.address) {
        if (ensName) {
          // Remove .eth on mobile (force re-render on window resize)
          return isMobile && ensName.endsWith('.eth') 
            ? ensName.slice(0, -4) 
            : ensName;
        }
        return `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`;
      }
      return user.email?.address || 'Connected';
    }
    return 'Connect';
  };

  return (
    <Button
      onClick={handleConnect}
      className={`${className}`}
      disabled={!ready}
    >
      {getConnectText()}
    </Button>
  );
} 