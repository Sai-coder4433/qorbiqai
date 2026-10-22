import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' }
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Nav & Shell
    'nav.overview': 'Overview',
    'nav.business_profile': 'Business Profile',
    'nav.reviews': 'Reviews',
    'nav.posts': 'Posts',
    'nav.photos': 'Photos',
    'nav.local_seo': 'Local SEO',
    'nav.keywords': 'Keywords',
    'nav.competitors': 'Competitors',
    'nav.visibility': 'Visibility Grid',
    'nav.search_console': 'Search Console',
    'nav.local_analytics': 'Local Analytics',
    'nav.reports': 'Reports',
    'nav.ai_actions': 'AI Action Center',
    'nav.automations': 'Automations',
    'nav.private_feedback': 'Private Feedback',
    'nav.settings': 'Settings',
    'nav.google_connection': 'Google Business Profile',
    'nav.google_integrations': 'Google Integrations',
    'nav.admin_panel': 'Admin Control Plane',
    'nav.developer_portal': 'Developer Portal',

    // Top bar & Common
    'common.search': 'Search...',
    'common.sync_now': 'Sync Now',
    'common.syncing': 'Syncing...',
    'common.reconnect_google': 'Reconnect Google',
    'common.connected': 'Connected',
    'common.needs_reconnect': 'Needs Reconnect',
    'common.disconnected': 'Disconnected',
    'common.not_available': 'Not available',
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.active': 'Active',
    'common.paused': 'Paused',
    'common.success': 'Success',
    'common.failed': 'Failed',
    'common.actions': 'Actions',
    'common.filter': 'Filter',
    'common.last_synced': 'Last synced',
    'common.view_details': 'View Details',
    'common.language': 'Language',

    // Dashboard
    'dashboard.title': 'Business Health',
    'dashboard.subtitle': 'Manage your Google Business Profile and local growth.',
    'dashboard.google_connected': 'Google Business Profile Connected',
    'dashboard.connection_renew_notice': 'Google connection needs to be renewed to sync reviews & performance.',
    'dashboard.profile_views': 'Profile Views',
    'dashboard.searches': 'Searches',
    'dashboard.customer_actions': 'Customer Actions',
    'dashboard.rating': 'Average Rating',
    'dashboard.needs_attention': 'Needs Attention',
    'dashboard.unanswered_reviews': 'Unanswered Reviews',
    'dashboard.active_automations': 'Active Automations',
    'dashboard.quick_actions': 'Quick Actions',
    'dashboard.create_post': 'Create Google Post',
    'dashboard.review_qr': 'Get Review QR / NFC',

    // Reviews & AI
    'reviews.title': 'Review Management',
    'reviews.subtitle': 'Monitor, draft, and publish replies to Google customer reviews.',
    'reviews.generate_reply': 'Generate AI Reply',
    'reviews.approve_publish': 'Approve & Publish',
    'reviews.auto_reply_active': 'Auto-Reply Active',
    'reviews.needs_human_review': 'Needs Human Review',
    'reviews.variation_a': 'Option A (Professional)',
    'reviews.variation_b': 'Option B (Warm & Grateful)',
    'reviews.variation_c': 'Option C (Concise)',
    'reviews.sensitive_warning': 'Flagged for human review: contains complaint or sensitive topic.',
    'reviews.copy_success': 'Reply copied to clipboard',

    // Customer Review NFC / QR Flow
    'review_flow.heading': 'How was your experience?',
    'review_flow.subtitle': 'Your feedback helps our local team serve you better.',
    'review_flow.select_rating': 'Tap a star to rate your visit',
    'review_flow.chips_label': 'What stood out during your visit?',
    'review_flow.generate_draft': 'Draft review with AI',
    'review_flow.copy_review': 'Copy Review',
    'review_flow.copied': 'Review copied!',
    'review_flow.continue_google': 'Continue to Google to Post',
    'review_flow.private_feedback_title': 'Send Private Feedback to Owner',
    'review_flow.private_feedback_desc': 'Have an issue or private suggestion? Send it directly to management.',
    'review_flow.submit_private': 'Submit Private Feedback',
    'review_flow.private_success': 'Thank you! Your feedback has been sent directly to the store manager.',

    // Local Analytics
    'analytics.title': 'Local Analytics',
    'analytics.subtitle': 'Local customer activity, discovery & engagement via Google Business Profile Performance API.',
    'analytics.calls': 'Calls',
    'analytics.directions': 'Direction Requests',
    'analytics.messages': 'Messages',
    'analytics.discovery': 'Customer Discovery',
    'analytics.google_search': 'Google Search',
    'analytics.google_maps': 'Google Maps',
    'analytics.direct_discovery': 'Direct Discovery',
    'analytics.branded_searches': 'Branded Searches',

    // Google Connection Center
    'google_center.title': 'Google Business Profile Connection',
    'google_center.subtitle': 'Manage OAuth authorizations, location mappings, and Google Cloud Pub/Sub realtime notifications.',
    'google_center.account': 'Connected Google Account',
    'google_center.location': 'Selected Location',
    'google_center.realtime_pubsub': 'Pub/Sub Realtime Sync',
    'google_center.realtime_active': 'Live Webhook Active',
    'google_center.realtime_unavailable': 'Realtime Google updates are temporarily unavailable. Last synced via scheduler.'
  },

  hi: {
    // Nav & Shell
    'nav.overview': 'अवलोकन',
    'nav.business_profile': 'व्यावसायिक प्रोफ़ाइल',
    'nav.reviews': 'समीक्षाएं (Reviews)',
    'nav.posts': 'गूगल पोस्ट्स',
    'nav.photos': 'फ़ोटो',
    'nav.local_seo': 'लोकल एसईओ',
    'nav.keywords': 'कीवर्ड्स',
    'nav.competitors': 'प्रतिस्पर्धी (Competitors)',
    'nav.visibility': 'विजिबिलिटी ग्रिड',
    'nav.search_console': 'सर्च कंसोल',
    'nav.local_analytics': 'लोकल एनालिटिक्स',
    'nav.reports': 'रिपोर्ट्स',
    'nav.ai_actions': 'एआई एक्शन सेंटर',
    'nav.automations': 'ऑटोमेशन',
    'nav.private_feedback': 'निजी फ़ीडबैक',
    'nav.settings': 'सेटिंग्स',
    'nav.google_connection': 'गूगल बिज़नेस प्रोफ़ाइल',
    'nav.google_integrations': 'गूगल इंटीग्रेशन',
    'nav.admin_panel': 'एडमिन कंट्रोल प्लेन',
    'nav.developer_portal': 'डेवलपर पोर्टल',

    // Top bar & Common
    'common.search': 'खोजें...',
    'common.sync_now': 'अभी सिंक करें',
    'common.syncing': 'सिंक हो रहा है...',
    'common.reconnect_google': 'गूगल पुनः कनेक्ट करें',
    'common.connected': 'सफलतापूर्वक कनेक्टेड',
    'common.needs_reconnect': 'पुनः कनेक्शन आवश्यक',
    'common.disconnected': 'डिस्कनेक्टेड',
    'common.not_available': 'उपलब्ध नहीं',
    'common.save': 'परिवर्तन सहेजें',
    'common.cancel': 'रद्द करें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.active': 'सक्रिय',
    'common.paused': 'रोका गया',
    'common.success': 'सफल',
    'common.failed': 'असफल',
    'common.actions': 'कार्रवाई',
    'common.filter': 'फ़िल्टर',
    'common.last_synced': 'अंतिम सिंक',
    'common.view_details': 'विवरण देखें',
    'common.language': 'भाषा (Language)',

    // Dashboard
    'dashboard.title': 'व्यापार स्वास्थ्य (Business Health)',
    'dashboard.subtitle': 'अपनी गूगल बिज़नेस प्रोफ़ाइल और स्थानीय वृद्धि को प्रबंधित करें।',
    'dashboard.google_connected': 'गूगल बिज़नेस प्रोफ़ाइल कनेक्टेड',
    'dashboard.connection_renew_notice': 'समीक्षाएं और प्रदर्शन सिंक करने के लिए गूगल कनेक्शन को नवीनीकृत करने की आवश्यकता है।',
    'dashboard.profile_views': 'प्रोफ़ाइल व्यूज़',
    'dashboard.searches': 'सर्च (खोजें)',
    'dashboard.customer_actions': 'ग्राहक कार्रवाइयां',
    'dashboard.rating': 'औसत रेटिंग',
    'dashboard.needs_attention': 'ध्यान देने योग्य',
    'dashboard.unanswered_reviews': 'अनुत्तरित समीक्षाएं',
    'dashboard.active_automations': 'सक्रिय ऑटोमेशन',
    'dashboard.quick_actions': 'त्वरित कार्रवाइयां',
    'dashboard.create_post': 'गूगल पोस्ट बनाएं',
    'dashboard.review_qr': 'समीक्षा QR / NFC प्राप्त करें',

    // Reviews & AI
    'reviews.title': 'समीक्षा प्रबंधन',
    'reviews.subtitle': 'गूगल ग्राहकों की समीक्षाओं की निगरानी करें और उत्तर प्रकाशित करें।',
    'reviews.generate_reply': 'एआई उत्तर बनाएं',
    'reviews.approve_publish': 'स्वीकार करें और प्रकाशित करें',
    'reviews.auto_reply_active': 'ऑटो-रिप्लाई सक्रिय',
    'reviews.needs_human_review': 'मानव समीक्षा आवश्यक',
    'reviews.variation_a': 'विकल्प A (पेशेवर)',
    'reviews.variation_b': 'विकल्प B (आभारपूर्ण)',
    'reviews.variation_c': 'विकल्प C (संक्षिप्त)',
    'reviews.sensitive_warning': 'मानव समीक्षा के लिए चिह्नित: शिकायत या संवेदनशील विषय शामिल है।',
    'reviews.copy_success': 'उत्तर क्लिपबोर्ड पर कॉपी हो गया',

    // Customer Review NFC / QR Flow
    'review_flow.heading': 'आपका अनुभव कैसा रहा?',
    'review_flow.subtitle': 'आपकी प्रतिक्रिया हमारे स्थानीय दल को बेहतर सेवा प्रदान करने में मदद करती है।',
    'review_flow.select_rating': 'अपनी रेटिंग चुनने के लिए स्टार पर टैप करें',
    'review_flow.chips_label': 'आपकी यात्रा के दौरान क्या विशेष था?',
    'review_flow.generate_draft': 'एआई से समीक्षा तैयार करें',
    'review_flow.copy_review': 'समीक्षा कॉपी करें',
    'review_flow.copied': 'समीक्षा कॉपी हो गई!',
    'review_flow.continue_google': 'गूगल पर पोस्ट करने के लिए आगे बढ़ें',
    'review_flow.private_feedback_title': 'मालिक को निजी प्रतिक्रिया भेजें',
    'review_flow.private_feedback_desc': 'कोई समस्या या निजी सुझाव है? सीधे प्रबंधन को भेजें।',
    'review_flow.submit_private': 'निजी प्रतिक्रिया सबमिट करें',
    'review_flow.private_success': 'धन्यवाद! आपकी प्रतिक्रिया सीधे स्टोर मैनेजर को भेज दी गई है।',

    // Local Analytics
    'analytics.title': 'लोकल एनालिटिक्स',
    'analytics.subtitle': 'गूगल बिज़नेस प्रोफ़ाइल परफॉर्मेंस एपीआई के माध्यम से स्थानीय ग्राहक गतिविधि।',
    'analytics.calls': 'फ़ोन कॉल्स',
    'analytics.directions': 'दिशा-निर्देश अनुरोध',
    'analytics.messages': 'संदेश (Messages)',
    'analytics.discovery': 'ग्राहक खोज (Discovery)',
    'analytics.google_search': 'गूगल सर्च',
    'analytics.google_maps': 'गूगल मैप्स',
    'analytics.direct_discovery': 'प्रत्यक्ष खोज',
    'analytics.branded_searches': 'ब्रांडेड सर्च',

    // Google Connection Center
    'google_center.title': 'गूगल बिज़नेस प्रोफ़ाइल कनेक्शन',
    'google_center.subtitle': 'OAuth प्राधिकरण, लोकेशन मैपिंग और रीयलटाइम क्लाउड पब/सब का प्रबंधन करें।',
    'google_center.account': 'कनेक्टेड गूगल खाता',
    'google_center.location': 'चयनित लोकेशन',
    'google_center.realtime_pubsub': 'पब/सब रीयलटाइम सिंक',
    'google_center.realtime_active': 'लाइव वेबहुक सक्रिय',
    'google_center.realtime_unavailable': 'रीयलटाइम गूगल अपडेट अस्थायी रूप से अनुपलब्ध हैं। शेड्यूलर द्वारा सिंक किया गया।'
  },

  mr: {
    // Nav & Shell
    'nav.overview': 'अवलोकन',
    'nav.business_profile': 'व्यवसाय प्रोफाईल',
    'nav.reviews': 'पुनरावलोकने (Reviews)',
    'nav.posts': 'गुगल पोस्ट्स',
    'nav.photos': 'छायाचित्रे',
    'nav.local_seo': 'स्थानिक एसईओ',
    'nav.keywords': 'कीवर्ड्स',
    'nav.competitors': 'प्रतिस्पर्धी',
    'nav.visibility': 'दृश्यमानता ग्रिड',
    'nav.search_console': 'सर्च कन्सोल',
    'nav.local_analytics': 'स्थानिक विश्लेषण',
    'nav.reports': 'अहवाल (Reports)',
    'nav.ai_actions': 'एआय ॲक्शन सेंटर',
    'nav.automations': 'ऑटोमेशन',
    'nav.private_feedback': 'खाजगी अभिप्राय',
    'nav.settings': 'सेटिंग्ज',
    'nav.google_connection': 'गुगल बिझनेस प्रोफाईल',
    'nav.google_integrations': 'गुगल इंटिग्रेशन',
    'nav.admin_panel': 'ॲडमिन कंट्रोल प्लेन',
    'nav.developer_portal': 'डेव्हलपर पोर्टल',

    // Top bar & Common
    'common.search': 'शोधा...',
    'common.sync_now': 'आता सिंक करा',
    'common.syncing': 'सिंक होत आहे...',
    'common.reconnect_google': 'गुगल पुन्हा कनेक्ट करा',
    'common.connected': 'यशस्वीरित्या जोडले',
    'common.needs_reconnect': 'पुन्हा जोडणी आवश्यक',
    'common.disconnected': 'डिस्कनेक्ट केले',
    'common.not_available': 'उपलब्ध नाही',
    'common.save': 'बदल जतन करा',
    'common.cancel': 'रद्द करा',
    'common.edit': 'संपादित करा',
    'common.delete': 'हटवा',
    'common.active': 'सक्रिय',
    'common.paused': 'थांबवले',
    'common.success': 'यशस्वी',
    'common.failed': 'अयशस्वी',
    'common.actions': 'कृती',
    'common.filter': 'फिल्टर',
    'common.last_synced': 'शेवटचे सिंक',
    'common.view_details': 'तपशील पहा',
    'common.language': 'भाषा (Language)',

    // Dashboard
    'dashboard.title': 'व्यवसाय आरोग्य (Business Health)',
    'dashboard.subtitle': 'तुमचे गुगल बिझनेस प्रोफाईल आणि स्थानिक व्यवसाय वाढ व्यवस्थापित करा.',
    'dashboard.google_connected': 'गुगल बिझनेस प्रोफाईल कनेक्टेड',
    'dashboard.connection_renew_notice': 'पुनरावलोकने आणि कार्यप्रदर्शन सिंक करण्यासाठी गुगल कनेक्शनचे नूतनीकरण करणे आवश्यक आहे.',
    'dashboard.profile_views': 'प्रोफाईल व्ह्यूज',
    'dashboard.searches': 'शोध (Searches)',
    'dashboard.customer_actions': 'ग्राहक कृती',
    'dashboard.rating': 'सरासरी रेटिंग',
    'dashboard.needs_attention': 'लक्ष देणे आवश्यक',
    'dashboard.unanswered_reviews': 'अनुत्तरित पुनरावलोकने',
    'dashboard.active_automations': 'सक्रिय ऑटोमेशन्स',
    'dashboard.quick_actions': 'त्वरित कृती',
    'dashboard.create_post': 'गुगल पोस्ट तयार करा',
    'dashboard.review_qr': 'रिव्ह्यू QR / NFC मिळवा',

    // Reviews & AI
    'reviews.title': 'पुनरावलोकन व्यवस्थापन',
    'reviews.subtitle': 'गुगल ग्राहकांच्या पुनरावलोकनांचे निरीक्षण करा आणि उत्तरे प्रकाशित करा.',
    'reviews.generate_reply': 'एआय उत्तर तयार करा',
    'reviews.approve_publish': 'मंजूर करा आणि प्रकाशित करा',
    'reviews.auto_reply_active': 'ऑटो-रिप्लाय सक्रिय',
    'reviews.needs_human_review': 'मानवी पुनरावलोकन आवश्यक',
    'reviews.variation_a': 'पर्याय A (व्यावसायिक)',
    'reviews.variation_b': 'पर्याय B (कृतज्ञतापूर्ण)',
    'reviews.variation_c': 'पर्याय C (संक्षिप्त)',
    'reviews.sensitive_warning': 'मानवी तपासणीसाठी ध्वजांकित: तक्रार किंवा संवेदनशील विषय समाविष्ट आहे.',
    'reviews.copy_success': 'उत्तर क्लिपबोर्डवर कॉपी केले',

    // Customer Review NFC / QR Flow
    'review_flow.heading': 'तुमचा अनुभव कसा होता?',
    'review_flow.subtitle': 'तुमचा अभिप्राय आमच्या स्थानिक टीमला अधिक चांगली सेवा देण्यास मदत करतो.',
    'review_flow.select_rating': 'रेटिंग देण्यासाठी स्टारवर टॅप करा',
    'review_flow.chips_label': 'तुमच्या भेटीदरम्यान काय विशेष वाटले?',
    'review_flow.generate_draft': 'एआय सह पुनरावलोकन मसुदा तयार करा',
    'review_flow.copy_review': 'पुनरावलोकन कॉपी करा',
    'review_flow.copied': 'पुनरावलोकन कॉपी केले!',
    'review_flow.continue_google': 'गुगलवर पोस्ट करण्यासाठी पुढे जा',
    'review_flow.private_feedback_title': 'मालकाला खाजगी अभिप्राय पाठवा',
    'review_flow.private_feedback_desc': 'काही अडचण किंवा खाजगी सूचना आहे? थेट व्यवस्थापनाला पाठवा.',
    'review_flow.submit_private': 'खाजगी अभिप्राय सबमिट करा',
    'review_flow.private_success': 'धन्यवाद! तुमचा अभिप्राय थेट स्टोअर व्यवस्थापकाकडे पाठवला गेला आहे.',

    // Local Analytics
    'analytics.title': 'स्थानिक विश्लेषण',
    'analytics.subtitle': 'गुगल बिझनेस प्रोफाईल परफॉर्मन्स एपीआय द्वारे स्थानिक ग्राहक क्रियाकलाप.',
    'analytics.calls': 'फोन कॉल्स',
    'analytics.directions': 'दिशानिर्देश विनंत्या',
    'analytics.messages': 'संदेश',
    'analytics.discovery': 'ग्राहक शोध (Discovery)',
    'analytics.google_search': 'गुगल सर्च',
    'analytics.google_maps': 'गुगल मॅप्स',
    'analytics.direct_discovery': 'थेट शोध',
    'analytics.branded_searches': 'ब्रँडेड सर्च',

    // Google Connection Center
    'google_center.title': 'गुगल बिझनेस प्रोफाईल कनेक्शन',
    'google_center.subtitle': 'OAuth अधिकृतता, स्थान मॅपिंग आणि रिअल-टाइम क्लाउड पब/सब व्यवस्थापित करा.',
    'google_center.account': 'जोडलेले गुगल खाते',
    'google_center.location': 'निवडलेले स्थान',
    'google_center.realtime_pubsub': 'पब/सब रिअल-टाइम सिंक',
    'google_center.realtime_active': 'थेट वेबहुक सक्रिय',
    'google_center.realtime_unavailable': 'रिअल-टाइम गुगल अद्यतने तात्पुरती अनुपलब्ध आहेत. शेड्यूलरद्वारे सिंक केले गेले.'
  }
};

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  availableLanguages: LanguageOption[];
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  availableLanguages: LANGUAGES,
  t: (key, fallback) => fallback || key
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('localos_language');
    if (saved === 'hi' || saved === 'mr' || saved === 'en') {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('localos_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict && dict[key]) {
      return dict[key];
    }
    if (TRANSLATIONS.en && TRANSLATIONS.en[key]) {
      return TRANSLATIONS.en[key];
    }
    return fallback || key;
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        availableLanguages: LANGUAGES,
        t
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
