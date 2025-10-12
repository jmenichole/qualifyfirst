/**
 * QualifyFirst - Tax Information Collection Component
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNotifications } from './Notifications';

interface TaxInfo {
  legal_name: string;
  ssn_ein: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  tax_classification: 'individual' | 'sole_proprietor' | 'partnership' | 'corporation' | 'llc';
  w9_submitted: boolean;
  submission_date?: string;
}

interface TaxCollectionProps {
  userId: string;
  totalEarnings: number;
  onComplete?: () => void;
}

export function TaxInformationCollection({ userId, totalEarnings, onComplete }: TaxCollectionProps) {
  const [taxInfo, setTaxInfo] = useState<Partial<TaxInfo>>({});
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { addNotification } = useNotifications();

  const checkTaxInfoRequired = useCallback(async () => {
    if (totalEarnings >= 600) {
      // Check if tax info already collected
      const { data: existingTaxInfo } = await supabase
        .from('tax_information')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!existingTaxInfo) {
        setShowForm(true);
      }
    }
  }, [userId, totalEarnings]);

  useEffect(() => {
    checkTaxInfoRequired();
  }, [checkTaxInfoRequired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taxData = {
        user_id: userId,
        ...taxInfo,
        w9_submitted: true,
        submission_date: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tax_information')
        .upsert([taxData]);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'Tax Information Saved',
        message: 'Your tax information has been securely saved.'
      });

      setShowForm(false);
      onComplete?.();

    } catch (error) {
      console.error('Error saving tax info:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save tax information. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tax Information Required</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-yellow-800">
                <strong>IRS Requirement:</strong> You have earned ${totalEarnings.toFixed(2)} this year. 
                We are required to collect tax information for payments over $600.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal Name (as it appears on tax return) *
              </label>
              <input
                type="text"
                required
                value={taxInfo.legal_name || ''}
                onChange={(e) => setTaxInfo({ ...taxInfo, legal_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SSN or EIN *
              </label>
              <input
                type="text"
                required
                placeholder="XXX-XX-XXXX or XX-XXXXXXX"
                value={taxInfo.ssn_ein || ''}
                onChange={(e) => setTaxInfo({ ...taxInfo, ssn_ein: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Classification *
              </label>
              <select
                required
                value={taxInfo.tax_classification || ''}
                onChange={(e) => setTaxInfo({ ...taxInfo, tax_classification: e.target.value as TaxInfo['tax_classification'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select classification</option>
                <option value="individual">Individual/Sole Proprietor</option>
                <option value="sole_proprietor">Sole Proprietor (with business name)</option>
                <option value="partnership">Partnership</option>
                <option value="corporation">C Corporation</option>
                <option value="llc">LLC</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                required
                value={taxInfo.address_line1 || ''}
                onChange={(e) => setTaxInfo({ ...taxInfo, address_line1: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={taxInfo.address_line2 || ''}
                onChange={(e) => setTaxInfo({ ...taxInfo, address_line2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={taxInfo.city || ''}
                  onChange={(e) => setTaxInfo({ ...taxInfo, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={taxInfo.state || ''}
                  onChange={(e) => setTaxInfo({ ...taxInfo, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  required
                  value={taxInfo.zip_code || ''}
                  onChange={(e) => setTaxInfo({ ...taxInfo, zip_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-blue-900 mb-2">Privacy & Security</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your tax information is encrypted and stored securely</li>
                <li>• This information is used only for tax reporting purposes</li>
                <li>• We will issue a 1099-NEC form for your cryptocurrency earnings</li>
                <li>• You can view or update this information in your account settings</li>
              </ul>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Tax Information'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}