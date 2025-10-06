import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface CPXPostback {
  status: string;
  trans_id: string;
  user_id: string;
  sub_id?: string;
  sub_id_2?: string;
  amount_local: string;
  amount_usd: string;
  offer_id?: string;
  hash?: string;
  ip_click: string;
  type?: string;
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const postbackData: CPXPostback = {
      status: searchParams.get('status') || '',
      trans_id: searchParams.get('trans_id') || '',
      user_id: searchParams.get('user_id') || '',
      sub_id: searchParams.get('sub_id') || undefined,
      sub_id_2: searchParams.get('sub_id_2') || undefined,
      amount_local: searchParams.get('amount_local') || '',
      amount_usd: searchParams.get('amount_usd') || '',
      offer_id: searchParams.get('offer_id') || undefined,
      hash: searchParams.get('hash') || undefined,
      ip_click: searchParams.get('ip_click') || '',
      type: searchParams.get('type') || undefined,
    };

    if (!postbackData.user_id || !postbackData.trans_id || !postbackData.status) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (postbackData.hash && !verifySecureHash(postbackData)) {
      return NextResponse.json({ error: 'Invalid secure hash' }, { status: 401 });
    }

    console.log('CPX postback processed:', postbackData);

    return new NextResponse('1', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('CPX webhook error:', error);
    return new NextResponse('1', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

function verifySecureHash(data: CPXPostback): boolean {
  try {
    const securityHash = process.env.CPX_SECURITY_HASH_KEY || 'VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL';
    
    if (!data.hash || !data.trans_id) {
      return false;
    }

    const hashString = data.trans_id + '-' + securityHash;
    const expectedHash = crypto.createHash('md5').update(hashString).digest('hex');

    return data.hash.toLowerCase() === expectedHash.toLowerCase();
  } catch (error) {
    console.error('Secure hash verification error:', error);
    return false;
  }
}
