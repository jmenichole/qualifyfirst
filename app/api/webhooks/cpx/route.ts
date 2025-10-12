/**
 * QualifyFirst - CPX Research Webhook Handler
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
    console.log('🎯 CPX Postback received at:', new Date().toISOString());
    console.log('📍 Request URL:', request.url);
    
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

    console.log('📊 Parsed CPX data:', JSON.stringify(postbackData, null, 2));

    if (!postbackData.user_id || !postbackData.trans_id || !postbackData.status) {
      console.error('❌ Missing required parameters');
      return new NextResponse('0', { 
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (postbackData.hash && !verifySecureHash(postbackData)) {
      console.error('❌ Hash verification failed');
      return new NextResponse('0', { 
        status: 401,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    if (postbackData.status === '1') {
      console.log('✅ Survey completed! User:', postbackData.user_id, 'Amount: $' + postbackData.amount_usd);
    } else {
      console.log('⚠️ Survey not completed. Status:', postbackData.status);
    }

    console.log('🎉 CPX postback successfully processed!');

    return new NextResponse('1', { 
      status: 200,
      headers: { 
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache'
      }
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
