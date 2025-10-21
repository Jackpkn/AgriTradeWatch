export const en = {
  // Common
  common: {
    loading: "Loading...",
    pleaseWait: "Please wait...",
    submit: "Submit",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
    filter: "Filter",
    close: "Close",
    back: "Back",
    next: "Next",
    done: "Done",
    retry: "Retry",
    tryAgain: "Try Again",
    ok: "OK",
    yes: "Yes",
    no: "No",
    great: "Great!",
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",
    required: "Required",
    optional: "Optional",
    notProvided: "Not provided",
    comingSoon: "Coming Soon",
    version: "Version",
  },

  // App Name & Branding
  branding: {
    appName: "MandiGo",
    tagline: "Manage crops, explore prices, and prepare for digital trading",
    copyright: "© {{year}} MandiGo. All rights reserved.",
  },

  // Authentication
  auth: {
    welcomeBack: "Welcome Back!",
    createAccount: "Create Your Account",
    loginSubtitle: "Please enter your details to continue.",
    signupSubtitle: "Join our community to get started.",
    username: "Username",
    email: "Email Address",
    password: "Password",
    phoneNumber: "Phone Number (Optional)",
    forgotPassword: "Forgot Password?",
    login: "Log In",
    loggingIn: "Logging In...",
    signUp: "Sign Up",
    creatingAccount: "Creating Account...",
    signingYouIn: "Signing you in...",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",
    logout: "Sign Out",
    logoutConfirm: "Are you sure you want to sign out?",

    // User Types
    iAmA: "I am a",
    userTypeFarmer: "Farmer",
    userTypeFarmerDesc: "Grow and sell crops",
    userTypeConsumer: "Consumer",
    userTypeConsumerDesc: "Buy for personal use",

    // Location
    locationRequired: "Location access required",
    locationRequiredMessage: "📍 Location access is required to submit crop data and find nearby markets.",
    enableLocation: "Enable Location",
    waitingForLocation: "Waiting for location...",
    currentLocationDetected: "Current location detected",
    locationAutoDetect: "Auto-detect Current",
    locationAutoDetectDesc: "Use your current location",
    locationChooseMap: "Choose from Map",
    locationChooseMapDesc: "Select location manually",

    // Validation & Errors
    validationError: "Validation Error",
    loginFailed: "Login Failed",
    registrationSuccessful: "Registration Successful",
    registrationFailed: "Registration Failed",
    enterUsernamePassword: "Please enter both username and password.",
    authRequired: "Authentication Required",
    authRequiredMessage: "Please login to add crop data.",
    logoutFailed: "Failed to sign out. Please try again.",
  },

  // Navigation
  nav: {
    home: "Home",
    map: "Map",
    stats: "Stats",
    profile: "Profile",
    aboutUs: "About Us",
    register: "Register",
  },

  // Home Screen
  home: {
    welcomeBack: "Welcome back, {{username}}!",
    checkingAuth: "Checking authentication...",
    chooseLanguage: "Choose Language",
    activeFeatures: "Active Features",
    coreFeatures: "Core Features",
    quickActions: "Quick Actions",
    priceUpdates: "Price Updates",
    status: "Status",
    online: "Online",
    offline: "Offline",

    // Feature Cards
    addCropData: "Add Crop Data",
    addCropDataDesc: "Submit new crop prices and market information",
    priceMap: "Price Map",
    priceMapDesc: "Today/Yesterday/Date Range prices with location pin & radius",
    digitalThela: "Digital Thela",
    digitalThelaDesc: "Revolutionary trading platform - Coming Soon",
    featureUnavailable: "Feature Unavailable",
    featureUnavailableMessage: "This feature is coming soon!",
    explore: "Explore",

    // Quick Actions
    viewRecentPrices: "View Recent Prices",
    findNearbyMarkets: "Find Nearby Markets",
  },

  // Map Screen
  map: {
    header: "Price Information",
    dragPinTip: "💡 Drag the red pin to explore different areas",
    noPriceData: "No price data available for {{range}}.",
    noData: "No data",

    // Price Stats
    minPrice: "Min Price",
    maxPrice: "Max Price",
    avgPrice: "Avg Price",
    modalPrice: "Modal Price",

    // Date Range
    today: "Today",
    yesterday: "Yesterday",
    week: "Week",
    month: "Month",
    custom: "Custom",
    selectDateRange: "Select Date Range",
    fromDate: "From Date:",
    toDate: "To Date:",
    quickSelect: "Quick Select:",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
    last3Months: "Last 3 months",
    applyDateRange: "Apply Date Range",
    invalidDateRange: "Invalid Date Range",

    // Location & Radius
    locationRadiusControl: "Location & Radius Control",
    dragMarkerMessage: "Drag the marker on the map to change location...",
    favoriteLocations: "Favorite Locations",
    meters: "Meters",
    kilometers: "Kilometers",
    dragSliderMessage: "Drag the slider or tap steps below to adjust radius",
    itemsInRange: "items in range",

    // Analytics
    dataSummaryAnalytics: "Data Summary & Analytics",
    totalDataPoints: "Total Data Points",
    inSelectedRadius: "In Selected Radius",
    activeConsumers: "Active Consumers",
    totalFarmers: "Total Farmers",
    priceTrend: "Price Trend",
    marketVolatility: "Market Volatility",

    // Quick Actions
    quickActions: "Quick Actions",
    exportData: "Export Data",
    shareLocation: "Share Location",
    resetToMyLocation: "Reset to My Location",
    priceAlert: "Price Alert",

    // Chart Titles
    consumerBuyingPriceTrends: "Consumer Buying Price Trends",
    farmerSellingPriceTrends: "Farmer Selling Price Trends",

    // Insights
    marketInsights: "Market Insights",
    bestTimeToBuy: "Best Time to Buy",
    priceStability: "Price Stability",
    dataQuality: "Data Quality",
  },

  // Stats Screen
  stats: {
    header: "Market Analytics",
    subtitle: "Track and analyze crop price trends over time",
    consumerMarket: "Consumer Market",
    farmerMarket: "Farmer Market",
    consumerCropAnalysis: "Consumer Crop Analysis",
    farmerCropAnalysis: "Farmer Crop Analysis",
    selectCrop: "Select Crop",
    loadingCropData: "Loading crop data...",
    selectCropMessage: "Select a crop to view statistics",
    noDataForCrop: "No data available for {{crop}}",
    tryDifferentCrop: "Try selecting a different crop",
    noValidPriceData: "No valid price data for {{crop}}",
    checkPriceInfo: "Check if price information is available",
    errorLoadingChart: "Error loading chart",

    // Today's Prices
    todayPrices: "📅 Today's Prices",
    highestToday: "Highest Today",
    lowestToday: "Lowest Today",
    entriesCount: "{{count}} entries",
    todayAverage: "Today's Average: ₹{{amount}}",

    // Overall Stats
    overallMarketStats: "📊 Overall Market Stats",
    allTimeHigh: "All Time High",
    allTimeLow: "All Time Low",
    overallMedian: "Overall Median",
    overallAvg: "Overall Avg",
    priceRange: "Price Range",
    volatility: "Volatility",
    totalPoints: "Total Points",
    peakPrice: "Peak Price",
    lowPrice: "Low Price",
    dataPoints: "Data Points",

    // Market Insights
    stablePricing: "Market shows stable pricing with low volatility",
    highVolatility: "Market shows high volatility - prices vary significantly",
    goodDataCoverage: "Good data coverage with {{count}} data points",
    limitedData: "Limited data available ({{count}} points)...",

    // Actions
    hideMarketAnalytics: "Hide Market Analytics",
    showMarketAnalytics: "Show Market Analytics",
  },

  // Profile Screen
  profile: {
    header: "Profile Information",
    username: "Username",
    email: "Email",
    mobile: "Mobile",
    memberSince: "Member Since",
    preferences: "Preferences",
    language: "Language",
    languageEnglish: "English",
    userType: "User Type",
    locationMethod: "Location Method",
    loadingProfile: "Loading Profile...",
    roleUpdated: "Your role has been updated to {{userType}}.",
    roleUpdateFailed: "Failed to update role.",
  },

  // Crops Screen
  crops: {
    header: "Add Crop Data",
    cropInformation: "Crop Information",
    selectCropCommodity: "Select Crop Commodity *",
    chooseCrop: "Choose a crop...",
    pricePerKg: "Price Per Kg (₹) *",
    enterPricePerKg: "Enter price per kg",
    quantityBought: "Quantity Bought (kg) *",
    enterQuantity: "Enter quantity in kg",
    addPhoto: "Add Photo (Optional)",
    addPhotoMessage: "Adding a photo helps verify your crop data...",
    takePhoto: "Take Photo",
    fromGallery: "From Gallery",
    photoAttached: "📎 {{fileName}}",
    submitCropData: "Submit Crop Data",
    requiredFields: "* Required fields",
    locationDetected: "📍 Location: Detected",
    locationRequired: "Required for submission",

    // Coming Soon
    featureComingSoon: "Feature Coming Soon!",
    workingHardMessage: "We're working hard to bring you...",

    // Validation
    fillAllFields: "Please fill in all crop fields.",
    locationRequiredMessage: "Please enable location services...",
    validPrice: "Please enter a valid price per unit.",
    validQuantity: "Please enter a valid quantity.",

    // Success
    submissionSuccess: "Crop data submitted successfully! ID: {{id}}...",
    submissionError: "Submission Error",

    // Crop Names
    cropOnion: "Onion",
    cropTomato: "Tomato",
    cropPotato: "Potato",
    cropDrumstick: "Drumstick",
    cropCarrot: "Carrot",
    cropGinger: "Ginger",
    cropGarlic: "Garlic",
    cropGreenChilli: "Green Chilli",
    cropLemon: "Lemon",
    cropBanana: "Banana",
  },

  // Network & Connectivity
  network: {
    youreOffline: "You're offline",
    someFeaturesMayNotWork: "Some features may not work",
    connectionRestored: "Connection Restored! 🎉",
    connectionRestoredMessage: "Your internet connection is now active...",
    stillOffline: "Still Offline",
    networkStatus: "Network Status: {{type}}",
    internetReachable: "Internet Reachable: {{status}}",
    connectionCheckFailed: "Connection Check Failed",
    unableToCheckNetwork: "Unable to check network status...",
    noInternetConnection: "No Internet Connection",
    checkNetworkSettings: "Please check your network settings...",
  },

  // Language Options
  languages: {
    english: "English",
    hindi: "हिंदी",
    marathi: "मराठी",
  },
};

export type TranslationKeys = typeof en;
