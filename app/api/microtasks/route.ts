/**
 * QualifyFirst - Microtasks API
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// API endpoint for getting available microtasks
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const taskType = searchParams.get('type');

    // Get tasks user hasn't completed yet
    const { data: completions } = await supabase
      .from('microtask_completions')
      .select('microtask_id')
      .eq('user_id', user.id);

    const completedIds = completions?.map(c => c.microtask_id) || [];

    let query = supabase
      .from('microtasks')
      .select(`
        *,
        microtask_category_assignments (
          category_id,
          microtask_categories (*)
        )
      `)
      .eq('active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    // Filter by category if provided
    if (category) {
      const { data: categoryAssignments } = await supabase
        .from('microtask_category_assignments')
        .select('microtask_id')
        .eq('category_id', parseInt(category));
      
      const categoryTaskIds = categoryAssignments?.map(a => a.microtask_id) || [];
      if (categoryTaskIds.length > 0) {
        query = query.in('id', categoryTaskIds);
      }
    }

    // Filter by task type if provided
    if (taskType) {
      query = query.eq('task_type', taskType);
    }

    const { data: microtasks, error } = await query.order('payout', { ascending: false });

    if (error) {
      console.error('Error fetching microtasks:', error);
      return NextResponse.json({ error: 'Failed to fetch microtasks' }, { status: 500 });
    }

    // Filter out completed tasks and full tasks
    const availableTasks = (microtasks || [])
      .filter(task => 
        !completedIds.includes(task.id) &&
        task.completed_slots < task.total_slots
      )
      .map(task => ({
        ...task,
        categories: task.microtask_category_assignments?.map(
          (assignment: { microtask_categories: unknown }) => assignment.microtask_categories
        ) || []
      }));

    return NextResponse.json({ 
      success: true,
      microtasks: availableTasks 
    });

  } catch (error) {
    console.error('Microtasks API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
