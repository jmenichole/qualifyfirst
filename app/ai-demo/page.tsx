'use client';

import { useState } from 'react';

export default function AIDemoPage() {
  const [activeDemo, setActiveDemo] = useState<string>('recommendations');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [streamContent, setStreamContent] = useState('');

  // Demo 1: Streaming Survey Recommendations
  const runRecommendationsDemo = async () => {
    setLoading(true);
    setStreamContent('');
    setResult(null);

    try {
      const response = await fetch('/api/ai/survey-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || 'demo-user-123' }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        setStreamContent(prev => prev + text);
      }
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Failed to generate recommendations' });
    } finally {
      setLoading(false);
    }
  };

  // Demo 2: Profile Enhancement Suggestions
  const runProfileSuggestionsDemo = async () => {
    setLoading(true);
    setResult(null);
    setStreamContent('');

    try {
      const response = await fetch('/api/ai/profile-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || 'demo-user-123' }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Failed to generate suggestions' });
    } finally {
      setLoading(false);
    }
  };

  // Demo 3: Survey Question Generation
  const runQuestionGenerationDemo = async () => {
    setLoading(true);
    setResult(null);
    setStreamContent('');

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyTopic: 'Electric Vehicle Adoption',
          surveyGoal: 'Understanding consumer attitudes towards electric vehicles and purchase intentions',
          targetDemographics: {
            age: '25-65',
            interests: ['automotive', 'technology', 'environment'],
          },
          numberOfQuestions: 5,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: 'Failed to generate questions' });
    } finally {
      setLoading(false);
    }
  };

  const demos = {
    recommendations: {
      title: 'AI Survey Recommendations',
      description: 'Streaming personalized survey recommendations based on user profile and history',
      action: runRecommendationsDemo,
    },
    suggestions: {
      title: 'Profile Enhancement Suggestions',
      description: 'AI analyzes profile completeness and suggests improvements',
      action: runProfileSuggestionsDemo,
    },
    questions: {
      title: 'Survey Question Generation',
      description: 'Generate targeted screening questions for survey providers',
      action: runQuestionGenerationDemo,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vercel AI Gateway Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Explore QualifyFirst&apos;s AI-powered features using Vercel AI Gateway
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">🚀 Key Benefits:</h3>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>Unified access to multiple AI models (OpenAI, Anthropic, Google)</li>
              <li>Automatic failover for 99.9% reliability</li>
              <li>Real-time streaming responses for better UX</li>
              <li>Detailed observability and cost tracking</li>
              <li>Zero markup on AI costs (bring your own keys)</li>
            </ul>
          </div>

          {/* User ID Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID (optional, defaults to demo user)
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="demo-user-123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Demo Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Object.entries(demos).map(([key, demo]) => (
            <button
              key={key}
              onClick={() => setActiveDemo(key)}
              className={`p-6 rounded-lg border-2 transition-all ${
                activeDemo === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <h3 className="font-semibold text-lg mb-2">{demo.title}</h3>
              <p className="text-sm text-gray-600">{demo.description}</p>
            </button>
          ))}
        </div>

        {/* Run Demo Button */}
        <div className="mb-8">
          <button
            onClick={demos[activeDemo as keyof typeof demos].action}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Running Demo...' : `Run ${demos[activeDemo as keyof typeof demos].title} Demo`}
          </button>
        </div>

        {/* Results Display */}
        {(streamContent || result) && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Results</h2>
            
            {/* Streaming Content */}
            {streamContent && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Streaming Response:</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 whitespace-pre-wrap">
                  {streamContent}
                  {loading && <span className="animate-pulse">▋</span>}
                </div>
              </div>
            )}

            {/* Structured Result */}
            {result && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Response Data:</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  {result.error ? (
                    <div className="text-red-600">{String(result.error)}</div>
                  ) : (
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Use Case Explanations */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              🎯 Survey Matching
            </h3>
            <p className="text-gray-600 mb-3">
              AI analyzes user profiles and survey requirements to predict completion probability.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>70%+ completion rate</li>
              <li>Multi-model support</li>
              <li>Automatic fallback</li>
              <li>Real-time insights</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              💡 Profile Insights
            </h3>
            <p className="text-gray-600 mb-3">
              Smart suggestions to complete profiles and maximize survey opportunities.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>85%+ completion target</li>
              <li>Personalized messaging</li>
              <li>Impact predictions</li>
              <li>Actionable guidance</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              ❓ Question Generation
            </h3>
            <p className="text-gray-600 mb-3">
              AI creates effective screening questions for survey providers.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Unbiased questions</li>
              <li>Multiple question types</li>
              <li>Clear targeting</li>
              <li>Time estimates</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              📊 Cost Optimization
            </h3>
            <p className="text-gray-600 mb-3">
              Smart model selection and caching reduce AI costs by 60%.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>~$375/month for 10K users</li>
              <li>15%+ revenue increase</li>
              <li>$7,500+ monthly ROI</li>
              <li>Zero markup pricing</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Built with Vercel AI SDK, OpenAI, and Anthropic</p>
          <p className="mt-2">
            <a 
              href="/docs/VERCEL_AI_GATEWAY_USE_CASES.md"
              className="text-blue-600 hover:underline"
            >
              View Full Documentation →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
