'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect, useCallback } from 'react';
import Check from './Check';
import Button from './Button';

interface NFT {
    identifier: string;
    contract: string;
    collection: string;
    image_url: string;
    display_image_url: string;
}

export default function Tokens() {
    const { user, ready, authenticated } = usePrivy();
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedNfts, setSelectedNfts] = useState<Set<string>>(new Set());

    const toggleNftSelection = (identifier: string) => {
        setSelectedNfts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(identifier)) {
                newSet.delete(identifier);
            } else {
                newSet.add(identifier);
            }
            return newSet;
        });
    };

    const handleSelectAllToggle = () => {
        if (selectedNfts.size === nfts.length) {
            // All selected, deselect all
            setSelectedNfts(new Set());
        } else {
            // Not all selected, select all
            setSelectedNfts(new Set(nfts.map(nft => nft.identifier)));
        }
    };

    const fetchTokens = useCallback(async () => {
        if (!user?.wallet?.address) return;

        setLoading(true);
        setError(null);

        try {
            // Use our API route to fetch NFTs securely
            const response = await fetch(`/api/nfts/${user.wallet.address}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API error: ${response.status}`);
            }

            const data = await response.json();
            // Sort NFTs: originals first, then editions, then by token ID
            const sortedNfts = (data.nfts || []).sort((a: NFT, b: NFT) => {
                // First sort by collection (originals first)
                if (a.collection === 'vv-checks-originals' && b.collection !== 'vv-checks-originals') {
                    return -1;
                }
                if (b.collection === 'vv-checks-originals' && a.collection !== 'vv-checks-originals') {
                    return 1;
                }
                // Then sort by token ID numerically
                return parseInt(a.identifier) - parseInt(b.identifier);
            });
            setNfts(sortedNfts);
        } catch (err) {
            console.error('Error fetching NFTs:', err);
            setError('Failed to fetch NFTs. This might be due to network issues or API rate limits.');
        } finally {
            setLoading(false);
        }
    }, [user?.wallet?.address]);

    useEffect(() => {
        if (!ready || !authenticated || !user?.wallet?.address) {
            return;
        }

        fetchTokens();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, authenticated, user?.wallet?.address]);

    if (!ready || !authenticated) {
        return (
            <div className="flex-center flex-col w-full h-full p-16">
                <img src="/check-token.png" alt="black check" className="w-64" />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-center text-white">
                Loading Checks...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-center flex-col gap-8">
                <p className="text-white">{error}</p>
                <Button onClick={fetchTokens} size="sm">Reload tokens</Button>
            </div>
        );
    }

    if (nfts.length === 0) {
        return (
            <div className="flex-center flex-col gap-8">
                <Check variant="x" className="w-12" />
                <p className="text-white">No Checks found.</p>
                <Button href="https://opensea.io/collection/vv-checks-originals" target="_blank" size="sm">View on opensea</Button>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="grid grid-cols-2">
                    {nfts.map((nft, index) => {
                        const isSelected = selectedNfts.has(nft.identifier);
                        const isEvenIndex = index % 2 === 0;
                        const isLastItemOdd = nfts.length % 2 === 1 && index === nfts.length - 1;
                        return (
                            <button
                                key={nft.identifier}
                                className={`relative cursor-pointer mix-blend-lighten group border-b border-neutral-800 ${isEvenIndex ? 'border-r border-neutral-800' : ''
                                    } ${isLastItemOdd ? 'border-b-0 border-r border-neutral-800' : ''}`}
                                onClick={() => toggleNftSelection(nft.identifier)}
                            >
                                {(nft.display_image_url || nft.image_url) && (
                                    <img
                                        src={nft.display_image_url || nft.image_url}
                                        alt={`Checks #${nft.identifier}`}
                                        className={`w-full h-full object-cover relative -my-4 group-hover:opacity-60 ${isSelected && 'blur-[2px] opacity-60'}`}
                                        onError={(e) => {
                                            // Hide broken images
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                )}
                                <p className="absolute bottom-6 w-full text-center">#{nft.identifier}</p>
                                {isSelected && (
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <Check className="w-6 h-6" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="w-full h-14 flex-center bg-neutral-950/75 backdrop-blur-sm border-t border-neutral-800 flex-shrink-0">
                <div className="w-full flex-between h-full">
                    {selectedNfts.size > 0 ? (
                        <Button variant="secondary" className="flex-1 h-full hover:bg-neutral/5">
                            Deposit {selectedNfts.size} check{selectedNfts.size !== 1 ? 's' : ''}
                        </Button>
                    ) : (
                        <Button variant="ghost" className="flex-1 h-full pointer-events-none">
                            Select checks to deposit
                        </Button>
                    )}
                    <Button
                        variant="tertiary"
                        className="w-40 h-full border-l border-neutral-800"
                        onClick={handleSelectAllToggle}
                    >
                        {selectedNfts.size === nfts.length ? 'Deselect all' : 'Select all'}
                    </Button>
                </div>
            </div>
        </div>
    );
} 