# CPX Research Postback URL Setup

## Postback URL Configuration

### Your Postback URL for Vercel:
```
https://your-vercel-app.vercel.app/api/webhooks/cpx
```

**For your Vercel deployment, use your actual Vercel app URL:**

Example: If your Vercel app is `qualifyfirst-app.vercel.app`, use:
```
https://qualifyfirst-app.vercel.app/api/webhooks/cpx
```

### CPX Research Postback Format
CPX Research will call your URL with these parameters:
```
https://your-vercel-app.vercel.app/api/webhooks/cpx?status={status}&trans_id={trans_id}&user_id={user_id}&subid_1={subid_1}&subid_2={subid_2}&amount_local={amount_local}&amount_usd={amount_usd}&ip_click={ip_click}&type={type}&secure_hash={secure_hash}
```

### Secure Hash Validation
CPX uses secure_hash for validation: `MD5({trans_id}-yourappsecurehash)`

Your security hash: `VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL`

### CPX Research Dashboard Setup

1. **Login to CPX Research Publisher Dashboard**
   - Go to [CPX Research Publisher Portal](https://offers.cpxresearch.com/publisher)
   - Login with your publisher credentials

2. **Navigate to Settings**
   - Click on "Settings" or "API Settings"
   - Look for "Postback URL" or "Callback URL" section

3. **Configure Postback URL**
   - Enter your postback URL: `https://yourdomain.com/api/webhooks/cpx`
   - Make sure to use HTTPS for security
   - Save the settings

4. **Security Configuration**
   - In your CPX dashboard, note down your **Secret Key**
   - Add this to your environment variables as `CPX_SECRET_KEY`

### Environment Variables Setup

Add these to your `.env.local` file:

```env
# CPX Research Configuration
CPX_SECRET_KEY=your_secret_key_from_cpx_dashboard
CPX_PUBLISHER_ID=your_publisher_id
CPX_SECURITY_HASH=VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL
```

**Important**: The `CPX_SECURITY_HASH` is used for wall link security. If not set, it defaults to `VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL`.

### Postback Parameters

CPX Research will send the following parameters to your postback URL:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `status` | Completion status | "1" (completed) or "2" (canceled/screened out) |
| `trans_id` | CPX unique transaction ID | "12345678" |
| `user_id` | Your user identifier | "user123" |
| `subid_1` | Your subId1 (optional) | Custom tracking value |
| `subid_2` | Your subId2 (optional) | Custom tracking value |
| `amount_local` | Amount in your currency | "1.50" |
| `amount_usd` | Amount in USD | "1.50" |
| `ip_click` | User click IP address | "192.168.1.1" |
| `type` | Event type | "out", "complete", or "bonus" |
| `secure_hash` | Security validation hash | "md5hash123" |

### Testing the Postback

1. **Check Logs**
   ```bash
   # View application logs
   npm run dev
   ```

2. **Test with Sample Data**
   You can test your endpoint with a GET request:
   ```
   https://yourdomain.com/api/webhooks/cpx?user_id=test123&trans_id=test456&survey_id=survey789&currency_name=USD&reward=1.00&signature=test_signature&timestamp=1641234567&ip=127.0.0.1&status=1
   ```
   
   **With Secure Hash (for wall links):**
   ```
   https://yourdomain.com/api/webhooks/cpx?user_id=test123&trans_id=test456&survey_id=survey789&currency_name=USD&reward=1.00&signature=test_signature&timestamp=1641234567&ip=127.0.0.1&status=1&secure_hash=md5_hash_here
   ```

3. **Monitor Database**
   Check that completions are being recorded in your `survey_completions` table.

### Security Features

- **Signature Verification**: The endpoint validates CPX signatures using MD5 hashing
- **Secure Hash Validation**: For wall links, validates `MD5(user_id + '-' + security_hash)`
- **Parameter Validation**: Required parameters are checked before processing
- **Error Logging**: All errors are logged to the `webhook_logs` table
- **Graceful Failure**: Returns success to CPX even on internal errors to prevent retries

### Generate Secure Hash for Testing

To generate a secure hash for testing wall links:

**Formula**: `MD5(user_id + '-' + VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL)`

**Example**:
- User ID: `user123`
- Security Hash: `VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL`
- String to hash: `user123-VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL`
- Result: `MD5(user123-VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL)` = generate this hash

**Online MD5 Generator**: You can use any online MD5 generator to create test hashes.

### Expected Response

CPX Research expects a simple "1" response for successful processing:
- **Success Response**: HTTP 200 with body "1"
- **Content Type**: text/plain

### Troubleshooting

1. **Invalid Signature Error**
   - Check that `CPX_SECRET_KEY` is correctly set
   - Verify the secret key matches your CPX dashboard

2. **Missing Parameters**
   - Ensure CPX is sending all required parameters
   - Check your CPX dashboard configuration

3. **Database Errors**
   - Verify your database tables exist
   - Check Supabase connection settings

4. **Payout Issues**
   - Ensure user profiles have valid Discord IDs or wallet addresses
   - Check JustTheTip integration is properly configured

### Integration Flow

1. User completes survey on CPX Research
2. CPX sends postback to your endpoint
3. Signature is verified for security
4. Survey completion is recorded in database
5. Payout is processed through JustTheTip
6. AI feedback is recorded for future matching improvements
7. "1" response is returned to CPX Research

This setup ensures secure, reliable processing of CPX Research survey completions with automatic payouts through your existing JustTheTip integration.