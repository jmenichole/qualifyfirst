# Microtask System Documentation

## Overview

The Microtask system allows QualifyFirst users to earn money by completing small, quick tasks that don't involve games or watching ads. This system integrates seamlessly with the existing payout infrastructure (JustTheTip integration) to facilitate payments.

## Features

### Task Types Supported

1. **Data Verification** - Verify and categorize data (e.g., tagging surveys)
2. **Content Moderation** - Review user-generated content for quality
3. **Image Tagging** - Tag and classify images
4. **Text Transcription** - Transcribe short audio clips
5. **Link Validation** - Check if links work correctly
6. **Social Media Engagement** - Verify social media profiles
7. **Feedback Collection** - Provide structured feedback on surveys/products
8. **Quality Assurance** - Test and verify features or content

### Key Features

- **Flexible Task Creation**: Admin/platform owner can create various types of microtasks
- **Automatic Validation**: Tasks are automatically validated based on predefined rules
- **Auto-Approval System**: Tasks meeting accuracy thresholds are auto-approved
- **Category Organization**: Tasks organized by categories for easy browsing
- **Progress Tracking**: Real-time tracking of task slots (completed vs. total)
- **Payout Integration**: Seamless integration with existing JustTheTip payout system
- **Earnings Dashboard**: Users can view earnings, pending tasks, and completion history

## Architecture

### Database Schema

The system uses the following tables:

- `microtasks` - Stores task definitions
- `microtask_completions` - Tracks user submissions
- `microtask_categories` - Organizes tasks by category
- `microtask_category_assignments` - Junction table for task-category relationships

### Service Layer

`app/lib/microtask-service.ts` provides:

- Task retrieval and filtering
- Submission handling
- Validation logic
- Payout processing
- Earnings calculation

### API Endpoints

- `GET /api/microtasks` - List available microtasks (with optional category/type filters)
- `POST /api/microtasks/submit` - Submit a completed microtask

### User Interface

- `/microtasks` - Browse available tasks
- `/microtasks/[id]` - Complete a specific task
- `/microtasks/history` - View completion history

## Setup Instructions

### 1. Database Setup

Run the SQL migration in Supabase:

```sql
-- Execute the contents of supabase-microtasks.sql in your Supabase SQL Editor
```

This will:
- Create all necessary tables
- Set up Row Level Security policies
- Create indexes for performance
- Add triggers for auto-approval
- Insert sample microtasks and categories

### 2. Configuration

No additional configuration needed - the system uses existing authentication and payout infrastructure.

### 3. Testing

1. Log in to your QualifyFirst account
2. Navigate to Dashboard → Microtasks button
3. Browse available tasks
4. Click "Start Task" on any task
5. Complete the form and submit
6. Check completion history

## Creating New Microtasks

Microtasks can be created directly in the database:

```sql
INSERT INTO microtasks (
  title,
  description,
  instructions,
  task_type,
  payout,
  estimated_minutes,
  total_slots,
  task_data,
  validation_rules
) VALUES (
  'Your Task Title',
  'Brief description',
  'Detailed instructions for users',
  'data_verification',  -- or other task type
  1.50,  -- payout amount
  5,     -- estimated minutes
  100,   -- total slots available
  '{"custom_field": "value"}'::jsonb,
  '{"required_fields": ["field1", "field2"]}'::jsonb
);
```

### Validation Rules

Validation rules control auto-approval:

```json
{
  "required_fields": ["field1", "field2"],
  "min_length": 50,
  "max_length": 500,
  "min_tags": 1,
  "max_tags": 5,
  "rating_scale": [1, 5],
  "accuracy_threshold": 0.90
}
```

## Payout Flow

1. User completes microtask
2. Submission validated against rules
3. Validation score calculated
4. If score ≥ required_accuracy: Auto-approved
5. If approved: Payout processed via existing payout-processor
6. Earnings added to pending balance
7. Once minimum payout threshold met: Transfer to JustTheTip or wallet

## Sample Microtasks Included

The system comes with 5 sample microtasks:

1. **Verify Survey Provider Links** ($0.25, 2 min)
2. **Tag Survey Categories** ($0.50, 3 min)
3. **Social Media Profile Check** ($0.75, 4 min)
4. **Transcribe Short Audio Clip** ($1.00, 5 min)
5. **Rate Survey Quality** ($2.50, 10 min)

## Analytics

The system tracks:

- `microtask_viewed` - User views a task
- `microtask_started` - User begins a task
- `microtask_completed` - User completes a task
- `microtask_submitted` - Task submission recorded

## Benefits

### For Platform Owner

- Create custom tasks specific to platform needs
- Validate survey links, categorize content, gather feedback
- No need for external task platforms
- Full control over task types and payouts
- Use existing payout infrastructure

### For Users

- Quick earnings (2-10 minutes per task)
- No games or ads required
- Variety of task types
- Clear instructions and requirements
- Transparent approval process
- Integrated with existing earnings tracking

## Extending the System

### Adding New Task Types

1. Add new task type to enum in `supabase-microtasks.sql`
2. Update TypeScript types in `microtask-service.ts`
3. Add form handling in `app/microtasks/[id]/page.tsx`
4. Define appropriate validation rules

### Custom Validation Logic

Modify `validateSubmission()` in `microtask-service.ts` to add custom validation:

```typescript
private validateSubmission(
  submissionData: Record<string, unknown>,
  validationRules: Record<string, unknown>
): number {
  // Add custom validation logic here
  // Return score between 0.0 and 1.0
}
```

## Security Considerations

- All tables use Row Level Security (RLS)
- Users can only view active, non-expired tasks
- Users can only submit/view their own completions
- API endpoints require authentication
- Validation prevents duplicate submissions (UNIQUE constraint)

## Performance Optimizations

- Indexed queries on active tasks and completion status
- Efficient filtering by category and type
- Pagination support for large task lists
- Automatic cleanup of expired tasks (via query filters)

## Future Enhancements

Potential improvements:

1. **Admin Dashboard** - UI for creating/managing tasks without SQL
2. **Advanced Validation** - ML-based quality checking
3. **Task Scheduling** - Time-based task availability
4. **Skill Levels** - Unlock higher-paying tasks based on accuracy
5. **Batch Tasks** - Complete multiple similar tasks in sequence
6. **Real-time Updates** - WebSocket notifications for new tasks
7. **Leaderboards** - Gamification with top earners
8. **Task Templates** - Pre-built task templates for common scenarios

## Support

For issues or questions:
1. Check database logs in Supabase
2. Review browser console for client-side errors
3. Check API endpoint responses for error details
4. Verify RLS policies are properly configured

## License

Part of the QualifyFirst platform.
