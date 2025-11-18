# QualifyFirst - Degen Features Documentation

## Overview

QualifyFirst has been transformed into a **degen-first survey platform** with AI-powered matching, instant compensation, and full ecosystem integration. This document explains the new features that differentiate QualifyFirst from traditional survey platforms like Freecash, Pollfish, and other middlemen.

## 🎯 Core Philosophy

**"Made for Degens by Degens"**

QualifyFirst is built for gamers and degens who:
- ❌ HATE being screened out
- ❌ HATE low pay
- ❌ HATE lengthy KYC
- ❌ HATE slow payouts
- ❌ HATE bullshit survey farms

We fix all of this.

## ✨ Key Innovations

### 1. Degen Score System

**Location:** `app/lib/degen-score.ts`

The Degen Score is a behavioral profiling system that matches users to surveys based on their actual activity patterns across the ecosystem.

#### How It Works

The system calculates a 0-100 score based on 8 behavioral factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| Late Night Activity | 15% | Activity between 10pm-4am |
| Session Frequency | 10% | How often they log in |
| Tipping Generosity | 15% | JustTheTip activity |
| Risk Tolerance | 15% | Betting/prediction patterns |
| Tilt Score | 10% | From TiltCheck integration |
| Streak Commitment | 15% | Consistency in completing tasks |
| Cross-Platform Activity | 15% | Activity across ecosystem |
| Community Participation | 5% | Social engagement |

#### 8 Degen Archetypes

Each user is classified into one of 8 archetypes based on their behavior:

1. **🦉 Night Owl** - High late-night activity
   - **Survey Affinities:** Nightlife brands, entertainment, food delivery, gaming, streaming

2. **🎰 High Roller** - Big spenders, risk takers
   - **Survey Affinities:** Cryptocurrency, investment services, luxury brands, travel, premium products

3. **⭐ Steady Eddie** - Consistent and reliable
   - **Survey Affinities:** Household products, retail, consumer goods, technology, general market research

4. **🦋 Social Butterfly** - High community engagement
   - **Survey Affinities:** Social media, community products, events, networking, lifestyle brands

5. **🌊 Tilt Master** - Emotional and reactive
   - **Survey Affinities:** Behavioral research, psychology studies, emotional products, mental health

6. **📊 Prediction Pro** - Analytics minded
   - **Survey Affinities:** Market forecasting, analytics tools, financial services, data products

7. **💰 Generous Tipper** - Shares the wealth
   - **Survey Affinities:** Fintech, banking, payment services, charitable giving, financial planning

8. **👑 Degen Veteran** - All-around degen
   - **Survey Affinities:** All survey types, high-value research, longitudinal studies, panel surveys

#### Integration Points

In production, Degen Score factors come from:
- **TiltCheck** → Tilt scores and gaming patterns
- **JustTheTip** → Tipping behavior and generosity
- **CollectClock** → Prediction patterns and risk tolerance
- **DegensAgainstDecency** → Gaming activity and late-night sessions
- **Activity Logs** → Time patterns and session frequency

### 2. Smart "Un-Screw You" Screening

**Location:** `app/lib/screenout-service.ts`

Traditional survey platforms screen you out with nothing. QualifyFirst compensates you instantly.

#### Compensation Model

| Time Spent | Compensation |
|------------|--------------|
| < 1 minute | $0.05 |
| 1-2 minutes | $0.10 |
| 2-3 minutes | $0.15 |
| 3-4 minutes | $0.20 |
| 5+ minutes | $0.25-$0.50 |

#### What Happens When You Get Screened Out

1. **Instant Compensation** - Automatically credited to your balance
2. **Empathy Message** - Contextual message based on time wasted
3. **Alternative Surveys** - 3-5 better-matched surveys suggested
4. **Profile Tips** - Specific improvements to avoid future screenouts

#### Example Empathy Messages

```
< 1 min: "That sucked, but we caught it quick. Here's something for your trouble. 🤝"

1-3 min: "Getting screened out after a few minutes is the worst. We got you though. 💰"

3-5 min: "Damn, that took a while just to get rejected. Not cool. Here's compensation. 🎁"

5+ min: "That's just disrespectful to waste that much of your time. Here's extra for dealing with that BS. 👑"
```

#### Profile Improvement Tips

The system provides actionable tips to improve matching:

- "Adding your age range improves matching by 40%"
- "Employment status helps match you to relevant surveys"
- "Add hobbies to unlock niche survey opportunities"
- "Income range unlocks higher-paying financial surveys"

### 3. Ecosystem Integration

QualifyFirst is part of the **Mischief Manager Ecosystem**:

#### 🎮 TiltCheck
- Monitors emotional state during gaming
- Provides tilt scores for behavioral matching
- Suggests surveys when users are on tilt (behavioral research)

#### 💰 JustTheTip
- Instant SOL payouts via Discord bot
- Tipping behavior tracked for Degen Score
- Low friction, fast rewards

#### ⏰ CollectClock
- Prediction market activity
- Risk tolerance scoring
- Market forecasting survey matching

#### 🎲 DegensAgainstDecency
- Gaming activity patterns
- Late-night session tracking
- Entertainment brand matching

### 4. Cross-Platform Bonuses

Future implementation will include:

- **Survey Streaks** - Complete 2 surveys → get a free in-game card pack
- **Prediction Verification** - Answer a prediction verification → unlock a new TiltCheck stat
- **Gaming Rewards** - Survey completion unlocks in-game items
- **Tipping Multipliers** - High earners get bonus tip percentages

### 5. Zero-BS Matching

Unlike Freecash's approach:
```
Freecash: "Do you own a dog?" → "just kidding, you're disqualified."
```

QualifyFirst uses AI to analyze:
- Your actual activity across the ecosystem
- Your demographic and psychographic profile
- Historical survey completion patterns
- Behavioral signals from gaming/tipping/predictions

**Result:** Only see surveys you actually qualify for.

## 🎨 Design Philosophy

### Visual Identity

**Theme:** Neon Degen Aesthetic

- **Colors:**
  - Cyan (#06b6d4) - Primary accent
  - Purple (#a855f7) - Secondary accent
  - Pink (#ec4899) - Tertiary accent
  - Dark slate (#0f172a, #1e293b) - Background
  
- **Typography:**
  - Large, bold headings with gradient text
  - Emoji-first communication
  - Casual, authentic tone
  
- **Effects:**
  - Glow shadows on interactive elements
  - Gradient borders and backgrounds
  - Smooth hover animations
  - Card-based layouts with depth

### UX Principles

1. **No Corporate Bullshit** - Direct, honest communication
2. **Gamified Experience** - Streaks, scores, achievements
3. **Instant Feedback** - Real-time updates, immediate compensation
4. **Community First** - Ecosystem integration, social features
5. **Mobile Optimized** - Works great on phones

### Positioning Statement

> **The AI-powered survey matcher built for degenerates who are tired of getting screened out, underpaid, or scammed.**
> 
> Instant rewards. No bullshit. Just surveys that fit.

## 🚀 Technical Implementation

### New Services

1. **`app/lib/degen-score.ts`**
   - DegenScoreService class
   - Archetype determination
   - Survey affinity mapping
   - Mock factor generation (to be replaced with real ecosystem data)

2. **`app/lib/screenout-service.ts`**
   - ScreenoutService class
   - Compensation calculation
   - Alternative survey suggestions
   - Profile improvement tips
   - Analytics tracking

### Updated Components

1. **`app/page.tsx`** - Homepage
   - Dark theme with neon gradients
   - "Made for Degens by Degens" branding
   - Clear value propositions
   - Ecosystem references

2. **`app/dashboard/page.tsx`** - User Dashboard
   - Degen Score display with circular progress
   - Archetype badge and description
   - Survey affinity tags
   - Dark theme throughout
   - Improved survey cards

3. **`app/components/Footer.tsx`** - Site Footer
   - Ecosystem links section
   - Updated branding
   - Discord integration
   - Dark theme styling

### Database Schema (Future)

New tables needed:

```sql
-- Degen Score factors
CREATE TABLE degen_scores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  score INTEGER NOT NULL,
  archetype TEXT NOT NULL,
  late_night_activity INTEGER,
  session_frequency INTEGER,
  tipping_generosity INTEGER,
  risk_tolerance INTEGER,
  tilt_score INTEGER,
  streak_commitment INTEGER,
  cross_platform_activity INTEGER,
  community_participation INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screenout events
CREATE TABLE screenout_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  survey_id BIGINT REFERENCES surveys(id),
  survey_title TEXT,
  time_spent_seconds INTEGER,
  reason TEXT,
  compensation_amount DECIMAL(10, 2),
  compensated_at TIMESTAMPTZ,
  alternative_surveys_offered INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User balances
CREATE TABLE user_balances (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  pending_balance DECIMAL(10, 2) DEFAULT 0,
  available_balance DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL, -- 'survey_completion', 'screenout_compensation', 'referral_bonus', etc.
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
  description TEXT,
  survey_id BIGINT REFERENCES surveys(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📊 Success Metrics

### User Engagement
- **Screenout Rate:** Target < 5% (vs 30-40% industry average)
- **Survey Completion Rate:** Target > 70% (vs 40-50% industry average)
- **User Satisfaction:** Track via feedback and retention

### Business Metrics
- **Average Revenue Per User (ARPU):** Target $50+/month
- **Cross-Platform Engagement:** % of users active on 2+ ecosystem apps
- **Degen Score Accuracy:** Correlation between score and completion rate

### Platform Performance
- **Match Accuracy:** % of surveys completed without screenouts
- **Compensation Paid:** Track total paid in screenout compensation
- **Alternative Acceptance:** % of users taking alternative survey suggestions

## 🔮 Future Enhancements

### Phase 1: Real Data Integration (Next Sprint)
- [ ] Connect to TiltCheck API for real tilt scores
- [ ] Connect to JustTheTip for real tipping data
- [ ] Connect to CollectClock for prediction patterns
- [ ] Connect to DegensAgainstDecency for gaming activity

### Phase 2: Advanced Features (Q2 2025)
- [ ] Survey streak tracking and rewards
- [ ] Cross-platform bonus system
- [ ] Real-time Degen Score updates
- [ ] Machine learning for better matching
- [ ] Personalized survey recommendations

### Phase 3: Community Features (Q3 2025)
- [ ] Leaderboards by Degen Score
- [ ] Community challenges and events
- [ ] Referral bonuses with multipliers
- [ ] Social sharing of achievements
- [ ] Discord bot integration

### Phase 4: Scale & Optimize (Q4 2025)
- [ ] Mobile app (iOS/Android)
- [ ] Advanced fraud detection
- [ ] International expansion
- [ ] More survey providers
- [ ] White-label solutions

## 🎯 Competitive Advantages

| Feature | QualifyFirst | Freecash | Pollfish |
|---------|-------------|----------|----------|
| AI Matching | ✅ Degen Score | ❌ Basic | ⚠️ Limited |
| Screenout Compensation | ✅ Instant | ❌ None | ❌ None |
| Fast Payouts | ✅ SOL/Instant | ⚠️ Slow | ⚠️ Slow |
| Cross-Platform | ✅ Ecosystem | ❌ Isolated | ❌ Isolated |
| User Experience | ✅ Degen-friendly | ❌ Corporate/Scammy | ⚠️ Clinical |
| Transparency | ✅ Full | ⚠️ Limited | ⚠️ Limited |
| Community | ✅ Discord/Social | ❌ None | ❌ None |

## 💡 Key Differentiators

1. **Behavioral Intelligence** - Degen Score is unique and powerful
2. **Compensation Culture** - We value your time, even on failures
3. **Ecosystem Play** - Cross-platform data = better matching
4. **Authentic Brand** - Made for degens by degens, not corporate BS
5. **Fast Money** - Instant SOL payouts via JustTheTip
6. **Smart Matching** - See only surveys you actually qualify for

## 📚 Additional Resources

- **Homepage:** Showcases degen branding and value props
- **Dashboard:** Displays Degen Score and personalized matches
- **Footer:** Links to full ecosystem
- **Legal:** Privacy policy, terms, disclosures

## 🤝 Contributing

When adding new features:
1. Maintain the degen aesthetic and tone
2. Prioritize user experience over corporate polish
3. Integrate with ecosystem where possible
4. Track everything for Degen Score improvements
5. Be transparent and honest with users

---

**Made for Degens by Degens** 👑

*Part of the Mischief Manager Ecosystem: TiltCheck, JustTheTip, CollectClock, DegensAgainstDecency*
