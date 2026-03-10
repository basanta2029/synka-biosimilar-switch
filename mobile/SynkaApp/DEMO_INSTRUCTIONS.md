# SynkaApp - Demo Instructions

## 🎥 Quickest Way to See the App (Recommended for All Users)

**Watch the demo video**: [Link to be added - see "Creating Demo Video" section below]

---

## 📱 For Android Users (Hands-On Testing)

### Option 1: Install APK Directly
1. Download the APK file: `SynkaApp-demo.apk` (from this package or GitHub release)
2. Enable "Install from Unknown Sources" on your Android device
3. Transfer the APK to your device and install
4. Open "SynkaApp" from your app drawer

### Option 2: Build from Source
```bash
cd mobile/SynkaApp/android
./gradlew assembleRelease
```
APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🍎 For iOS Users (Requires Mac + Xcode)

**Note**: iOS requires building from source with Xcode

### Prerequisites
- Mac computer with Xcode installed
- iOS Simulator or physical iOS device

### Build Instructions
```bash
# Install dependencies
cd mobile/SynkaApp
npm install
cd ios && pod install && cd ..

# Run on iOS Simulator
npm run ios

# Or open in Xcode
open ios/SynkaApp.xcworkspace
```

---

## 📊 What is SynkaApp?

SynkaApp is a mobile health application for rural/remote healthcare settings that enables:

- **Patient Registration & Management**: Register and track patient information offline
- **Clinical Data Collection**: Record vital signs, symptoms, and medical history
- **Offline-First Design**: Works without internet connectivity
- **Data Synchronization**: Syncs patient data when connection is available
- **Follow-up Tracking**: Schedule and complete patient follow-ups

---

## 🎯 Key Features to Test

1. **Dashboard**: View patient statistics and pending follow-ups
2. **Register New Patient**: Add patient with demographic and clinical data
3. **Patient List**: Browse, search, and filter registered patients
4. **Patient Details**: View comprehensive patient information
5. **Follow-ups**: Schedule and complete follow-up visits
6. **Offline Mode**: Works completely offline with local SQLite database
7. **Sync Status**: View synchronization status in Settings

---

## 🎬 Creating Demo Video

If you need to create your own demo video:

### For Mac Users:
1. Use QuickTime Player (built-in)
2. Connect iOS device or use Simulator
3. File → New Screen Recording
4. Select your device/simulator
5. Record walkthrough of key features

### For Android Users:
1. Use Android Studio Screen Recording
2. Run app on emulator/device
3. Click camera icon in Android Studio
4. Record demonstration

### Recommended Video Structure:
1. **Intro** (10 sec): "This is SynkaApp, a mobile health app for rural healthcare"
2. **Dashboard** (20 sec): Show overview and statistics
3. **Register Patient** (30 sec): Walk through patient registration
4. **Patient List** (20 sec): Show browsing and search
5. **Patient Details** (20 sec): View patient information
6. **Follow-up** (30 sec): Complete a follow-up visit
7. **Offline/Sync** (20 sec): Show offline capability and sync status
8. **Outro** (10 sec): "Thank you for viewing"

**Total time**: ~2-3 minutes (perfect for quick review)

---

## 📦 Project Structure

```
SynkaApp/
├── src/
│   ├── screens/        # UI screens (Dashboard, Patient List, etc.)
│   ├── database/       # SQLite database setup and operations
│   ├── services/       # Sync service for API communication
│   ├── navigation/     # App navigation structure
│   └── utils/          # Validation and helper functions
├── android/            # Android native code
├── ios/                # iOS native code
└── package.json        # Dependencies
```

---

## 🔧 Technical Details

- **Framework**: React Native 0.82.1
- **Database**: SQLite (react-native-sqlite-storage)
- **Navigation**: React Navigation 7.x
- **State Management**: Zustand
- **UI Library**: React Native Paper
- **Form Handling**: Formik + Yup validation

---

## ❓ Troubleshooting

### APK won't install on Android
- Enable "Install from Unknown Sources" in Settings
- Check that device runs Android 5.0+ (minSdk 21)

### Build errors
- Run `npm install` to ensure all dependencies are installed
- For iOS: Run `cd ios && pod install` to install CocoaPods
- Clear caches: `npm start -- --reset-cache`

---

## 📧 Contact

For questions or issues, please contact: [Your email/contact info]

---

**Last Updated**: December 2, 2025
