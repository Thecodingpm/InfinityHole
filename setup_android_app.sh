#!/bin/bash

echo "🚀 Setting up Android App for Publishing..."

# Navigate to Flutter app directory
cd frontend/video_downloader

echo "📦 Installing Flutter dependencies..."
flutter clean
flutter pub get

echo "🔧 Setting up Android build configuration..."

# Create upload keystore (you'll need to replace this with your actual keystore)
echo "⚠️  IMPORTANT: You need to create your own keystore for production!"
echo "Run this command to create your keystore:"
echo "keytool -genkey -v -keystore android/app/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload"

echo ""
echo "📱 Building release APK..."
flutter build apk --release

if [ $? -eq 0 ]; then
    echo "✅ APK built successfully!"
    echo "📁 APK location: build/app/outputs/flutter-apk/app-release.apk"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Set up Google AdMob account"
    echo "2. Replace test AdMob IDs in lib/services/ad_service.dart"
    echo "3. Create your app signing keystore"
    echo "4. Upload to Google Play Console"
    echo ""
    echo "📖 Read ANDROID_PUBLISHING_GUIDE.md for detailed instructions"
else
    echo "❌ APK build failed. Check the errors above."
fi

