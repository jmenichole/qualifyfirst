import Link from 'next/link';

export default function TestReferralPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Referral System</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Referral URL</h2>
            <p className="text-gray-600 mb-4">
              Click this link to test referral parameter capture:
            </p>
            <Link 
              href="/?ref=TEST123" 
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              Test Referral Link (?ref=TEST123)
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Check localStorage</h2>
            <p className="text-gray-600 mb-4">
              Open browser dev tools and check localStorage for 'referralCode' after clicking the test link.
            </p>
            <button 
              onClick={() => {
                const referralCode = localStorage.getItem('referralCode');
                alert(`Referral code in localStorage: ${referralCode || 'None found'}`);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Check localStorage
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Navigation</h2>
            <div className="space-y-2">
              <div>
                <Link href="/" className="text-indigo-600 hover:text-indigo-800">
                  → Go to Landing Page
                </Link>
              </div>
              <div>
                <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">
                  → Go to Dashboard (requires login)
                </Link>
              </div>
              <div>
                <Link href="/referrals" className="text-indigo-600 hover:text-indigo-800">
                  → Go to Referrals (requires login)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}