# MandiGo

MandiGo is a comprehensive agricultural marketplace and crop management mobile application designed to empower farmers and consumers with real-time market data, price tracking, and digital commerce tools. The app provides an integrated platform for tracking crop prices, reporting damage, managing inventory, and buying/selling produce through a digital marketplace.

## Get Started

### Installation

Install all dependencies:

```bash
npm i
```

### Running the App

Start the development server:

```bash
npm start
```

Then press `a` to open the app on an Android device/emulator connected to your development machine.

Alternatively, run directly on Android:

```bash
npm run android
```

### Building for Production

#### Windows

Navigate to the android directory and build the release APK:

```bash
cd android
gradlew.bat assembleRelease
```

The APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`

#### macOS/Linux

```bash
cd android
./gradlew assembleRelease
```

#### Building AAB (Android App Bundle) for Play Store

For Play Store deployment, build an AAB instead:

**Windows:**
```bash
cd android
gradlew.bat bundleRelease
```

**macOS/Linux:**
```bash
cd android
./gradlew bundleRelease
```

The AAB will be at `android/app/build/outputs/bundle/release/app-release.aab`

#### Using EAS Build (Recommended for Expo Projects)

Install EAS CLI:
```bash
npm install -g eas-cli
```

Configure and build:
```bash
eas build --platform android
eas build --platform ios
```

## About MandiGo

MandiGo is a social welfare initiative aimed at bridging the gap between farmers and markets by providing transparent, real-time agricultural commodity pricing and a digital marketplace. The app helps farmers make informed decisions, report crop damage for insurance claims, and connect directly with buyers.

### Key Features

#### 🏠 Home Dashboard
Access all major features through an intuitive card-based interface with quick navigation to:
- Add Crop Data
- Report Damaged Crops
- Interactive Price Map
- Digital Thela Marketplace

#### 🌾 Add Crop Data
- Record crop/commodity information with buying prices
- Track quantities purchased (per kg)
- Capture or upload crop photos
- Automatic GPS location detection
- Support for 25+ commodities (vegetables, fruits, spices, legumes)

#### 🚨 Damage Reporting
- Report crop damage with detailed information
- Select commodity type and quantify damage
- Specify damage location (field/storage/transport)
- Add photos as evidence
- Track damage dates for insurance claims
- Submit reports for compensation

#### 🗺️ Interactive Price Map
- **Real-time Market Data**: View current prices on an interactive map
- **Radius Search**: Adjust search radius from 50m to 50km
- **Price Analytics**:
  - Min, Max, Modal, and Average prices
  - Consumer buying price trends
  - Farmer selling price trends
- **Date Range Filtering**: Quick presets (7, 30, 90 days) or custom ranges
- **Market Insights**: AI-powered recommendations on best buying times
- **Favorite Locations**: Save frequently checked areas
- **Multiple Map Views**: Standard, satellite, and hybrid modes

#### 🛒 Digital Thela (Marketplace)
- Browse available produce listings from local farmers
- Filter by commodity type
- View seller locations on interactive map
- Check quantity, quality level, and pricing
- Connect directly with sellers
- List your own produce for sale with:
  - Commodity and variety details
  - Quality/production level
  - Quantity and pricing
  - Photo documentation
  - Location-based visibility

#### 📊 Statistics & Analytics
- Separate data views for consumers and farmers
- Price trend analysis with interactive charts
- Historical price tracking
- Crop-specific analytics
- Manual refresh for latest data

#### 👤 Profile Management
- User profile customization
- Role selection (Farmer/Consumer)
- Location preferences
- Language settings
- App configuration

### Supported Commodities

**Vegetables**: Onion, Tomato, Potato, Cabbage, Cucumber, Carrot, Spinach, Cauliflower, Bell Pepper, Brinjal, Radish, Beetroot, and more

**Fruits**: Banana, Orange, Lemon, Pomegranate, Grapes, Papaya, Guava, Dragon Fruit

**Spices**: Ginger, Garlic, Green Chilli, Coriander, Fenugreek

**Legumes**: Cluster Beans, Cowpea, Bottle Gourd, Ridge Gourd, Pumpkin

## Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **UI Components**: React Native Paper, Ionicons
- **Maps**: Leaflet/OpenStreetMap
- **Charts**: react-native-gifted-charts
- **State Management**: React Context API
- **Location Services**: expo-location, react-native-geolocation-service
- **Camera & Media**: expo-camera, expo-image-picker
- **Backend**: Firebase
- **HTTP Client**: Axios

## App Architecture

```
app/
├── (auth)/          # Authentication screens (Login, Signup, Forgot Password)
├── (tabs)/          # Main tabbed navigation
│   ├── index.tsx    # Home screen
│   ├── stats.tsx    # Statistics & Analytics
│   ├── map.tsx      # Interactive Price Map
│   └── profile.tsx  # User Profile
├── crops.tsx        # Add Crop Data
├── damagecrop.tsx   # Damage Reporting
├── digithalthela.tsx # Digital Marketplace
├── addproduce.tsx   # Add Produce Listing
└── farmerprofile.tsx # Farmer Profile View
```

## Project Structure

- `/components` - Reusable UI components
- `/services` - API services and backend integration
- `/hooks` - Custom React hooks
- `/utils` - Utility functions
- `/context` - Global state providers
- `/constants` - App constants and configurations
- `/theme` - Styling and theming

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Environment Setup

1. Clone the repository
2. Install dependencies: `npm i`
3. Configure Firebase (add your `google-services.json` for Android)
4. Start development server: `npm start`

## Contributing

This is a social welfare project aimed at helping farmers and agricultural communities. Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

MIT License

Copyright (c) 2024 MandiGo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

**Note**: This project is developed to support agricultural communities with better market access, transparent pricing, and digital commerce capabilities.

## Support

For issues, questions, or feature requests, please open an issue in the repository.

## Acknowledgments

Built with ❤️ for farmers and agricultural communities.
