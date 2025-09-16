#!/bin/bash

# 🚀 Infinity Hole - Flutter Setup & Build Script
# This script installs Flutter and builds all platform apps

set -e  # Exit on any error

echo "🚀 Setting up Flutter and building Infinity Hole apps..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    print_status "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    print_success "Homebrew installed successfully"
else
    print_success "Homebrew is already installed"
fi

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    print_status "Installing Flutter..."
    brew install --cask flutter
    print_success "Flutter installed successfully"
else
    print_success "Flutter is already installed"
fi

# Run flutter doctor
print_status "Running flutter doctor..."
flutter doctor

# Create downloads directory
print_status "Creating downloads directory..."
mkdir -p frontend-web/public/downloads

# Navigate to Flutter project
cd frontend/video_downloader

# Get Flutter dependencies
print_status "Getting Flutter dependencies..."
flutter pub get

# Build Android APK
print_status "Building Android APK..."
if flutter build apk --release; then
    print_success "Android APK built successfully"
    
    # Copy APK to downloads folder
    cp build/app/outputs/flutter-apk/app-release.apk ../../frontend-web/public/downloads/infinity-hole.apk
    print_success "Android APK copied to downloads folder"
else
    print_error "Failed to build Android APK"
fi

# Build Mac App
print_status "Building Mac App..."
if flutter build macos --release; then
    print_success "Mac App built successfully"
    
    # Create DMG (requires create-dmg or similar tool)
    print_warning "Mac app built. You may need to create a DMG installer manually."
    print_warning "Built files are in: build/macos/Build/Products/Release/"
else
    print_error "Failed to build Mac App"
fi

# Build Windows App
print_status "Building Windows App..."
if flutter build windows --release; then
    print_success "Windows App built successfully"
    
    # Copy Windows app to downloads folder
    print_warning "Windows app built. You may need to create an installer manually."
    print_warning "Built files are in: build/windows/runner/Release/"
else
    print_error "Failed to build Windows App"
fi

# Build iOS App (requires Xcode)
print_status "Building iOS App..."
if flutter build ios --release; then
    print_success "iOS App built successfully"
    print_warning "iOS app requires Xcode and Apple Developer account for distribution"
else
    print_warning "iOS build failed (requires Xcode and proper setup)"
fi

print_success "Build process completed!"
print_status "Next steps:"
echo "1. Deploy your website to Vercel"
echo "2. Update landing page with download links"
echo "3. Test downloads on different devices"
echo ""
print_status "Built files location:"
echo "- Android APK: frontend-web/public/downloads/infinity-hole.apk"
echo "- Mac App: frontend/video_downloader/build/macos/Build/Products/Release/"
echo "- Windows App: frontend/video_downloader/build/windows/runner/Release/"
echo "- iOS App: frontend/video_downloader/build/ios/Release-iphoneos/"

print_success "🎉 Setup complete! Your apps are ready for deployment."
