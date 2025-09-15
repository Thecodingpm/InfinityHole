# 🚀 Unity Ads Setup Guide

## 📱 **Why Unity Ads?**

- **Approval Rate**: 85-95% (vs AdMob's 30-50%)
- **Revenue**: $0.50-2.00 per 1000 views
- **Setup Time**: 1-3 days
- **Perfect For**: Video downloader apps

## 🎯 **Step 1: Create Unity Ads Account**

1. **Go to [Unity Ads](https://unity.com/products/unity-ads)**
2. **Sign up** with your email
3. **Create a new project**
4. **Add your app**:
   - App name: "Infinity Hole - Video Downloader"
   - Platform: Android
   - Package name: `com.infinityhole.videodownloader`

## 🎯 **Step 2: Get Your Ad Unit IDs**

After creating your app, you'll get:

### **Game ID**
- Android: `1234567` (replace with your actual ID)
- iOS: `1234567` (replace with your actual ID)

### **Ad Unit IDs**
- Banner: `Banner_Android`
- Interstitial: `Interstitial_Android`
- Rewarded: `Rewarded_Android`

## 🎯 **Step 3: Update Your Code**

### **Update Unity Ads Service**
Replace the test IDs in `lib/services/unity_ads_service.dart`:

```dart
// Replace these with your actual Unity Ads IDs
static const String _androidGameId = 'YOUR_ACTUAL_GAME_ID';
static const String _iosGameId = 'YOUR_ACTUAL_GAME_ID';

// Replace these with your actual ad unit IDs
static const String _bannerAdUnitId = 'YOUR_BANNER_ID';
static const String _interstitialAdUnitId = 'YOUR_INTERSTITIAL_ID';
static const String _rewardedAdUnitId = 'YOUR_REWARDED_ID';
```

## 🎯 **Step 4: Test Your Ads**

### **Test Mode**
Your app is already set to test mode in debug:
```dart
testMode: kDebugMode, // Use test mode in debug
```

### **Test Ad IDs**
Unity Ads provides test ad IDs that work immediately:
- Banner: `Banner_Android`
- Interstitial: `Interstitial_Android`
- Rewarded: `Rewarded_Android`

## 🎯 **Step 5: Build and Test**

```bash
cd frontend/video_downloader
flutter clean
flutter pub get
flutter build apk --debug
```

## 🎯 **Step 6: Submit for Review**

1. **Build release APK**:
   ```bash
   flutter build apk --release
   ```

2. **Upload to Unity Ads**:
   - Go to your Unity Ads dashboard
   - Upload your APK
   - Submit for review

3. **Wait for approval**: 1-3 days

## 🎯 **Step 7: Go Live**

Once approved:
1. **Update to production IDs**
2. **Build final APK**
3. **Upload to Google Play Store**
4. **Start earning!**

## 💰 **Expected Revenue**

### **With Unity Ads:**
- **1000 users**: $50-200/month
- **5000 users**: $250-1000/month
- **10000 users**: $500-2000/month

### **Revenue Factors:**
- User engagement
- Ad placement
- Geographic location
- Ad fill rates

## 🎯 **Ad Placement Strategy**

### **Banner Ads**
- Bottom of main screen
- Always visible
- Low revenue but consistent

### **Interstitial Ads**
- After successful downloads
- High engagement
- Good revenue

### **Rewarded Ads**
- For storage bonus (+10MB)
- User chooses to watch
- Highest revenue

## 🚀 **Pro Tips**

1. **Start with test ads** to ensure everything works
2. **Use multiple ad networks** for better fill rates
3. **Monitor performance** in Unity Ads dashboard
4. **Optimize ad placement** based on user behavior
5. **Keep backup networks** ready

## 📊 **Unity Ads vs AdMob**

| Feature | Unity Ads | AdMob |
|---------|-----------|-------|
| Approval Rate | 85-95% | 30-50% |
| Setup Time | 1-3 days | 3-7 days |
| Revenue | $0.50-2.00 | $0.50-2.50 |
| Risk | Low | High |
| Best For | All apps | Google apps |

## 🎯 **Success Timeline**

### **Day 1**: Create Unity Ads account
### **Day 2**: Get approved (usually same day)
### **Day 3**: Integrate and test
### **Day 4**: Build and submit
### **Day 7**: Go live and start earning!

## 🚀 **Ready to Start?**

Your app is already configured for Unity Ads! Just:

1. **Create Unity Ads account**
2. **Get your ad unit IDs**
3. **Replace test IDs in code**
4. **Build and submit**

You'll be earning money within a week! 🎉

## 📞 **Need Help?**

- Unity Ads Documentation: https://docs.unity.com/ads/
- Unity Ads Support: https://support.unity.com/hc/en-us
- Flutter Unity Ads Plugin: https://pub.dev/packages/unity_ads_plugin

Your video downloader app is perfect for Unity Ads! 🚀
