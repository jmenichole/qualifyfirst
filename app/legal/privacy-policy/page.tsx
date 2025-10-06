import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <Link href="/" className="text-indigo-600 hover:text-indigo-800 flex items-center">
              ← Back to Home
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: October 5, 2025</p>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              QualifyFirst collects information you provide directly to us, such as when you create an account, 
              complete your profile, or participate in surveys. This includes:
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>Personal information (name, email address, demographic details)</li>
              <li>Profile information (age, gender, location, interests, lifestyle preferences)</li>
              <li>Survey responses and participation data</li>
              <li>Usage data and analytics information</li>
              <li>Device and browser information</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Match you with relevant survey opportunities</li>
              <li>Provide and improve our services</li>
              <li>Process referral rewards and payments</li>
              <li>Communicate with you about your account</li>
              <li>Analyze usage patterns and improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
            <p className="mb-4">
              We may share your information with survey providers to determine eligibility, 
              but only after you choose to participate in a survey. We do not sell your 
              personal information to third parties.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of certain communications</li>
              <li>Request a copy of your data (data portability)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="mb-4">
              We implement appropriate security measures to protect your information, including 
              encryption, secure data transmission, and access controls.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mb-2">Email: jmenichole007@outlook.com</p>
            <p className="mb-2">Company: Mischief Manager Inc dba QualifyFirst</p>
            <p className="mb-2">Address: 220 Corrydale Dr, Pensacola, FL 32506</p>
            <p className="mb-6">EIN: 93-3629950</p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Legal Notice</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This privacy policy requires review by a qualified attorney before production use.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}