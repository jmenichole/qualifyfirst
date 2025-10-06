#!/bin/bash
# Quick CPX Research Postback Test Script

echo "🎯 Testing CPX Research Postback Integration"
echo "============================================="

# Test completed survey
echo "✅ Testing COMPLETED survey postback..."
COMPLETED_URL="https://qualifyfirst.vercel.app/api/webhooks/cpx?status=1&trans_id=test_1759716443511_1&user_id=253a9614-25ae-4901-aad0-7b1d6f00bdb8&sub_id=test_sub1&sub_id_2=test_sub2&amount_local=1.50&amount_usd=1.50&offer_id=12345&hash=505dad6910dc261778c1699fca9f1d6f&ip_click=192.168.1.1&type=complete"

echo "Sending request..."
RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" "$COMPLETED_URL")
HTTP_CODE=$(echo "$RESPONSE" | sed -n 's/.*HTTP_CODE:\([0-9]*\)$/\1/p')
BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

echo "Response Code: $HTTP_CODE"
echo "Response Body: $BODY"

if [ "$HTTP_CODE" = "200" ] && [ "$BODY" = "1" ]; then
    echo "✅ SUCCESS: Completed survey test passed!"
else
    echo "❌ FAILED: Expected HTTP 200 with body '1'"
fi

echo ""
echo "============================================="

# Test screen out
echo "❌ Testing SCREEN OUT postback..."
SCREENOUT_URL="https://qualifyfirst.vercel.app/api/webhooks/cpx?status=2&trans_id=test_1759716443511_1_screenout&user_id=253a9614-25ae-4901-aad0-7b1d6f00bdb8&sub_id=test_sub1&sub_id_2=test_sub2&amount_local=0&amount_usd=0&offer_id=12345&hash=4ed2761403480107dd9bcf392a6909cc&ip_click=192.168.1.1&type=out"

echo "Sending request..."
RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" "$SCREENOUT_URL")
HTTP_CODE=$(echo "$RESPONSE" | sed -n 's/.*HTTP_CODE:\([0-9]*\)$/\1/p')
BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

echo "Response Code: $HTTP_CODE"
echo "Response Body: $BODY"

if [ "$HTTP_CODE" = "200" ] && [ "$BODY" = "1" ]; then
    echo "✅ SUCCESS: Screen out test passed!"
else
    echo "❌ FAILED: Expected HTTP 200 with body '1'"
fi

echo ""
echo "============================================="
echo "🏁 Test completed!"
echo ""
echo "Next steps:"
echo "1. Check your database for new survey_completions entries"
echo "2. Verify webhook_logs table for any errors"
echo "3. Monitor your application logs"
echo ""
echo "If tests pass, your CPX Research integration is working! 🎉"