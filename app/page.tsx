export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            QualifyFirst
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Qualify first, survey second
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 text-left">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              The Problem
            </h2>
            <p className="text-gray-700">
              Survey platforms waste your time with constant disqualifications. 
              You answer questions for 5 minutes, then get kicked out with nothing.
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 text-left">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              The Solution
            </h2>
            <p className="text-gray-700">
              QualifyFirst learns about you once, then only shows surveys you&apos;ll 
              actually qualify for. Less frustration, more earnings.
            </p>
          </div>

          <div className="space-y-4">
            <button className="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition">
              Coming Soon - Join Waitlist
            </button>
            
            <p className="text-sm text-gray-500">
              Built by Jamie Vargas • Currently in Development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}