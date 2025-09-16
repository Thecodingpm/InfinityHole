# 🚀 Flutter Setup Guide

## Install Flutter on macOS

### Option 1: Using Homebrew (Recommended)
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Flutter
brew install --cask flutter

# Verify installation
flutter doctor
```

### Option 2: Manual Installation
1. **Download Flutter SDK**
   - Go to [flutter.dev/docs/get-started/install/macos](https://flutter.dev/docs/get-started/install/macos)
   - Download Flutter SDK for macOS
   - Extract to `~/development/flutter`

2. **Add to PATH**
   ```bash
   # Add to ~/.zshrc or ~/.bash_profile
   export PATH="$PATH:~/development/flutter/bin"
   
   # Reload shell
   source ~/.zshrc
   ```

### Option 3: Using FVM (Flutter Version Management)
```bash
# Install FVM
brew tap leoafarias/fvm
brew install fvm

# Install Flutter
fvm install stable
fvm use stable
```

## After Installation

### 1. Run Flutter Doctor
```bash
flutter doctor
```

### 2. Install Required Dependencies
```bash
# Install Xcode (for iOS/Mac development)
xcode-select --install

# Install Android Studio (for Android development)
# Download from: https://developer.android.com/studio
```

### 3. Accept Android Licenses
```bash
flutter doctor --android-licenses
```

## Build Commands

Once Flutter is installed:

```bash
cd frontend/video_downloader

# Build Android APK
flutter build apk --release

# Build iOS (requires Mac + Xcode)
flutter build ios --release

# Build Mac App
flutter build macos --release

# Build Windows App
flutter build windows --release
```

## Quick Setup Script

I can create a setup script to automate this process. Would you like me to create one?
