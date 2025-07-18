import { NextRequest, NextResponse } from 'next/server';

const COLLECTION_SLUGS = [
  'vv-checks',
  'vv-checks-originals'
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Validate address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }

    const headers: HeadersInit = {
      'accept': 'application/json',
    };

    // Add API key if available
    if (process.env.OPENSEA_API_KEY) {
      headers['x-api-key'] = process.env.OPENSEA_API_KEY;
    }

    // Fetch NFTs from each collection separately using collection parameter
    const allNFTs = [];
    
    for (const collection of COLLECTION_SLUGS) {
      const url = `https://api.opensea.io/api/v2/chain/ethereum/account/${address}/nfts?collection=${collection}&limit=100`;
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.nfts && data.nfts.length > 0) {
            allNFTs.push(...data.nfts);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${collection}:`, error);
      }
    }

    return NextResponse.json({ nfts: allNFTs });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFTs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 