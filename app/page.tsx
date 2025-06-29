'use client';

import { usePrivy, useLogin } from '@privy-io/react-auth';
import Grid from "./components/Grid";
import Button from "./components/Button";
import Check from "./components/Check";
import Tokens from "./components/Tokens";
import { useENS } from "./hooks/useENS";

export default function Home() {
  const { authenticated, user } = usePrivy();
  const { login } = useLogin();
  const address = user?.wallet?.address;
  const ensName = useENS(address);

  const getDisplayName = () => {
    if (ensName) return ensName.replace('.eth', '');
    if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`;
    return 'anon';
  };

  const handleConnect = () => {
    login();
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-full divide-x divide-neutral-800">

      <div className="flex-end flex-col flex-1 relative">
        <div className="flex-end flex-col w-full h-full relative p-4 lg:p-0">
          <div className="flex flex-col p-12 gap-8 lg:gap-2">
            {authenticated ? (
              <h1 className="text-balance my-4">gm, {getDisplayName()}—select some Checks to deposit into the Black Check contract.</h1>
            ) : (
              <h1 className="text-balance my-4">Black Check — the ultimate verifiable digital artifact</h1>
            )}
            <p className="flex flex-col lg:flex-row gap-3"><Check className="w-4" /> deposit your checks to the black check contract</p>
            <p className="flex flex-col lg:flex-row gap-3"><Check className="w-4" /> contract reaches enough to composite a black check</p>
            <p className="flex flex-col lg:flex-row gap-3"><Check className="w-4" /> ownership is fractionalized between participants</p>
          </div>
          <Grid rows={4} cols={3} className="hidden lg:grid" />
        </div>
        <Button
          onClick={!authenticated ? handleConnect : undefined}
          className={`w-full h-14 border-t border-neutral-800 ${authenticated ? 'pointer-events-none' : ''}`}
          variant={authenticated ? 'ghost' : 'secondary'}
        >
          {authenticated ? 'No checks deposited yet' : 'Connect wallet to deposit checks'}
        </Button>
      </div>

      <div className="flex-center flex-col flex-1 h-full bg-neutral-950">
        <Tokens />
      </div>

    </div>
  );
}
