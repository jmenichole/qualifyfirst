# 🎯 CPX Research Postback Configuration - READY TO USE

## ✅ EXACT POSTBACK URL FOR CPX DASHBOARD

**Enter this URL in your CPX Research dashboard:**

```
https://your-vercel-app.vercel.app/api/webhooks/cpx
```

**Replace `your-vercel-app` with your actual Vercel app name!**

---

## 🔧 Setup Instructions

### 1. Get Your Vercel App URL
- Log into your Vercel dashboard
- Find your app deployment URL (e.g., `qualifyfirst-abc123.vercel.app`)

### 2. Configure CPX Research Dashboard
1. **Login to CPX Research Publisher Portal**
2. **Navigate to Settings → Postback Configuration**
3. **Enter your Postback URL:**
   ```
   https://qualifyfirst-abc123.vercel.app/api/webhooks/cpx
   ```
   *(Replace with your actual Vercel URL)*

4. **Save the configuration**

### 3. Whitelist Required IPs
Make sure CPX Research can reach your Vercel deployment. CPX uses these IPs:
- `188.40.3.73`
- `2a01:4f8:d0a:30ff::2` 
- `157.90.97.92`

*(Vercel automatically handles IP whitelisting)*

---

## 📋 CPX Research Parameters

Your webhook will receive these parameters:

| Parameter | Description | Values |
|-----------|-------------|---------|
| `{status}` | Completion status | `1` = completed, `2` = canceled |
| `{trans_id}` | Unique transaction ID | CPX generated ID |
| `{user_id}` | Your user identifier | Your user ID |
| `{subid_1}` | Custom tracking 1 | Optional value |
| `{subid_2}` | Custom tracking 2 | Optional value |
| `{amount_local}` | Amount in your currency | Decimal amount |
| `{amount_usd}` | Amount in USD | Decimal amount |
| `{ip_click}` | User's IP address | IP address |
| `{type}` | Event type | `out`, `complete`, `bonus` |
| `{secure_hash}` | Security validation | MD5 hash |

---

## 🔐 Security Configuration

**Your Security Hash:** `VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL`

**Hash Format:** `MD5({trans_id}-VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL)`

---

## ✅ What's Already Configured

- ✅ Webhook handler created at `/api/webhooks/cpx/route.ts`
- ✅ Security hash validation implemented
- ✅ Database integration ready
- ✅ JustTheTip payout processing ready
- ✅ AI feedback system integrated
- ✅ Error logging and monitoring
- ✅ Environment variables configured

---

## 🧪 Test Your Setup

After configuring CPX Research, test with this sample URL:
```
https://your-vercel-app.vercel.app/api/webhooks/cpx?status=1&trans_id=test123&user_id=testuser&amount_usd=1.50&ip_click=127.0.0.1&type=complete&secure_hash=[generated_hash]
```

Generate test hash:
```bash
node scripts/generate-secure-hash.js test123
```

---

## 🚀 You're Ready!

1. **Deploy your app to Vercel** (if not already done)
2. **Get your Vercel URL** from the dashboard
3. **Enter the postback URL** in CPX Research settings
4. **Start earning!** 💰

Your system will automatically:
- Validate incoming postbacks
- Record survey completions
- Process payouts via JustTheTip
- Train AI matching algorithms
- Handle all errors gracefully

**Need help?** Check the full documentation in `/docs/cpx-postback-setup.md`