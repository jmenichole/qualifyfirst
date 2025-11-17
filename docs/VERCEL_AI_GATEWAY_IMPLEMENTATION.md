# Vercel AI Gateway Implementation Guide

## Quick Start

This guide walks you through integrating Vercel AI Gateway into QualifyFirst for enhanced AI capabilities.

## Prerequisites

- Vercel account with AI Gateway enabled
- Next.js 15+ application (already set up)
- Supabase database (already configured)
- Node.js 18+ and npm

## Installation

### 1. Install Required Packages

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic zod
```

✅ **Status**: Installed

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Vercel AI Gateway
AI_GATEWAY_API_KEY=your-gateway-api-key

# Optional: Direct API keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Model configuration
PRIMARY_AI_MODEL=gpt-4o-mini
FALLBACK_AI_MODEL=claude-3-5-sonnet-latest
```

### 3. Get Your AI Gateway API Key

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **AI** → **Gateway**
3. Click **Create API Key**
4. Copy the key and add to `.env.local`

## Implementation

### Architecture Overview

```
User Request
    ↓
Next.js API Route (/api/ai/*)
    ↓
Vercel AI SDK (ai package)
    ↓
Vercel AI Gateway (ai-gateway.vercel.sh)
    ↓
AI Providers (OpenAI, Anthropic, Google)
    ↓
Structured Response / Stream
    ↓
User Interface
```

### Core Components

#### 1. AI Survey Matcher with Gateway

**File**: `app/lib/ai-survey-matcher-gateway.ts`

**Features**:
- Multi-model support (OpenAI, Anthropic, Google)
- Automatic failover on errors
- Multi-model consensus mode
- Heuristic fallback
- Historical performance tracking

**Usage**:
```typescript
import { aiSurveyMatcherGateway } from '@/app/lib/ai-survey-matcher-gateway';

const result = await aiSurveyMatcherGateway.getTopMatches(
  userProfile,
  availableSurveys,
  3 // limit
);
```

#### 2. Streaming Survey Recommendations

**File**: `app/api/ai/survey-recommendations/route.ts`

**Features**:
- Real-time streaming responses
- Personalized recommendations
- Context-aware suggestions
- Edge runtime optimized

**Usage**:
```typescript
const response = await fetch('/api/ai/survey-recommendations', {
  method: 'POST',
  body: JSON.stringify({ userId: 'user-123' }),
});

const reader = response.body.getReader();
// Stream content to UI
```

#### 3. Profile Enhancement Suggestions

**File**: `app/api/ai/profile-suggestions/route.ts`

**Features**:
- Structured output with Zod schemas
- Profile completeness analysis
- Prioritized suggestions
- Impact estimates

**Usage**:
```typescript
const response = await fetch('/api/ai/profile-suggestions', {
  method: 'POST',
  body: JSON.stringify({ userId: 'user-123' }),
});

const data = await response.json();
// data.data.suggestions contains AI-generated suggestions
```

#### 4. Survey Question Generation

**File**: `app/api/ai/generate-questions/route.ts`

**Features**:
- Generates targeted screening questions
- Multiple question types
- Quality validation
- Time and reward estimates

**Usage**:
```typescript
const response = await fetch('/api/ai/generate-questions', {
  method: 'POST',
  body: JSON.stringify({
    surveyTopic: 'Product Feedback',
    surveyGoal: 'Gather insights on new features',
    numberOfQuestions: 5,
  }),
});
```

## Key Features

### 1. Automatic Failover

Gateway automatically routes to fallback models if primary fails:

```typescript
// Primary attempt with GPT-4o-mini
const result = await generateText({
  model: openai('gpt-4o-mini', {
    apiKey: process.env.AI_GATEWAY_API_KEY,
    baseURL: 'https://ai-gateway.vercel.sh/v1',
  }),
  prompt: '...',
});

// If fails, gateway can route to Claude or other models
```

### 2. Multi-Model Consensus

Enable for critical decisions:

```typescript
const matcher = new AISurveyMatcherGateway({
  enableMultiModel: true,
});

// Queries multiple models and returns weighted average
const result = await matcher.getTopMatches(profile, surveys);
```

### 3. Streaming Responses

Reduce perceived latency:

```typescript
const result = await streamText({
  model: openai('gpt-4o-mini'),
  messages: [...],
});

return result.toTextStreamResponse();
```

### 4. Structured Outputs

Type-safe responses with Zod:

```typescript
const suggestionSchema = z.object({
  completionScore: z.number(),
  suggestions: z.array(z.object({
    field: z.string(),
    reason: z.string(),
    impact: z.string(),
  })),
});

const result = await generateObject({
  model: openai('gpt-4o-mini'),
  schema: suggestionSchema,
  prompt: '...',
});

// result.object is fully typed!
```

## Cost Optimization

### Model Selection Strategy

| Use Case | Model | Cost/1M tokens | Reason |
|----------|-------|----------------|--------|
| Survey Matching | gpt-4o-mini | $0.15/$0.60 | Fast, accurate |
| Recommendations | gpt-4o-mini | $0.15/$0.60 | Good quality |
| Question Gen | gpt-4o | $2.50/$10.00 | Needs creativity |
| Analysis | claude-3.5-sonnet | $3.00/$15.00 | Best reasoning |

### Expected Costs (10,000 active users/month)

```
Survey Matching: 100K requests × 300 tokens × $0.0006 = $18
  + outputs: 100K × 100 tokens × $0.0024 = $24
  = $42/month

Recommendations: 50K requests × 400 tokens × $0.0006 = $12
  + outputs: 50K × 200 tokens × $0.0024 = $24
  = $36/month

Profile Suggestions: 25K requests × 500 tokens × $0.0006 = $7.50
  + outputs: 25K × 150 tokens × $0.0024 = $9
  = $16.50/month

Question Generation: 1K requests × 600 tokens × $0.025 = $15
  + outputs: 1K × 300 tokens × $0.100 = $30
  = $45/month

Total: ~$140/month (conservative estimate)
```

### ROI Calculation

```
AI Costs: $140/month
Increased completion rate: +15%
Average revenue per completion: $5
Additional completions: 10,000 users × 2 surveys × 0.15 = 3,000
Additional revenue: 3,000 × $5 = $15,000/month

ROI: ($15,000 - $140) / $140 = 10,614% 🚀
```

## Testing

### 1. Run the Demo Page

```bash
npm run dev
```

Visit: `http://localhost:3000/ai-demo`

### 2. Test Individual APIs

**Survey Recommendations**:
```bash
curl -X POST http://localhost:3000/api/ai/survey-recommendations \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123"}'
```

**Profile Suggestions**:
```bash
curl -X POST http://localhost:3000/api/ai/profile-suggestions \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123"}'
```

**Question Generation**:
```bash
curl -X POST http://localhost:3000/api/ai/generate-questions \
  -H "Content-Type: application/json" \
  -d '{
    "surveyTopic": "Coffee Preferences",
    "surveyGoal": "Understanding consumer coffee habits",
    "numberOfQuestions": 5
  }'
```

### 3. Monitor Performance

Check Vercel Dashboard → AI → Gateway for:
- Request count
- Latency metrics
- Token usage
- Cost breakdown
- Error rates

## Deployment

### 1. Configure Environment Variables in Vercel

```bash
vercel env add AI_GATEWAY_API_KEY
vercel env add OPENAI_API_KEY
vercel env add ANTHROPIC_API_KEY
```

### 2. Deploy

```bash
git push origin main
# Vercel auto-deploys
```

### 3. Verify Deployment

```bash
curl https://your-app.vercel.app/api/ai/survey-recommendations \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId":"test"}'
```

## Monitoring & Observability

### Vercel Dashboard Metrics

1. **AI Gateway Dashboard**
   - Total requests per day
   - Average latency
   - Token usage breakdown
   - Cost per feature
   - Model performance comparison

2. **Edge Logs**
   - Request/response logs
   - Error traces
   - Performance metrics

3. **Cost Analytics**
   - Daily spend
   - Cost by model
   - Budget alerts

### Custom Logging

Add to API routes:

```typescript
console.log({
  event: 'ai_request',
  model: 'gpt-4o-mini',
  userId,
  tokens: result.usage,
  latency: Date.now() - startTime,
});
```

## Best Practices

### 1. Prompt Engineering

✅ **Do**:
- Be specific and clear
- Provide context
- Use examples
- Set temperature appropriately (0.1-0.3 for factual, 0.7-0.9 for creative)

❌ **Don't**:
- Use vague instructions
- Exceed token limits
- Hardcode sensitive data

### 2. Error Handling

```typescript
try {
  const result = await generateText({ ... });
} catch (error) {
  // Log error
  console.error('AI error:', error);
  
  // Fallback to heuristic or cached response
  return fallbackResponse;
}
```

### 3. Caching

```typescript
const cache = new Map();

async function getCachedResult(key: string) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await generateText({ ... });
  cache.set(key, result);
  return result;
}
```

### 4. Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

const { success } = await ratelimit.limit(userId);
if (!success) {
  return new Response('Rate limit exceeded', { status: 429 });
}
```

## Troubleshooting

### Common Issues

**1. "API key not configured"**
- Ensure `AI_GATEWAY_API_KEY` is set in `.env.local`
- Restart dev server after adding env vars

**2. "Model not found"**
- Check model name spelling
- Verify model is available in your region
- Try fallback model

**3. "Rate limit exceeded"**
- Implement client-side rate limiting
- Add retry logic with exponential backoff
- Consider caching responses

**4. "High latency"**
- Use streaming for better UX
- Enable edge runtime
- Cache frequent requests
- Use smaller models for simple tasks

## Next Steps

1. **Enable Multi-Model Mode**: Test consensus across multiple models
2. **Add Caching**: Implement Redis caching for common queries
3. **Fine-Tuning**: Train custom models on completion data
4. **A/B Testing**: Compare model performance in production
5. **Advanced Analytics**: Build custom dashboards

## Resources

- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway)
- [Vercel AI SDK Docs](https://ai-sdk.dev/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Anthropic API Reference](https://docs.anthropic.com/)
- [QualifyFirst Use Cases Doc](./VERCEL_AI_GATEWAY_USE_CASES.md)

## Support

For issues or questions:
1. Check this guide
2. Review [VERCEL_AI_GATEWAY_USE_CASES.md](./VERCEL_AI_GATEWAY_USE_CASES.md)
3. Open a GitHub issue
4. Contact support

---

**Last Updated**: November 2025
**Version**: 1.0
