/**
 * QualifyFirst - Microtasks Page
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Microtask, MicrotaskCategory, microtaskService } from '../lib/microtask-service';
import { trackMicrotaskInteraction, trackPageView } from '../lib/analytics';
import Link from 'next/link';

export default function MicrotasksPage() {
  const [microtasks, setMicrotasks] = useState<Microtask[]>([]);
  const [categories, setCategories] = useState<MicrotaskCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    totalCompleted: 0,
    pendingReview: 0,
    pendingPayout: 0
  });

  // Load user and data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        setError('Please log in to view microtasks');
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Track page view
      await trackPageView('microtasks');

      // Load categories
      const categoriesData = await microtaskService.getCategories();
      setCategories(categoriesData);

      // Load microtasks
      const tasksData = await microtaskService.getAvailableMicrotasks(currentUser.id);
      setMicrotasks(tasksData);

      // Load earnings summary
      const earningsData = await microtaskService.getUserMicrotaskEarnings(currentUser.id);
      setEarnings(earningsData);

      setLoading(false);

    } catch (err) {
      console.error('Error loading microtasks:', err);
      setError('Failed to load microtasks');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter by category
  const handleCategoryChange = async (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    
    if (!user) return;

    if (categoryId === null) {
      const tasksData = await microtaskService.getAvailableMicrotasks(user.id);
      setMicrotasks(tasksData);
    } else {
      const tasksData = await microtaskService.getMicrotasksByCategory(categoryId, user.id);
      setMicrotasks(tasksData);
    }
  };

  // Handle task click
  const handleTaskClick = async (taskId: number) => {
    await trackMicrotaskInteraction(taskId, 'viewed');
  };

  // Get task type display name
  const getTaskTypeName = (type: string) => {
    const types: Record<string, string> = {
      'data_verification': 'Data Verification',
      'content_moderation': 'Content Moderation',
      'image_tagging': 'Image Tagging',
      'text_transcription': 'Text Transcription',
      'link_validation': 'Link Validation',
      'social_media_engagement': 'Social Media',
      'feedback_collection': 'Feedback',
      'quality_assurance': 'Quality Assurance'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading microtasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <Link href="/login" className="block mt-6 text-indigo-600 hover:text-indigo-700">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Microtasks
              </h1>
              <p className="text-gray-600">
                Complete quick tasks and earn rewards
              </p>
            </div>
            <Link
              href="/dashboard"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Earnings Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                ${earnings.totalEarned.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {earnings.totalCompleted}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {earnings.pendingReview}
              </div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                ${earnings.pendingPayout.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Pending Payout</div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-4 py-2 rounded-lg transition ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Tasks
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedCategory === category.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {microtasks.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <p className="text-gray-600">No microtasks available at the moment.</p>
              <p className="text-sm text-gray-500 mt-2">Check back later for new tasks!</p>
            </div>
          ) : (
            microtasks.map(task => (
              <div
                key={task.id}
                className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {task.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                        {getTaskTypeName(task.task_type)}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {task.estimated_minutes} min
                      </span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        ${task.payout.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div>
                        {task.completed_slots} / {task.total_slots} completed
                      </div>
                      {task.required_accuracy && (
                        <div>
                          {(task.required_accuracy * 100).toFixed(0)}% accuracy required
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/microtasks/${task.id}`}
                    onClick={() => handleTaskClick(task.id)}
                    className="ml-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition font-semibold"
                  >
                    Start Task
                  </Link>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(task.completed_slots / task.total_slots) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* History Link */}
        <div className="mt-6 text-center">
          <Link
            href="/microtasks/history"
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            View Completion History →
          </Link>
        </div>
      </div>
    </div>
  );
}
