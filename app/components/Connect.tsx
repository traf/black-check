'use client';

import Button from "./Button";
import { usePrivy, useLogin, useLogout } from '@privy-io/react-auth';
import { useENS } from '../hooks/useENS';

export default function Connect({ className = "" }: { className?: string }) {
  const { ready, authenticated, user } = usePrivy();
  const { login } = useLogin();
  const { logout } = useLogout();
  const ensName = useENS(user?.wallet?.address);

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
        return ensName || `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`;
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