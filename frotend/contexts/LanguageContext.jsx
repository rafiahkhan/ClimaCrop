import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return { language: 'en', t: (key) => key, setLanguage: () => {} };
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('lang', language);
    if (language === 'ur') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, [language]);

  // Translation function
  const t = (key) => {
    return translations[language][key] || key;
  };

  // Helper function to translate crop names
  const translateCrop = (cropName) => {
    if (!cropName) return '';
    const cropKey = `crop.${cropName.toLowerCase()}`;
    const translated = translations[language][cropKey];
    return translated || cropName; // Return original if translation not found
  };

  // Helper function to translate temperature options
  const translateTemp = (tempOption) => {
    if (!tempOption) return '';
    const tempKey = `temp.${tempOption.toLowerCase()}`;
    const translated = translations[language][tempKey];
    return translated || tempOption; // Return original if translation not found
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateCrop, translateTemp }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Translations
const translations = {
  en: {
    // Login Page
    'login.title': 'ClimaCrop',
    'login.subtitle': 'AI-Powered Smart Farming Platform',
    'login.enterName': 'Enter Your Name',
    'login.enterPassword': 'Enter Your Password',
    'login.namePlaceholder': 'Enter your farmer name',
    'login.passwordPlaceholder': 'Enter your password',
    'login.getStarted': 'Get Started',
    'login.selectLanguage': 'Select Language',
    'login.english': 'English',
    'login.urdu': 'Urdu',
    'login.secure': 'Secure & Trusted Platform for Farmers',
    
    // Features
    'feature.revenue': 'Revenue Insights',
    'feature.fertilizer': 'Fertilizer Guide',
    'feature.predictions': 'AI Predictions',
    'feature.analytics': 'Smart Analytics',
    
    // Navigation
    'nav.home': 'Home',
    'nav.revenue': 'Revenue',
    'nav.fertilizer': 'Fertilizer',
    'nav.insights': 'Insights',
    'nav.compare': 'Compare',
    'nav.trends': 'Trends',
    'nav.favorites': 'Favorites',
    'nav.upload': 'Upload',
    'nav.logout': 'Logout',
    'nav.welcome': 'Welcome',
    
    // Home Page
    'home.welcome': 'Welcome to ClimaCrop',
    'home.subtitle': 'AI-Powered Crop Recommendation System for Smart Farming',
    'home.description': 'Get intelligent insights for better crop management, revenue prediction, and optimal fertilizer usage',
    'home.aiRevenue': 'AI Revenue Prediction',
    'home.aiRevenueDesc': 'Get accurate revenue predictions using multiple AI models including Decision Tree, XGBoost, and Random Forest algorithms with detailed charts.',
    'home.xgboost': 'XGBoost',
    'home.keyFeaturesDesc1': 'Multiple AI model predictions',
    'home.keyFeaturesDesc2': 'Interactive charts and visualizations',
    'home.keyFeaturesDesc3': 'Comprehensive fertilizer recommendations (N-P-K: Nitrogen-Phosphorus-Potassium)',
    'home.keyFeaturesDesc4': 'Pest control and disease predictions',
    'home.keyFeaturesDesc5': 'Climate risk assessment',
    'home.keyFeaturesDesc6': 'Revenue forecasting with detailed breakdown',
    'home.fertilizer': 'Fertilizer & Pest Control',
    'home.fertilizerDesc': 'Get expert recommendations for fertilizers (Nitrogen-Phosphorus-Potassium values), pesticides, and disease management with NPK charts and climate analysis.',
    'home.insights': 'Insights & Analytics',
    'home.insightsDesc': 'Explore comprehensive crop data with interactive visualizations, performance analysis, and smart recommendations.',
    'home.upload': 'Upload Data',
    'home.uploadDesc': 'Upload CSV files to update the data warehouse with new crop data. Automatically refreshes dimension and fact tables.',
    'home.compare': 'Compare Crops',
    'home.compareDesc': 'Compare different crops side-by-side to find the best option for your farming conditions and maximize your revenue.',
    'home.trends': 'Trend Analysis',
    'home.trendsDesc': 'Analyze historical trends and patterns to make informed decisions about crop selection and farming strategies.',
    'home.availableCrops': 'Available Crops',
    'home.mainCrops': 'Main Crops',
    'home.otherCrops': 'Other Crops',
    'home.keyFeatures': 'Key Features',
    'home.howItWorks': 'How It Works',
    'home.step1': 'Select Your Crop',
    'home.step1Desc': 'Choose from our database including Rice, Wheat, Maize, and more.',
    'home.step2': 'Choose Conditions',
    'home.step2Desc': 'Select temperature category (Best/Average/Worst) for your area.',
    'home.step3': 'Get AI Insights',
    'home.step3Desc': 'Receive detailed predictions, recommendations, and visualizations.',
    'home.availableCrops': 'Available Crops',
    'home.aiModels': 'AI Models',
    'home.accuracy': 'Accuracy',
    'home.available': 'Available',
    
    // Revenue Page
    'revenue.title': 'AI Crop Revenue Prediction',
    'revenue.subtitle': 'Get detailed AI-powered revenue predictions with comprehensive insights',
    'revenue.selectCrop': 'Select Crop',
    'revenue.selectTemp': 'Temperature Category',
    'revenue.getPredictions': 'Get Predictions',
    'revenue.bestConditions': 'Best Conditions',
    'revenue.averageConditions': 'Average Conditions',
    'revenue.worstConditions': 'Worst Conditions',
    'revenue.overview': 'Revenue Overview by Temperature Conditions',
    'revenue.bestVariety': 'Best Performing Variety',
    'revenue.expectedRevenue': 'Expected Revenue',
    'revenue.averageRevenue': 'Average Revenue',
    'revenue.acrossAll': 'Across all varieties',
    'revenue.comparison': 'Revenue Predictions Comparison',
    'revenue.climateFactors': 'Climate Factors',
    'revenue.yield': 'Yield',
    'revenue.price': 'Price',
    'revenue.risk': 'Risk',
    'revenue.climateScore': 'Climate Score',
    'revenue.rainfall': 'Rainfall',
    'revenue.humidity': 'Humidity',
    'revenue.effect': 'Effect',
    'revenue.district': 'District',
    'revenue.season': 'Season',
    'revenue.soil': 'Soil',
    'revenue.getStarted': 'Get Started with Revenue Predictions',
    'revenue.getStartedDesc': 'Select a crop and temperature category to see AI-powered revenue predictions',
    
    // Fertilizer Page
    'fertilizer.title': 'Fertilizer & Pest Control Recommendations',
    'fertilizer.subtitle': 'Get expert recommendations for fertilizers, pesticides, and disease management',
    'fertilizer.getRecommendations': 'Get Recommendations',
    'fertilizer.npk': 'NPK Composition (N-P-K)',
    'fertilizer.typeDistribution': 'Fertilizer Type Distribution',
    'fertilizer.climateComparison': 'Climate Factors Comparison',
    'fertilizer.fertilizer': 'Fertilizer',
    'fertilizer.fertilizerType': 'Fertilizer Type',
    'fertilizer.nitrogen': 'Nitrogen (N)',
    'fertilizer.phosphorus': 'Phosphorus (P)',
    'fertilizer.potassium': 'Potassium (K)',
    'fertilizer.pestControl': 'Pest Control',
    'fertilizer.recommendedPesticide': 'Recommended Pesticide',
    'fertilizer.expectedDisease': 'Expected Disease',
    'fertilizer.noneExpected': 'None Expected',
    'fertilizer.warning': 'Warning',
    'fertilizer.climateLocation': 'Climate & Location',
    'fertilizer.year': 'Year',
    'fertilizer.temp': 'Temp',
    'fertilizer.getStarted': 'Get Fertilizer & Pest Control Recommendations',
    'fertilizer.getStartedDesc': 'Select a crop and temperature category to get expert recommendations',
    'fertilizer.keyFeatures': 'Key Features',
    'fertilizer.feature1': 'Multiple AI model predictions',
    'fertilizer.feature2': 'Interactive charts and visualizations',
    'fertilizer.feature3': 'Comprehensive fertilizer recommendations (N-P-K)',
    'fertilizer.feature4': 'Pest control and disease predictions',
    'fertilizer.feature5': 'Climate risk assessment',
    'fertilizer.feature6': 'Revenue forecasting with detailed breakdown',
    
    // Insights Page
    'insights.title': 'Advanced Insights & Analytics',
    'insights.subtitle': 'Explore comprehensive crop data with interactive visualizations',
    'insights.selectCrop': 'Select Crop',
    'insights.selectDistrict': 'District (Optional)',
    'insights.allDistricts': 'All Districts',
    'insights.analyze': 'Analyze',
    'insights.overview': 'Overview',
    'insights.performance': 'Performance Analysis',
    'insights.recommendations': 'Smart Recommendations',
    'insights.avgRevenue': 'Avg Revenue',
    'insights.avgYield': 'Avg Yield',
    'insights.climateScore': 'Climate Score',
    'insights.topVariety': 'Top Variety',
    'insights.revenueComparison': 'Revenue Comparison',
    'insights.multiMetric': 'Multi-Metric Comparison',
    'insights.performanceRadar': 'Performance Radar',
    'insights.cropDistribution': 'Crop Distribution',
    'insights.trendAnalysis': 'Trend Analysis',
    'insights.bestStrategy': 'Best Strategy',
    'insights.averageStrategy': 'Average Strategy',
    'insights.worstStrategy': 'Worst Strategy',
    'insights.selectCropToView': 'Select a crop to view insights',
    'insights.selectCropDesc': 'Choose a crop from the dropdown above to see detailed analytics',
    
    // Crop Comparison Page
    'compare.title': 'Crop Comparison',
    'compare.subtitle': 'Compare two crops across revenue, yield, and climate factors',
    'compare.selectCropA': 'Select Crop A',
    'compare.selectCropB': 'Select Crop B',
    'compare.selectTemp': 'Temperature Category',
    'compare.compare': 'Compare Now',
    'compare.revenueComparison': 'Revenue Comparison',
    'compare.yieldComparison': 'Yield Comparison',
    'compare.modelBreakdown': 'Model Breakdown',
    'compare.bestPick': 'Best Pick',
    'compare.expectedRevenue': 'Expected Revenue',
    'compare.yield': 'Yield (kg/acre)',
    'compare.climateScore': 'Climate Score',
    'compare.noData': 'Please select crops and compare to see results.',
    
    // Trend Analysis Page
    'trends.title': 'Trend Analysis',
    'trends.subtitle': 'Analyze revenue and climate trends for a single crop',
    'trends.selectCrop': 'Select Crop',
    'trends.viewTrends': 'View Trends',
    'trends.revenueTrend': 'Revenue Trend by Temperature',
    'trends.climateTrend': 'Climate Trend (Rainfall & Humidity)',
    'trends.modelSummary': 'Model Summary',
    'trends.avgRevenue': 'Average Revenue',
    'trends.avgYield': 'Average Yield',
    'trends.riskLevel': 'Climate Risk',
    
    // Upload Page
    'upload.title': 'Upload Crop Data',
    'upload.subtitle': 'Upload CSV file to update the data warehouse',
    'upload.selectFile': 'Select CSV File',
    'upload.fileFormat': 'File must be in CSV format matching the staging table structure',
    'upload.selected': 'Selected',
    'upload.uploading': 'Uploading',
    'upload.uploadData': 'Upload Data',
    'upload.instructions': 'Instructions',
    'upload.instruction1': 'CSV file should match the structure of all_crops_validated.csv',
    'upload.instruction2': "First column 'c' will be automatically skipped",
    'upload.instruction3': 'Data will be loaded into staging table and data warehouse will be refreshed',
    'upload.instruction4': 'Dimension and fact tables will be automatically updated',
    'upload.instruction5': 'Make sure all required columns are present in the CSV',
    
    // Favorites Page
    'favorites.title': 'My Favorites',
    'favorites.subtitle': 'Your saved crops, predictions, and insights',
    'favorites.noFavorites': 'No Favorites Yet',
    'favorites.noFavoritesDesc': 'Start adding favorites from any page to see them here!',
    'favorites.totalFavorites': 'Total Favorites',
    'favorites.items': 'items',
    'favorites.revenuePredictions': 'Revenue Predictions',
    'favorites.crops': 'Crops',
    'favorites.fertilizerRecommendations': 'Fertilizer Recommendations',
    'favorites.remove': 'Remove',

    // Support Widget
    'support.needHelp': 'Need help quickly?',
    'support.cta': 'Tap a question below to see the answer',
    'support.q1': 'How do I get revenue predictions?',
    'support.a1': 'Go to Revenue, select a crop and temperature, then press Get Predictions.',
    'support.q2': 'How do I compare two crops?',
    'support.a2': 'Open Crop Comparison, pick two crops, choose temperature, then Compare.',
    'support.q3': 'How do I upload new data?',
    'support.a3': 'Open Upload page, choose your CSV, and click Upload Data.',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.share': 'Share',
    'common.favorite': 'Favorite',
    'common.removeFavorite': 'Remove from favorites',
    'common.addFavorite': 'Add to favorites',
    'common.item': 'Item',
    
    // Crop Names
    'crop.rice': 'Rice',
    'crop.cotton': 'Cotton',
    'crop.maize': 'Maize',
    'crop.wheat': 'Wheat',
    
    // Temperature Options
    'temp.best': 'Best',
    'temp.average': 'Average',
    'temp.worst': 'Worst',
    
    // Other
    'common.chooseCrop': 'Choose crop...',
    'common.chooseTemp': 'Choose temperature...',
    'common.otherCrops': 'Other Crops',
    'common.na': 'N/A',
    'common.kgPerAcre': 'kg/acre',
    
    // Risk Levels
    'risk.low': 'Low',
    'risk.medium': 'Medium',
    'risk.high': 'High',
  },
  ur: {
    // Login Page
    'login.title': 'کلائما کراپ',
    'login.subtitle': 'مصنوعی ذہانت سے چلنے والا زرعی پلیٹ فارم',
    'login.enterName': 'اپنا نام درج کریں',
    'login.enterPassword': 'اپنا پاس ورڈ درج کریں',
    'login.namePlaceholder': 'اپنا کسان کا نام درج کریں',
    'login.passwordPlaceholder': 'اپنا پاس ورڈ درج کریں',
    'login.getStarted': 'شروع کریں',
    'login.selectLanguage': 'زبان منتخب کریں',
    'login.english': 'انگریزی',
    'login.urdu': 'اردو',
    'login.secure': 'کسانوں کے لیے محفوظ اور قابل اعتماد پلیٹ فارم',
    
    // Features
    'feature.revenue': 'آمدنی کی بصیرت',
    'feature.fertilizer': 'کھاد گائیڈ',
    'feature.predictions': 'مصنوعی ذہانت کی پیشین گوئیاں',
    'feature.analytics': 'ذہین تجزیات',
    
    // Navigation
    'nav.home': 'ہوم',
    'nav.revenue': 'آمدنی',
    'nav.fertilizer': 'کھاد',
    'nav.insights': 'بصیرتیں',
    'nav.compare': 'موازنہ',
    'nav.trends': 'رجحانات',
    'nav.favorites': 'پسندیدہ',
    'nav.upload': 'اپ لوڈ',
    'nav.logout': 'لاگ آؤٹ',
    'nav.welcome': 'خوش آمدید',
    
    // Home Page
    'home.welcome': 'کلائما کراپ میں خوش آمدید',
    'home.subtitle': 'ذہین کھیتی باڑی کے لیے مصنوعی ذہانت سے چلنے والا فصل کی سفارش کا نظام',
    'home.description': 'بہتر فصل کی انتظام، آمدنی کی پیشین گوئی، اور بہترین کھاد کے استعمال کے لیے ذہین بصیرتیں حاصل کریں',
    'home.aiRevenue': 'مصنوعی ذہانت کی آمدنی کی پیشین گوئی',
    'home.aiRevenueDesc': 'فیصلہ درخت، ایکس جی بووسٹ، اور رینڈم فاریسٹ الگورتھمز سمیت متعدد مصنوعی ذہانت کے ماڈلز کا استعمال کرتے ہوئے درست آمدنی کی پیشین گوئیاں حاصل کریں۔',
    'home.xgboost': 'ایکس جی بووسٹ',
    'home.fertilizer': 'کھاد اور کیڑے مار ادویات کا کنٹرول',
    'home.fertilizerDesc': 'کھاد (نائٹروجن-فاسفورس-پوٹاشیم اقدار)، کیڑے مار ادویات، اور بیماری کے انتظام کے لیے ماہر سفارشات حاصل کریں۔',
    'home.insights': 'بصیرتیں اور تجزیات',
    'home.insightsDesc': 'انٹرایکٹو تصورات، کارکردگی کے تجزیے، اور ذہین سفارشات کے ساتھ جامع فصل کے ڈیٹا کو دریافت کریں۔',
    'home.upload': 'ڈیٹا اپ لوڈ کریں',
    'home.uploadDesc': 'نئے فصل کے ڈیٹا کے ساتھ ڈیٹا وئیر ہاؤس کو اپ ڈیٹ کرنے کے لیے CSV فائلیں اپ لوڈ کریں۔',
    'home.compare': 'فصلیں موازنہ کریں',
    'home.compareDesc': 'اپنی کھیتی باڑی کی شرائط کے لیے بہترین آپشن تلاش کرنے کے لیے مختلف فصلیں ایک دوسرے کے ساتھ موازنہ کریں۔',
    'home.trends': 'رجحان کا تجزیہ',
    'home.trendsDesc': 'فصل کی انتخاب اور کھیتی باڑی کی حکمت عملیوں کے بارے میں باخبر فیصلے کرنے کے لیے تاریخی رجحانات اور نمونوں کا تجزیہ کریں۔',
    'home.availableCrops': 'دستیاب فصلیں',
    'home.aiModels': 'مصنوعی ذہانت کے ماڈل',
    'home.accuracy': 'درستگی',
    'home.available': 'دستیاب',
    'home.availableCrops': 'دستیاب فصلیں',
    'home.mainCrops': 'اہم فصلیں',
    'home.otherCrops': 'دیگر فصلیں',
    'home.keyFeatures': 'اہم خصوصیات',
    'home.keyFeaturesDesc1': 'متعدد مصنوعی ذہانت کے ماڈل کی پیشین گوئیاں',
    'home.keyFeaturesDesc2': 'انٹرایکٹو چارٹس اور تصورات',
    'home.keyFeaturesDesc3': 'جامع کھاد کی سفارشات (N-P-K: نائٹروجن-فاسفورس-پوٹاشیم)',
    'home.keyFeaturesDesc4': 'کیڑے مار ادویات اور بیماری کی پیشین گوئیاں',
    'home.keyFeaturesDesc5': 'موسمی خطرے کا اندازہ',
    'home.keyFeaturesDesc6': 'تفصیلی تقسیم کے ساتھ آمدنی کی پیشین گوئی',
    'home.howItWorks': 'یہ کیسے کام کرتا ہے',
    'home.step1': 'اپنی فصل منتخب کریں',
    'home.step1Desc': 'ہمارے ڈیٹا بیس سے چنیں جس میں چاول، گندم، مکئی، اور مزید شامل ہیں۔',
    'home.step2': 'شرائط منتخب کریں',
    'home.step2Desc': 'اپنے علاقے کے لیے درجہ حرارت کی قسم (بہترین/اوسط/بدترین) منتخب کریں۔',
    'home.step3': 'مصنوعی ذہانت کی بصیرتیں حاصل کریں',
    'home.step3Desc': 'تفصیلی پیشین گوئیاں، سفارشات، اور تصورات وصول کریں۔',
    
    // Revenue Page
    'revenue.title': 'مصنوعی ذہانت فصل آمدنی کی پیشین گوئی',
    'revenue.subtitle': 'جامع بصیرتوں کے ساتھ تفصیلی مصنوعی ذہانت سے چلنے والی آمدنی کی پیشین گوئیاں حاصل کریں',
    'revenue.selectCrop': 'فصل منتخب کریں',
    'revenue.selectTemp': 'درجہ حرارت کی قسم',
    'revenue.getPredictions': 'پیشین گوئیاں حاصل کریں',
    'revenue.bestConditions': 'بہترین شرائط',
    'revenue.averageConditions': 'اوسط شرائط',
    'revenue.worstConditions': 'بدترین شرائط',
    'revenue.overview': 'درجہ حرارت کی شرائط کے لحاظ سے آمدنی کا جائزہ',
    'revenue.bestVariety': 'بہترین کارکردگی والی قسم',
    'revenue.expectedRevenue': 'متوقع آمدنی',
    'revenue.averageRevenue': 'اوسط آمدنی',
    'revenue.acrossAll': 'تمام اقسام میں',
    'revenue.comparison': 'آمدنی کی پیشین گوئیوں کا موازنہ',
    'revenue.climateFactors': 'موسمی عوامل',
    'revenue.yield': 'پیداوار',
    'revenue.price': 'قیمت',
    'revenue.risk': 'خطرہ',
    'revenue.climateScore': 'موسمی اسکور',
    'revenue.rainfall': 'بارش',
    'revenue.humidity': 'نمی',
    'revenue.effect': 'اثر',
    'revenue.district': 'ضلع',
    'revenue.season': 'موسم',
    'revenue.soil': 'مٹی',
    'revenue.getStarted': 'آمدنی کی پیشین گوئیوں کے ساتھ شروع کریں',
    'revenue.getStartedDesc': 'مصنوعی ذہانت سے چلنے والی آمدنی کی پیشین گوئیاں دیکھنے کے لیے فصل اور درجہ حرارت کی قسم منتخب کریں',
    
    // Fertilizer Page
    'fertilizer.title': 'کھاد اور کیڑے مار ادویات کی سفارشات',
    'fertilizer.subtitle': 'کھاد، کیڑے مار ادویات، اور بیماری کے انتظام کے لیے ماہر سفارشات حاصل کریں',
    'fertilizer.getRecommendations': 'سفارشات حاصل کریں',
    'fertilizer.npk': 'NPK ترکیب (N-P-K)',
    'fertilizer.typeDistribution': 'کھاد کی قسم کی تقسیم',
    'fertilizer.climateComparison': 'موسمی عوامل کا موازنہ',
    'fertilizer.fertilizer': 'کھاد',
    'fertilizer.fertilizerType': 'کھاد کی قسم',
    'fertilizer.nitrogen': 'نائٹروجن (N)',
    'fertilizer.phosphorus': 'فاسفورس (P)',
    'fertilizer.potassium': 'پوٹاشیم (K)',
    'fertilizer.pestControl': 'کیڑے مار کنٹرول',
    'fertilizer.recommendedPesticide': 'تجویز کردہ کیڑے مار دوا',
    'fertilizer.expectedDisease': 'متوقع بیماری',
    'fertilizer.noneExpected': 'کوئی متوقع نہیں',
    'fertilizer.warning': 'انتباہ',
    'fertilizer.climateLocation': 'موسم اور مقام',
    'fertilizer.year': 'سال',
    'fertilizer.temp': 'درجہ حرارت',
    'fertilizer.getStarted': 'کھاد اور کیڑے مار ادویات کی سفارشات حاصل کریں',
    'fertilizer.getStartedDesc': 'ماہر سفارشات حاصل کرنے کے لیے فصل اور درجہ حرارت کی قسم منتخب کریں',
    
    // Insights Page
    'insights.title': 'اعلیٰ بصیرتیں اور تجزیات',
    'insights.subtitle': 'انٹرایکٹو تصورات کے ساتھ جامع فصل کے ڈیٹا کو دریافت کریں',
    'insights.selectCrop': 'فصل منتخب کریں',
    'insights.selectDistrict': 'ضلع (اختیاری)',
    'insights.allDistricts': 'تمام اضلاع',
    'insights.analyze': 'تجزیہ کریں',
    'insights.overview': 'جائزہ',
    'insights.performance': 'کارکردگی کا تجزیہ',
    'insights.recommendations': 'ذہین سفارشات',
    'insights.avgRevenue': 'اوسط آمدنی',
    'insights.avgYield': 'اوسط پیداوار',
    'insights.climateScore': 'موسمی اسکور',
    'insights.topVariety': 'بہترین قسم',
    'insights.revenueComparison': 'آمدنی کا موازنہ',
    'insights.multiMetric': 'کثیر میٹرک موازنہ',
    'insights.performanceRadar': 'کارکردگی ریڈار',
    'insights.cropDistribution': 'فصل کی تقسیم',
    'insights.trendAnalysis': 'رجحان کا تجزیہ',
    'insights.bestStrategy': 'بہترین حکمت عملی',
    'insights.averageStrategy': 'اوسط حکمت عملی',
    'insights.worstStrategy': 'بدترین حکمت عملی',
    'insights.selectCropToView': 'بصیرتیں دیکھنے کے لیے فصل منتخب کریں',
    'insights.selectCropDesc': 'تفصیلی تجزیات دیکھنے کے لیے اوپر والے ڈراپ ڈاؤن سے فصل منتخب کریں',
    
    // Crop Comparison Page
    'compare.title': 'فصلوں کا موازنہ',
    'compare.subtitle': 'دو فصلوں کو آمدنی، پیداوار اور موسمی عوامل پر موازنہ کریں',
    'compare.selectCropA': 'فصل A منتخب کریں',
    'compare.selectCropB': 'فصل B منتخب کریں',
    'compare.selectTemp': 'درجہ حرارت کی قسم',
    'compare.compare': 'موازنہ کریں',
    'compare.revenueComparison': 'آمدنی کا موازنہ',
    'compare.yieldComparison': 'پیداوار کا موازنہ',
    'compare.modelBreakdown': 'ماڈل کی تفصیل',
    'compare.bestPick': 'بہترین انتخاب',
    'compare.expectedRevenue': 'متوقع آمدنی',
    'compare.yield': 'پیداوار (کلو/ایکڑ)',
    'compare.climateScore': 'موسمی اسکور',
    'compare.noData': 'براہِ کرم فصلیں منتخب کریں اور موازنہ کریں تاکہ نتائج دیکھ سکیں۔',
    
    // Trend Analysis Page
    'trends.title': 'رجحان کا تجزیہ',
    'trends.subtitle': 'ایک فصل کے لیے آمدنی اور موسمی رجحانات کا تجزیہ کریں',
    'trends.selectCrop': 'فصل منتخب کریں',
    'trends.viewTrends': 'رجحانات دیکھیں',
    'trends.revenueTrend': 'درجہ حرارت کے لحاظ سے آمدنی کا رجحان',
    'trends.climateTrend': 'موسمی رجحان (بارش اور نمی)',
    'trends.modelSummary': 'ماڈل کا خلاصہ',
    'trends.avgRevenue': 'اوسط آمدنی',
    'trends.avgYield': 'اوسط پیداوار',
    'trends.riskLevel': 'موسمی خطرہ',
    
    // Upload Page
    'upload.title': 'فصل کا ڈیٹا اپ لوڈ کریں',
    'upload.subtitle': 'ڈیٹا وئیر ہاؤس کو اپ ڈیٹ کرنے کے لیے CSV فائل اپ لوڈ کریں',
    'upload.selectFile': 'CSV فائل منتخب کریں',
    'upload.fileFormat': 'فائل CSV فارمیٹ میں ہونی چاہیے جو اسٹیجنگ ٹیبل کی ساخت سے میل کھاتی ہو',
    'upload.selected': 'منتخب شدہ',
    'upload.uploading': 'اپ لوڈ ہو رہا ہے',
    'upload.uploadData': 'ڈیٹا اپ لوڈ کریں',
    'upload.instructions': 'ہدایات',
    'upload.instruction1': 'CSV فائل all_crops_validated.csv کی ساخت سے میل کھانی چاہیے',
    'upload.instruction2': "پہلا کالم 'c' خود بخود چھوڑ دیا جائے گا",
    'upload.instruction3': 'ڈیٹا اسٹیجنگ ٹیبل میں لوڈ ہوگا اور ڈیٹا وئیر ہاؤس تازہ ہوگا',
    'upload.instruction4': 'ڈائمینشن اور فیکٹ ٹیبلز خود بخود اپ ڈیٹ ہوں گی',
    'upload.instruction5': 'یقینی بنائیں کہ CSV میں تمام ضروری کالم موجود ہیں',
    
    // Favorites Page
    'favorites.title': 'میری پسندیدہ',
    'favorites.subtitle': 'آپ کی محفوظ شدہ فصلیں، پیشین گوئیاں، اور بصیرتیں',
    'favorites.noFavorites': 'ابھی تک کوئی پسندیدہ نہیں',
    'favorites.noFavoritesDesc': 'یہاں دیکھنے کے لیے کسی بھی صفحے سے پسندیدہ شامل کرنا شروع کریں!',
    'favorites.totalFavorites': 'کل پسندیدہ',
    'favorites.items': 'اشیاء',
    'favorites.revenuePredictions': 'آمدنی کی پیشین گوئیاں',
    'favorites.crops': 'فصلیں',
    'favorites.fertilizerRecommendations': 'کھاد کی سفارشات',
    'favorites.remove': 'ہٹائیں',

    // Support Widget
    'support.needHelp': 'جلدی مدد چاہیے؟',
    'support.cta': 'جواب دیکھنے کے لیے نیچے سوال پر کلک کریں',
    'support.q1': 'آمدنی کی پیشین گوئی کیسے حاصل کروں؟',
    'support.a1': 'آمدنی والے صفحے پر جائیں، فصل اور درجہ حرارت منتخب کریں، پھر "پیشین گوئیاں حاصل کریں" پر کلک کریں۔',
    'support.q2': 'دو فصلوں کا موازنہ کیسے کروں؟',
    'support.a2': 'فصلوں کا موازنہ صفحہ کھولیں، دو فصلیں اور درجہ حرارت منتخب کریں، پھر "موازنہ کریں" دبائیں۔',
    'support.q3': 'نیا ڈیٹا کیسے اپ لوڈ کروں؟',
    'support.a3': 'اپ لوڈ صفحہ کھولیں، اپنی CSV منتخب کریں، اور "ڈیٹا اپ لوڈ کریں" پر کلک کریں۔',
    
    // Common
    'common.loading': 'لوڈ ہو رہا ہے...',
    'common.error': 'خرابی',
    'common.success': 'کامیابی',
    'common.cancel': 'منسوخ',
    'common.save': 'محفوظ کریں',
    'common.delete': 'حذف کریں',
    'common.edit': 'ترمیم',
    'common.close': 'بند کریں',
    'common.search': 'تلاش',
    'common.filter': 'فلٹر',
    'common.export': 'برآمد',
    'common.share': 'شیئر',
    'common.favorite': 'پسندیدہ',
    'common.removeFavorite': 'پسندیدہ سے ہٹائیں',
    'common.addFavorite': 'پسندیدہ میں شامل کریں',
    'common.item': 'آئٹم',
    
    // Crop Names
    'crop.rice': 'چاول',
    'crop.cotton': 'کپاس',
    'crop.maize': 'مکئی',
    'crop.wheat': 'گندم',
    
    // Temperature Options
    'temp.best': 'بہترین',
    'temp.average': 'اوسط',
    'temp.worst': 'بدترین',
    
    // Other
    'common.chooseCrop': 'فصل منتخب کریں...',
    'common.chooseTemp': 'درجہ حرارت منتخب کریں...',
    'common.otherCrops': 'دیگر فصلیں',
    'common.na': 'دستیاب نہیں',
    'common.kgPerAcre': 'کلوگرام/ایکڑ',
    
    // Risk Levels
    'risk.low': 'کم',
    'risk.medium': 'درمیانی',
    'risk.high': 'زیادہ',
  }
};



