# Video Downloader Flutter App

Cross-platform Flutter application for downloading videos from various platforms with a clean, modern UI.

## Features

- **Cross-Platform**: Android, Windows, macOS support
- **Modern UI**: Material Design 3 with clean interface
- **Video Extraction**: Extract metadata and available formats
- **Format Selection**: Choose between MP4 video and MP3 audio
- **Download Management**: Track downloads with progress indicators
- **Media Preview**: Preview downloaded content
- **Legal Compliance**: Built-in disclaimer screen

## Quick Start

### Prerequisites

- Flutter SDK 3.0+
- Dart 3.0+
- Android Studio / VS Code
- Backend API running (see backend README)

### Installation

1. **Navigate to the app directory:**
   ```bash
   cd frontend/video_downloader
   ```

2. **Install dependencies:**
   ```bash
   flutter pub get
   ```

3. **Configure API endpoint:**
   Edit `lib/services/api_service.dart` and update the base URL:
   ```dart
   static const String baseUrl = 'http://YOUR_BACKEND_URL:8000';
   ```

4. **Run the application:**
   ```bash
   # For Android
   flutter run

   # For Windows
   flutter run -d windows

   # For macOS
   flutter run -d macos
   ```

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
│   ├── format_info.dart     # Video format information
│   ├── video_info.dart      # Video metadata
│   ├── download_request.dart # Download request model
│   └── download_response.dart # Download response model
├── services/                 # Business logic
│   ├── api_service.dart     # Backend API communication
│   └── download_service.dart # File download management
├── screens/                  # UI screens
│   ├── disclaimer_screen.dart # Legal disclaimer
│   ├── home_screen.dart     # Main download interface
│   └── downloads_screen.dart # Download management
└── widgets/                  # Reusable components
    └── format_list_tile.dart # Format selection widget
```

## Dependencies

### Core Dependencies
- **dio**: HTTP client for API requests
- **flutter_downloader**: File download management
- **path_provider**: File system access
- **permission_handler**: Permission management

### UI Dependencies
- **cached_network_image**: Image caching and loading
- **flutter_spinkit**: Loading animations
- **video_player**: Media playback
- **chewie**: Video player wrapper

### Utility Dependencies
- **url_launcher**: URL handling
- **share_plus**: File sharing

## Architecture

### Clean Architecture Pattern

The app follows clean architecture principles with clear separation of concerns:

1. **Models**: Data structures and business entities
2. **Services**: Business logic and external API communication
3. **Screens**: UI presentation layer
4. **Widgets**: Reusable UI components

### State Management

- **StatefulWidget**: For local state management
- **FutureBuilder**: For async operations
- **StreamBuilder**: For real-time updates

## Key Features

### 1. Video Information Extraction

```dart
// Extract video metadata and available formats
final videoInfo = await _apiService.extractVideoInfo(url);
```

### 2. Format Selection

Users can choose from available video/audio formats:
- **MP4**: Video with audio
- **MP3**: Audio only (converted from video)

### 3. Download Management

- **Progress Tracking**: Real-time download progress
- **Download History**: View all downloads
- **File Management**: Open, retry, or delete downloads

### 4. Legal Compliance

Built-in disclaimer screen ensures users understand legal requirements:
- Copyright compliance
- Fair use policy
- Terms of service respect
- User responsibility

## Platform-Specific Configuration

### Android

**Permissions** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Windows

No additional configuration required. The app works out of the box.

### macOS

No additional configuration required. The app works out of the box.

## Customization

### Theming

The app uses Material Design 3 theming. Customize in `main.dart`:

```dart
theme: ThemeData(
  primarySwatch: Colors.blue,
  useMaterial3: true,
  // Add your custom theme here
),
```

### API Configuration

Update the backend URL in `lib/services/api_service.dart`:

```dart
static const String baseUrl = 'http://YOUR_SERVER:8000';
```

### Download Directory

Downloads are stored in the app's documents directory:
- **Android**: `/storage/emulated/0/Android/data/com.example.video_downloader/files/Downloads`
- **Windows**: `%USERPROFILE%\Documents\Downloads`
- **macOS**: `~/Documents/Downloads`

## Usage Guide

### 1. First Launch

1. Accept the legal disclaimer
2. Grant necessary permissions (Android)
3. Enter a video URL
4. Tap "Extract Info"

### 2. Download Process

1. **Select Format**: Choose MP4 or MP3
2. **Choose Quality**: Select from available formats
3. **Download**: Tap download button
4. **Monitor Progress**: View in downloads screen

### 3. Managing Downloads

- **View Downloads**: Tap download icon in app bar
- **Open Files**: Tap on completed downloads
- **Retry Failed**: Retry failed downloads
- **Delete**: Remove unwanted downloads

## Troubleshooting

### Common Issues

1. **"Network error"**:
   - Check backend is running
   - Verify API URL in `api_service.dart`
   - Check internet connection

2. **"Permission denied"**:
   - Grant storage permissions (Android)
   - Check app permissions in settings

3. **"Download failed"**:
   - Check available storage space
   - Verify video URL is accessible
   - Try different format/quality

4. **"No formats available"**:
   - Video may be region-locked
   - Try different video source
   - Check backend logs

### Debug Mode

Enable debug logging:

```dart
// In api_service.dart
_dio.interceptors.add(LogInterceptor(
  requestBody: true,
  responseBody: true,
  error: true,
));
```

## Development

### Adding New Features

1. **New Screens**: Add to `screens/` directory
2. **New Services**: Add to `services/` directory
3. **New Models**: Add to `models/` directory
4. **New Widgets**: Add to `widgets/` directory

### Code Style

- Follow Dart style guide
- Use meaningful variable names
- Add comments for complex logic
- Handle errors gracefully

### Testing

```bash
# Run tests
flutter test

# Run integration tests
flutter drive --target=test_driver/app.dart
```

## Building for Production

### Android

```bash
# Build APK
flutter build apk --release

# Build App Bundle
flutter build appbundle --release
```

### Windows

```bash
# Build Windows executable
flutter build windows --release
```

### macOS

```bash
# Build macOS app
flutter build macos --release
```

## Performance Optimization

### Image Loading
- Uses `cached_network_image` for efficient image caching
- Lazy loading for format lists

### Memory Management
- Proper disposal of controllers
- Efficient list rendering with `ListView.builder`

### Network Optimization
- Connection timeouts
- Request/response logging
- Error handling and retry logic

## Security Considerations

- **HTTPS**: Use HTTPS in production
- **Input Validation**: Validate URLs and user input
- **Permission Handling**: Request minimal required permissions
- **Data Privacy**: No personal data collection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on all platforms
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the backend API documentation
3. Test with different video sources
4. Check Flutter and Dart versions

