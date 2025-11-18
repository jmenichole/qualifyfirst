/**
 * QualifyFirst - Footer Component
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white border-t border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text">QualifyFirst</h3>
            <p className="text-gray-400 text-sm mb-3">
              Made for Degens by Degens. Zero BS matching, instant payouts, real rewards.
            </p>
            <p className="text-xs text-purple-400 font-semibold">
              Part of the Mischief Manager Ecosystem
            </p>
          </div>

          {/* Ecosystem Links */}
          <div>
            <h4 className="font-semibold mb-4 text-cyan-300">Ecosystem</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://tiltcheck.gg" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-300 transition flex items-center gap-2">
                  <span>🎮</span> TiltCheck
                </a>
              </li>
              <li>
                <a href="https://justthetip.gg" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-300 transition flex items-center gap-2">
                  <span>💰</span> JustTheTip
                </a>
              </li>
              <li>
                <a href="https://collectclock.gg" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-300 transition flex items-center gap-2">
                  <span>⏰</span> CollectClock
                </a>
              </li>
              <li>
                <a href="https://degensagainstdecency.gg" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-300 transition flex items-center gap-2">
                  <span>🎲</span> DegensAgainstDecency
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4 text-cyan-300">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal/privacy-policy" className="text-gray-400 hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms-of-service" className="text-gray-400 hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/cookie-policy" className="text-gray-400 hover:text-white transition">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/affiliate-disclosure" className="text-gray-400 hover:text-white transition">
                  Affiliate Disclosure
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-cyan-300">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:jmenichole007@outlook.com" className="text-gray-400 hover:text-white transition">
                  Contact Support
                </a>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-purple-500/20 mt-8 pt-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <p className="text-gray-400 text-sm">
              © 2025 Mischief Manager Inc dba QualifyFirst. All rights reserved.
            </p>
            <p className="text-xs text-purple-400">
              Made for Degens by Degens 👑
            </p>
            <div className="flex space-x-6">
              <a href="https://twitter.com/qualifyfirst" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-300 transition">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://discord.gg/qualifyfirst" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-300 transition">
                <span className="sr-only">Discord</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.942 4.558a14.614 14.614 0 00-3.601-1.116.055.055 0 00-.058.027c-.155.277-.328.638-.448.922a13.486 13.486 0 00-4.047 0 9.495 9.495 0 00-.456-.922.057.057 0 00-.058-.027c-1.266.218-2.467.6-3.601 1.116a.052.052 0 00-.024.02C.832 7.765-.498 10.87.155 13.922a.061.061 0 00.023.042 14.737 14.737 0 004.436 2.24.057.057 0 00.062-.02c.346-.472.654-.971.92-1.496a.056.056 0 00-.031-.078 9.721 9.721 0 01-1.388-.662.057.057 0 01-.006-.095c.093-.07.187-.142.276-.216a.055.055 0 01.057-.008c2.913 1.33 6.066 1.33 8.943 0a.055.055 0 01.058.007c.089.074.182.147.276.217a.057.057 0 01-.005.095c-.443.258-.905.476-1.389.661a.056.056 0 00-.03.079c.272.524.58 1.023.919 1.496a.056.056 0 00.062.021 14.68 14.68 0 004.441-2.24.057.057 0 00.023-.041c.778-3.528-.13-6.592-2.546-9.303a.045.045 0 00-.023-.021zM6.678 12.048c-.848 0-1.546-.779-1.546-1.735 0-.956.684-1.735 1.546-1.735.869 0 1.56.786 1.546 1.735 0 .956-.684 1.735-1.546 1.735zm6.65 0c-.848 0-1.546-.779-1.546-1.735 0-.956.684-1.735 1.546-1.735.869 0 1.56.786 1.546 1.735 0 .956-.677 1.735-1.546 1.735z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}