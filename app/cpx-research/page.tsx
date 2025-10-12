/**
 * QualifyFirst - CPX Research Integration Page
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../lib/supabase';

function CPXResearchContent() {
  const searchParams = useSearchParams();
  const [messageId, setMessageId] = useState<string | null>(null);
  const [wallUrl, setWallUrl] = useState<string>('');
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const getCurrentUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        
        // Generate CPX wall URL via API endpoint
        const params = new URLSearchParams({
          user_id: user.id
        });
        
        if (messageId) {
          params.append('message_id', messageId);
        }
        
        const response = await fetch(`/api/cpx/wall-url?${params.toString()}`);
        const data = await response.json();
        
        if (data.wallUrl) {
          setWallUrl(data.wallUrl);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }, [messageId]);

  useEffect(() => {
    // Get message_id from URL parameters
    const msgId = searchParams.get('message_id');
    setMessageId(msgId);
    
    // Get current user and generate wall URL
    getCurrentUser();
  }, [searchParams, getCurrentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CPX Research...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access CPX Research surveys.</p>
          <a
            href="/auth"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            CPX Research Survey Wall
          </h1>
          <p className="text-lg text-gray-600">
            Complete surveys and earn crypto rewards instantly!
          </p>
        </div>

        {/* CPX Research Frame */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="aspect-w-16 aspect-h-9 mb-4">
            {wallUrl && (
              <iframe
                src={wallUrl}
                className="w-full h-screen border-0"
                title="CPX Research Survey Wall"
                allowFullScreen
              />
            )}
          </div>
          
          {messageId && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Processing survey completion... Message ID: {messageId}
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Choose Survey</h3>
              <p className="text-sm text-gray-600">
                Browse available surveys and pick ones that match your profile
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold text-lg">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Complete Survey</h3>
              <p className="text-sm text-gray-600">
                Answer questions honestly and completely
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Earn Crypto</h3>
              <p className="text-sm text-gray-600">
                Get paid instantly via JustTheTip integration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CPXResearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CPXResearchContent />
    </Suspense>
  );
}