'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Microtask, microtaskService } from '../../lib/microtask-service';
import { trackMicrotaskInteraction } from '../../lib/analytics';
import Link from 'next/link';

export default function MicrotaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = parseInt(params.id as string);

  const [microtask, setMicrotask] = useState<Microtask | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  // Form state - generic for different task types
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Load microtask
  const loadMicrotask = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Please log in to view this microtask');
        setLoading(false);
        return;
      }

      // Load microtask
      const task = await microtaskService.getMicrotaskById(taskId);
      
      if (!task) {
        setError('Microtask not found');
        setLoading(false);
        return;
      }

      setMicrotask(task);
      setStartTime(Date.now());
      
      // Track that user started the task
      await trackMicrotaskInteraction(taskId, 'started');
      
      setLoading(false);

    } catch (err) {
      console.error('Error loading microtask:', err);
      setError('Failed to load microtask');
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadMicrotask();
  }, [loadMicrotask]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!microtask) return;
    
    setSubmitting(true);
    setError('');

    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const response = await fetch('/api/microtasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          microtask_id: taskId,
          submission_data: formData,
          time_spent_seconds: timeSpent
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit');
      }

      setSuccess(true);
      
      // Track completion
      await trackMicrotaskInteraction(taskId, 'completed', {
        time_spent: timeSpent,
        payout: microtask.payout
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/microtasks');
      }, 3000);

    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit microtask');
      setSubmitting(false);
    }
  };

  // Update form data
  const updateFormData = (key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading microtask...</p>
        </div>
      </div>
    );
  }

  if (error && !microtask) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <Link href="/microtasks" className="block mt-6 text-indigo-600 hover:text-indigo-700">
            ← Back to Microtasks
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">Task Submitted!</h1>
          <p className="text-gray-700 mb-4">
            Your submission has been received and is being reviewed.
          </p>
          <p className="text-gray-600 mb-6">
            You&apos;ll earn <span className="font-bold text-green-600">${microtask?.payout.toFixed(2)}</span> once approved.
          </p>
          <Link
            href="/microtasks"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition inline-block"
          >
            View More Tasks
          </Link>
        </div>
      </div>
    );
  }

  if (!microtask) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl mx-auto pt-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <Link
            href="/microtasks"
            className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block"
          >
            ← Back to Microtasks
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {microtask.title}
          </h1>
          <p className="text-gray-600 mb-4">{microtask.description}</p>

          <div className="flex flex-wrap gap-3">
            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
              ${microtask.payout.toFixed(2)} reward
            </span>
            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
              {microtask.estimated_minutes} minutes
            </span>
            <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
              {microtask.completed_slots} / {microtask.total_slots} completed
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {microtask.instructions}
          </div>
        </div>

        {/* Task Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Complete Task</h2>

          {/* Generic form based on task type */}
          {microtask.task_type === 'link_validation' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link Status *
                </label>
                <select
                  required
                  value={(formData.link_status as string) || ''}
                  onChange={(e) => updateFormData('link_status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select status</option>
                  <option value="working">Working</option>
                  <option value="broken">Broken</option>
                  <option value="redirect">Redirects incorrectly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Error Message (if any)
                </label>
                <textarea
                  value={(formData.error_message as string) || ''}
                  onChange={(e) => updateFormData('error_message', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Describe any errors you encountered"
                ></textarea>
              </div>
            </div>
          )}

          {microtask.task_type === 'data_verification' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Survey ID *
                </label>
                <input
                  type="text"
                  required
                  value={(formData.survey_id as string) || ''}
                  onChange={(e) => updateFormData('survey_id', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter survey ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags * (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={(formData.tags as string) || ''}
                  onChange={(e) => updateFormData('tags', e.target.value.split(',').map(t => t.trim()))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="health, technology, shopping"
                />
              </div>
            </div>
          )}

          {microtask.task_type === 'text_transcription' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transcription *
              </label>
              <textarea
                required
                value={(formData.transcription as string) || ''}
                onChange={(e) => updateFormData('transcription', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={6}
                placeholder="Type the transcription here..."
              ></textarea>
            </div>
          )}

          {microtask.task_type === 'feedback_collection' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clarity Rating * (1-5)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="5"
                  value={(formData.clarity_rating as number) || ''}
                  onChange={(e) => updateFormData('clarity_rating', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Accuracy Rating * (1-5)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="5"
                  value={(formData.time_rating as number) || ''}
                  onChange={(e) => updateFormData('time_rating', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Rating * (1-5)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="5"
                  value={(formData.difficulty_rating as number) || ''}
                  onChange={(e) => updateFormData('difficulty_rating', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating * (1-5)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="5"
                  value={(formData.overall_rating as number) || ''}
                  onChange={(e) => updateFormData('overall_rating', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments *
                </label>
                <textarea
                  required
                  value={(formData.comments as string) || ''}
                  onChange={(e) => updateFormData('comments', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Provide your feedback..."
                ></textarea>
              </div>
            </div>
          )}

          {/* Generic fallback for other task types */}
          {!['link_validation', 'data_verification', 'text_transcription', 'feedback_collection'].includes(microtask.task_type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response *
              </label>
              <textarea
                required
                value={(formData.response as string) || ''}
                onChange={(e) => updateFormData('response', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={6}
                placeholder="Enter your response..."
              ></textarea>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit Task'}
            </button>
            <Link
              href="/microtasks"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
