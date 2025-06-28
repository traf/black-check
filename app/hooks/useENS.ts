import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useENS(address: string | undefined) {
  const [ensName, setEnsName] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !ethers.isAddress(address)) {
      setEnsName(null);
      return;
    }

    const resolveENS = async () => {
      const providers = [
        'https://ethereum.publicnode.com',
        'https://rpc.ankr.com/eth',
        'https://cloudflare-eth.com',
      ];

      for (const rpcUrl of providers) {
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const name = await provider.lookupAddress(address);
          if (name) {
            setEnsName(name);
            return;
          }
        } catch {
          continue;
        }
      }
      
      setEnsName(null);
    };

    resolveENS();
  }, [address]);

  return ensName;
} 