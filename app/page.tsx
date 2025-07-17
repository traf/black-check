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

      <div className="flex-end flex-col flex-1 relative pt-12 lg:pt-0">
        <div className="flex-end flex-col w-full h-full relative p-4 lg:p-0">
          <div className="flex flex-col p-4 sm:p-12">
            {authenticated ? (
              <h1 className="text-balance my-8">gm, {getDisplayName()}—select some Checks to deposit into the Black Check contract.</h1>
            ) : (
              <h1 className="text-balance my-8">The Black Check — web3's ultimate artifact.</h1>
            )}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
              <p className="flex flex-row sm:flex-col items-start gap-3 text-left sm:text-balance"><Check className="w-4 mt-1.5" /> Contribute your Check to the aggregator to receive a unique onchain receipt.</p>
              <p className="flex flex-row sm:flex-col items-start gap-3 text-left sm:text-balance"><Check className="w-4 mt-1.5" /> Once enough Checks are deposited, the aggregator automatically composites.</p>
              <p className="flex flex-row sm:flex-col items-start gap-3 text-left sm:text-balance"><Check className="w-4 mt-1.5" /> Your receipt will then become your vote in the fate of the Black Check!</p>
              <p className="flex flex-row sm:flex-col items-start gap-3 text-left sm:text-balance"><Check className="w-4 mt-1.5" /> Your contribution to the Black Check will be recorded onchain forever.</p>
            </div>
          </div>
          <Grid rows={4} cols={3} className="hidden lg:grid" />
        </div>
        <Button
          onClick={!authenticated ? handleConnect : undefined}
          className={`w-full h-14 border-b lg:border-b-0 border-t border-neutral-800 ${authenticated ? 'pointer-events-none' : ''}`}
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
