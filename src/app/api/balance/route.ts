
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    try {
        // Use the MIDL Regtest Mempool API
        const response = await fetch(`https://mempool.regtest.midl.xyz/api/address/${address}/utxo`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`Mempool API error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error('Response:', text);
            // Return empty array on error to handle gracefully
            return NextResponse.json([]);
        }

        const utxos = await response.json();
        return NextResponse.json(utxos);
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
