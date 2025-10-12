/**
 * QualifyFirst - Affiliate Disclosure Component
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

interface AffiliateDisclosureProps {
  className?: string;
  variant?: 'banner' | 'inline' | 'modal';
}

export function AffiliateDisclosure({ className = '', variant = 'inline' }: AffiliateDisclosureProps) {
  if (variant === 'banner') {
    return (
      <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Affiliate Disclosure</h3>
            <p className="text-sm text-yellow-700 mt-1">
              QualifyFirst may earn commissions when you complete surveys through our platform. 
              This helps us provide our service free of charge while maintaining transparency about our recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <p className={`text-xs text-gray-500 ${className}`}>
        <strong>Affiliate Disclosure:</strong> QualifyFirst may earn commissions from survey completions. 
        This does not affect your earnings or experience.
      </p>
    );
  }

  return (
    <div className={`text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border ${className}`}>
      <strong className="text-gray-900">Affiliate Disclosure:</strong> QualifyFirst participates in 
      affiliate programs and may receive compensation when you complete surveys through our platform. 
      This helps us provide our services free of charge and does not influence our recommendations or 
      affect your potential earnings.
    </div>
  );
}