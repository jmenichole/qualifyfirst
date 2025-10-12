/**
 * QualifyFirst - Microtask History Page
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { MicrotaskCompletion, microtaskService } from '../../lib/microtask-service';
import { trackPageView } from '../../lib/analytics';
import Link from 'next/link';

export default function MicrotaskHistoryPage() {
  const [completions, setCompletions] = useState<MicrotaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load completion history
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Please log in to view your history');
        setLoading(false);
        return;
      }

      // Track page view
      await trackPageView('microtasks_history');

      // Load completions
      const completionsData = await microtaskService.getUserCompletions(user.id);
      setCompletions(completionsData);

      setLoading(false);

    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load completion history');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'approved': 'bg-green-100 text-green-700',
      'pending_review': 'bg-yellow-100 text-yellow-700',
      'submitted': 'bg-blue-100 text-blue-700',
      'rejected': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Get payout status badge color
  const getPayoutStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'completed': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'failed': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <Link href="/login" className="block mt-6 text-indigo-600 hover:text-indigo-700">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <Link
            href="/microtasks"
            className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
          >
            ← Back to Microtasks
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Completion History
          </h1>
          <p className="text-gray-600">
            View all your microtask submissions and their status
          </p>
        </div>

        {/* Completion List */}
        <div className="space-y-4">
          {completions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <p className="text-gray-600">You haven&apos;t completed any microtasks yet.</p>
              <Link
                href="/microtasks"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
              >
                Browse Available Tasks →
              </Link>
            </div>
          ) : (
            completions.map(completion => (
              <div
                key={completion.id}
                className="bg-white rounded-2xl shadow-xl p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {completion.microtask?.title || `Task #${completion.microtask_id}`}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(completion.status)}`}>
                        {completion.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPayoutStatusColor(completion.payout_status)}`}>
                        Payout: {completion.payout_status}
                      </span>
                      {completion.validation_score && (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                          Score: {(completion.validation_score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        Submitted: {new Date(completion.submitted_at).toLocaleDateString()} at {new Date(completion.submitted_at).toLocaleTimeString()}
                      </div>
                      {completion.reviewed_at && (
                        <div>
                          Reviewed: {new Date(completion.reviewed_at).toLocaleDateString()} at {new Date(completion.reviewed_at).toLocaleTimeString()}
                        </div>
                      )}
                      {completion.time_spent_seconds && (
                        <div>
                          Time spent: {Math.floor(completion.time_spent_seconds / 60)} min {completion.time_spent_seconds % 60} sec
                        </div>
                      )}
                      {completion.review_notes && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <strong>Review Notes:</strong> {completion.review_notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${completion.payout_amount.toFixed(2)}
                    </div>
                    {completion.status === 'approved' && completion.payout_status === 'completed' && (
                      <div className="text-sm text-green-600 font-semibold">
                        ✓ Paid
                      </div>
                    )}
                    {completion.status === 'approved' && completion.payout_status === 'pending' && (
                      <div className="text-sm text-yellow-600">
                        Pending
                      </div>
                    )}
                  </div>
                </div>

                {/* Show microtask details if available */}
                {completion.microtask && (
                  <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
                    <div className="flex gap-4">
                      <span>Type: {completion.microtask.task_type}</span>
                      <span>Est. Time: {completion.microtask.estimated_minutes} min</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
