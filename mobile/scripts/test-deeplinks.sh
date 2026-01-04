#!/bin/bash

# Test deep links for ChantiPay mobile app
# Usage: ./test-deeplinks.sh [ios|android]

PLATFORM=${1:-ios}

echo "🧪 Testing deep links for ChantiPay ($PLATFORM)"
echo ""

if [ "$PLATFORM" = "ios" ]; then
    echo "📱 Testing on iOS Simulator..."
    echo ""
    
    # Test 1: Auth callback with code
    echo "Test 1: Auth callback with code parameter"
    xcrun simctl openurl booted "chantipay://auth/callback?code=test123&type=signup"
    echo "✅ Sent: chantipay://auth/callback?code=test123&type=signup"
    echo ""
    sleep 2
    
    # Test 2: Auth callback without params
    echo "Test 2: Auth callback without parameters"
    xcrun simctl openurl booted "chantipay://auth/callback"
    echo "✅ Sent: chantipay://auth/callback"
    echo ""
    sleep 2
    
    # Test 3: Alternative scheme
    echo "Test 3: Alternative app scheme"
    xcrun simctl openurl booted "com.chantipay.app://auth/callback?token=xyz789"
    echo "✅ Sent: com.chantipay.app://auth/callback?token=xyz789"
    echo ""
    
elif [ "$PLATFORM" = "android" ]; then
    echo "🤖 Testing on Android Emulator..."
    echo ""
    
    # Test 1: Auth callback with code
    echo "Test 1: Auth callback with code parameter"
    adb shell am start -W -a android.intent.action.VIEW \
        -d "chantipay://auth/callback?code=test123&type=signup" \
        com.chantipay.app
    echo "✅ Sent: chantipay://auth/callback?code=test123&type=signup"
    echo ""
    sleep 2
    
    # Test 2: Auth callback without params
    echo "Test 2: Auth callback without parameters"
    adb shell am start -W -a android.intent.action.VIEW \
        -d "chantipay://auth/callback" \
        com.chantipay.app
    echo "✅ Sent: chantipay://auth/callback"
    echo ""
    sleep 2
    
    # Test 3: Check logcat for deep link handling
    echo "Test 3: Watching logcat for deep link logs..."
    echo "(Press Ctrl+C to stop)"
    adb logcat | grep -i "chantipay\|deep\|capacitor"
    
else
    echo "❌ Unknown platform: $PLATFORM"
    echo "Usage: ./test-deeplinks.sh [ios|android]"
    exit 1
fi

echo ""
echo "✅ Deep link tests completed!"
echo ""
echo "Expected behavior:"
echo "  1. App should open (if not already open)"
echo "  2. Console should show 'Deep link received: chantipay://...'"
echo "  3. App should navigate to /auth/callback route"
echo ""
echo "Check the app console/logs for detailed output."
