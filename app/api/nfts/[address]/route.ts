import { NextRequest, NextResponse } from 'next/server';

const CONTRACT_ADDRESS = '0x036721e5a769cc48b3189efbb9cce4471e8a48b1';

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

    const url = `https://api.opensea.io/api/v2/chain/ethereum/account/${address}/nfts`;
    
    const headers: HeadersInit = {
      'accept': 'application/json',
    };

    // Add API key if available
    if (process.env.OPENSEA_API_KEY) {
      headers['X-API-KEY'] = process.env.OPENSEA_API_KEY;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `OpenSea API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Filter NFTs by the specific contract address
    const contractNFTs = data.nfts?.filter((nft: { contract?: string }) => 
      nft.contract?.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
    ) || [];

    return NextResponse.json({ nfts: contractNFTs });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
} 