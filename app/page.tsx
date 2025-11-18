/**
 * QualifyFirst - Homepage
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Footer } from './components/Footer';

export default function Home() {
  // Capture referral code from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref);
      console.log('Referral code captured:', ref);
    }
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-500/20 p-8 md:p-12">
          <div className="text-center">
            {/* Neon glow effect on title */}
            <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]">
              QualifyFirst
            </h1>
            <p className="text-2xl text-purple-300 mb-2 font-semibold">
              Made for Degens by Degens
            </p>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              The AI-powered survey matcher built for degenerates who are tired of getting screened out, underpaid, or scammed.
            </p>
            
            {/* Value Props with neon accent */}
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-400/30 rounded-2xl p-6 mb-6 text-left shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <h2 className="text-2xl font-bold text-cyan-300 mb-3 flex items-center gap-2">
                <span>🚫</span> No More Bullshit
              </h2>
              <ul className="text-gray-200 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 font-bold">✓</span>
                  <span><strong className="text-purple-300">Zero screenouts</strong> - AI matches you to surveys you actually qualify for</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 font-bold">✓</span>
                  <span><strong className="text-purple-300">Instant SOL payouts</strong> - Get paid fast via JustTheTip, no waiting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 font-bold">✓</span>
                  <span><strong className="text-purple-300">Real rewards</strong> - No &quot;complete 1,400 apps for $0.10&quot; garbage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-pink-400 font-bold">✓</span>
                  <span><strong className="text-purple-300">Cross-platform bonuses</strong> - Integrates with TiltCheck, CollectClock &amp; DegensAgainstDecency</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-400/30 rounded-2xl p-6 mb-8 text-left shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <h2 className="text-2xl font-bold text-cyan-300 mb-3 flex items-center gap-2">
                <span>🧠</span> How It Works
              </h2>
              <p className="text-gray-200 leading-relaxed">
                Set up your Degen Score once. Our AI learns your behavior from TiltCheck, tipping patterns, 
                and gaming activity. Then we match you ONLY to surveys that fit your vibe. 
                Get screened out? We compensate you instantly and suggest better matches.
              </p>
            </div>

            <div className="space-y-4">
              <Link 
                href="/profile"
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 px-8 rounded-xl text-xl font-bold hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-105 text-center shadow-[0_0_30px_rgba(168,85,247,0.4)]"
              >
                🚀 Start Earning Now
              </Link>
              
              <div className="flex justify-center gap-4 text-sm text-gray-400">
                <a href="#ecosystem" className="hover:text-purple-300 transition">Ecosystem</a>
                <span>•</span>
                <a href="/legal/terms-of-service" className="hover:text-purple-300 transition">Terms</a>
                <span>•</span>
                <a href="/legal/privacy-policy" className="hover:text-purple-300 transition">Privacy</a>
              </div>
              
              <p className="text-sm text-gray-400 mt-4">
                Part of the Mischief Manager ecosystem: <span className="text-purple-300">TiltCheck</span>, <span className="text-cyan-300">JustTheTip</span>, <span className="text-pink-300">CollectClock</span>, <span className="text-yellow-300">DegensAgainstDecency</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}