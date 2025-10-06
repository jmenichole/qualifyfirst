import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <Link href="/" className="text-indigo-600 hover:text-indigo-800 flex items-center">
              ← Back to Home
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: October 5, 2025</p>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6">
              By accessing and using QualifyFirst, you accept and agree to be bound by the terms 
              and provision of this agreement.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
            <p className="mb-4">You must be at least 18 years old to use our services. By using QualifyFirst, you represent that:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>You are 18 years of age or older</li>
              <li>You have the legal capacity to enter into this agreement</li>
              <li>Your use of the service will not violate any applicable law or regulation</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
            <p className="mb-6">
              To use our services, you must create an account and provide accurate, complete information. 
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Payments and Rewards</h2>
            <p className="mb-4">QualifyFirst offers cryptocurrency payouts for survey completions and referral rewards:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Payments are made in cryptocurrency as specified in your account settings</li>
              <li>You are responsible for providing a valid cryptocurrency wallet address</li>
              <li>Minimum payout thresholds may apply</li>
              <li>Payment processing may take 3-7 business days</li>
              <li>You are responsible for any tax obligations related to cryptocurrency payments</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Tax Reporting</h3>
            <p className="mb-4">For users earning $600 or more per calendar year:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>We will collect your tax information (W-9 form for US residents)</li>
              <li>We will issue Form 1099-NEC for reportable payments</li>
              <li>You are responsible for reporting cryptocurrency income on your tax returns</li>
              <li>Failure to provide required tax information may result in account suspension</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Referral Program</h3>
            <p className="mb-4">Our referral program allows you to earn rewards for successful referrals:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Referrals must result in a completed profile and first survey completion</li>
              <li>Self-referrals and fraudulent activities are prohibited</li>
              <li>Rewards are subject to verification and may be delayed or denied for suspicious activity</li>
              <li>We reserve the right to modify or terminate the referral program at any time</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Survey Participation</h2>
            <p className="mb-6">
              QualifyFirst connects you with third-party survey opportunities. We are not responsible 
              for survey content, payments, or disputes with survey providers.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Prohibited Activities</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-6">
              <li>Provide false or misleading information</li>
              <li>Create multiple accounts</li>
              <li>Attempt to manipulate our matching algorithm</li>
              <li>Engage in fraudulent referral activities</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="mb-6">
              QualifyFirst provides services "as is" without warranties. We are not liable for any 
              indirect, incidental, or consequential damages arising from your use of our services.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Dispute Resolution</h2>
            <p className="mb-6">
              Any disputes arising from these terms shall be resolved through binding arbitration 
              in accordance with the rules of the American Arbitration Association.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
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
                    These terms require review by a qualified attorney before production use.
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