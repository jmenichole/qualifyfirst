# 🎯 CPX Research Postback Configuration - READY TO USE

## ✅ EXACT POSTBACK URLs FOR CPX DASHBOARD

### **Main Postback URL** (General Settings):
```
https://qualifyfirst.vercel.app/api/webhooks/cpx?status={status}&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type={type}
```

### **Expert Settings Postbacks**:

**1. Postback URL Screen Out:**
```
https://qualifyfirst.vercel.app/api/webhooks/cpx?status=2&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local=0&amount_usd=0&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type=out
```

**2. Postback Bonus/Rating:**
```
https://qualifyfirst.vercel.app/api/webhooks/cpx?status=1&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type=bonus
```

**3. Postback URL Event Canceled:**
```
https://qualifyfirst.vercel.app/api/webhooks/cpx?status=2&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local=0&amount_usd=0&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type=canceled
```

### **Redirect URL:**
```
https://qualifyfirst.vercel.app/cpx-research?message_id={message_id}
```
*If this format doesn't work, try: `https://qualifyfirst.vercel.app/cpx-research`*

**This is your actual Vercel URL based on your repository name!**

*(If your Vercel app has a different URL, replace accordingly)*

---

## 🔧 Setup Instructions

### 1. Get Your Vercel App URL
- Log into your Vercel dashboard
- Find your app deployment URL (e.g., `qualifyfirst-abc123.vercel.app`)

### 2. Configure CPX Research Dashboard

**A. General Settings:**
1. **Login to CPX Research Publisher Portal**
2. **Navigate to Settings → General Settings**
3. **Enter Redirect URL:**
   ```
   https://qualifyfirst.vercel.app/cpx-research?message_id={message_id}
   ```
4. **Enter Main Postback URL:**
   ```
   https://qualifyfirst.vercel.app/api/webhooks/cpx?status={status}&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type={type}
   ```

**B. Expert Settings:**
5. **Navigate to Settings → Expert Settings**
6. **Enter Postback URL Screen Out:**
   ```
   https://qualifyfirst.vercel.app/api/webhooks/cpx?status=2&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local=0&amount_usd=0&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type=out
   ```
7. **Enter Postback Bonus/Rating:**
   ```
   https://qualifyfirst.vercel.app/api/webhooks/cpx?status=1&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type=bonus
   ```
8. **Enter Postback URL Event Canceled:**
   ```
   https://qualifyfirst.vercel.app/api/webhooks/cpx?status=2&trans_id={trans_id}&user_id={user_id}&sub_id={subid_1}&sub_id_2={subid_2}&amount_local=0&amount_usd=0&offer_id={offer_ID}&hash={secure_hash}&ip_click={ip_click}&type=canceled
   ```
9. **Save all configurations**

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

### Generate Test URLs
```bash
node scripts/generate-test-users.js
```

### Sample Test URLs (with real user IDs):

**✅ COMPLETED Survey Test:**
```
https://qualifyfirst.vercel.app/api/webhooks/cpx?status=1&trans_id=test_1759716443511_1&user_id=253a9614-25ae-4901-aad0-7b1d6f00bdb8&sub_id=test_sub1&sub_id_2=test_sub2&amount_local=1.50&amount_usd=1.50&offer_id=12345&hash=505dad6910dc261778c1699fca9f1d6f&ip_click=192.168.1.1&type=complete
```

**❌ SCREEN OUT Test:**
```
https://qualifyfirst.vercel.app/api/webhooks/cpx?status=2&trans_id=test_1759716443511_1_screenout&user_id=253a9614-25ae-4901-aad0-7b1d6f00bdb8&sub_id=test_sub1&sub_id_2=test_sub2&amount_local=0&amount_usd=0&offer_id=12345&hash=4ed2761403480107dd9bcf392a6909cc&ip_click=192.168.1.1&type=out
```

### How to Test:

**Option 1: Quick Test Script**
```bash
./scripts/test-cpx-postback.sh
```

**Option 2: Generate Fresh Test Data**
```bash
node scripts/generate-test-users.js
```

**Option 3: Manual Testing**
1. **Copy any test URL** from the generator output
2. **Paste in browser** or use curl: `curl "URL_HERE"`
3. **Check response**: Should return "1" for success
4. **Verify database**: Check `survey_completions` table
5. **Check logs**: Monitor webhook processing

### Expected Results:
- ✅ HTTP 200 response with body "1"
- ✅ New entries in `survey_completions` table
- ✅ Payout processing triggered (for completed surveys)
- ✅ AI feedback recorded

---

## � Redirect URL Troubleshooting

If CPX Research says your redirect URL is "wrong", try these formats in order:

1. **First try:** `https://qualifyfirst.vercel.app/cpx-research?message_id={message_id}`
2. **If that fails:** `https://qualifyfirst.vercel.app/cpx-research`
3. **If still failing:** `https://qualifyfirst.vercel.app/cpx-research/`
4. **Alternative:** `https://qualifyfirst.vercel.app/`

**Common Issues:**
- Some CPX interfaces don't like query parameters in redirect URLs
- Try with and without trailing slashes
- Ensure your site is fully deployed and accessible

---

## �🚀 You're Ready!

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