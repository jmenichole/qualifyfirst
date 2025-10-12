/**
 * QualifyFirst - Earnings Disclaimer Component
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

interface EarningsDisclaimerProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export function EarningsDisclaimer({ className = '', variant = 'compact' }: EarningsDisclaimerProps) {
  if (variant === 'full') {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Earnings Disclaimer</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Individual results may vary.</strong> The earnings displayed are examples and should not be 
            considered typical or guaranteed results. Your actual earnings will depend on various factors including:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Time invested in completing surveys</li>
            <li>Survey availability in your demographic</li>
            <li>Quality and accuracy of profile information</li>
            <li>Survey completion rates</li>
            <li>Market demand for your demographic</li>
          </ul>
          <p>
            <strong>No income guarantee:</strong> We make no guarantee that you will earn any specific amount 
            or any amount at all. Survey availability and earnings potential vary significantly based on 
            demographic factors and market conditions.
          </p>
          <p>
            <strong>Platform dependency:</strong> Earnings are dependent on third-party survey providers 
            and their payment policies. QualifyFirst cannot guarantee payment from external survey companies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <p className={`text-xs text-gray-500 italic ${className}`}>
      <strong>Earnings Disclaimer:</strong> Individual results may vary. Earnings shown are examples only 
      and not guaranteed. Actual earnings depend on survey availability, completion rates, and other factors.
    </p>
  );
}