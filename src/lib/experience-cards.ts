export interface ExperienceCardConfig {
  id: string;
  icon?: string;
  title: string;
  placeholder: string;
  enabled?: boolean;
}

/**
 * Generates exactly 7 to 8 business-specific experience options based on:
 * - Category
 * - Subcategory
 * - Verified business facts / description
 * 
 * Rules:
 * - Target: exactly 8 options (minimum 7, maximum 8).
 * - Strictly business-specific.
 * - STRICTLY NO EMOJIS, NO ICONS, NO MARKETING CLAIMS.
 * - Simple Topic Names only.
 * - Always ends with "Something Else".
 */
export function generateExperienceCardsForBusiness(params: {
  category?: string;
  mainCategory?: string;
  subcategory?: string;
  description?: string;
  verifiedFacts?: Array<{ title?: string; key?: string; description?: string; value?: string; verified?: boolean }>;
}): ExperienceCardConfig[] {
  const cat = (params.mainCategory || params.category || 'other').toLowerCase();
  const sub = (params.subcategory || '').toLowerCase();
  const desc = (params.description || '').toLowerCase();

  const factsText = (params.verifiedFacts || [])
    .filter(f => f.verified !== false)
    .map(f => `${f.title || f.key || ''} ${f.description || f.value || ''}`)
    .join(' ')
    .toLowerCase();

  const combined = `${cat} ${sub} ${desc} ${factsText}`;

  // 1. PHOTOGRAPHY & VIDEOGRAPHY
  if (cat.includes('photo') || cat.includes('video') || combined.includes('photograph') || combined.includes('studio')) {
    return [
      { id: 'card_photo_exp', title: 'Photography Experience', placeholder: 'Tell us what you experienced during your photoshoot session...' },
      { id: 'card_wedding_shoot', title: 'Wedding Shoot', placeholder: 'Tell us about any wedding or event shoot experience...' },
      { id: 'card_studio_exp', title: 'Studio Experience', placeholder: 'Tell us about the studio space, lighting, and setup...' },
      { id: 'card_team_guidance', title: 'Team Guidance', placeholder: 'Tell us about the photographer’s communication and guidance...' },
      { id: 'card_photo_exp_res', title: 'Photo Experience', placeholder: 'Tell us what you liked about the photos and framing...' },
      { id: 'card_shoot_exp', title: 'Shoot Experience', placeholder: 'Tell us about the shoot experience, comfort, and direction...' },
      { id: 'card_service_exp', title: 'Service Experience', placeholder: 'Tell us about the service and delivery of your photos...' },
      { id: 'card_overall_exp', title: 'Overall Experience', placeholder: 'Tell us about your overall experience with our studio...' }
    ];
  }

  // 2. JEWELLERY & GOLD
  if (cat.includes('jewel') || combined.includes('jewel') || combined.includes('gold') || combined.includes('silver') || combined.includes('diamond')) {
    return [
      { id: 'card_collection_designs', title: 'Collection & Designs', placeholder: 'Tell us what you noticed about the jewellery designs and varieties...' },
      { id: 'card_jewellery_selection', title: 'Jewellery Selection', placeholder: 'Tell us about comparing and selecting your ornaments...' },
      { id: 'card_staff_assistance', title: 'Staff Assistance', placeholder: 'Tell us about the help and guidance you received from the counter staff...' },
      { id: 'card_shopping_exp', title: 'Shopping Experience', placeholder: 'Tell us about your visit and in-store purchase experience...' },
      { id: 'card_design_exp', title: 'Design Experience', placeholder: 'Tell us about the craftsmanship and design aesthetics...' },
      { id: 'card_product_exp', title: 'Product Experience', placeholder: 'Tell us about the ornament quality, finish, and hallmark...' },
      { id: 'card_buying_exp', title: 'Buying Experience', placeholder: 'Tell us about the selection, weighing, or billing experience...' },
      { id: 'card_overall_exp', title: 'Overall Experience', placeholder: 'Tell us about your overall experience with our showroom...' }
    ];
  }

  // 3. RESTAURANT, CAFE & FOOD
  if (cat.includes('restaurant') || cat.includes('cafe') || cat.includes('food') || combined.includes('dine') || combined.includes('food')) {
    return [
      { id: 'card_food_taste', title: 'Food & Taste', placeholder: 'Tell us about the dishes, flavors, and taste you experienced...' },
      { id: 'card_ambience', title: 'Ambience', placeholder: 'Tell us about the atmosphere, seating, and music...' },
      { id: 'card_service', title: 'Service', placeholder: 'Tell us about the hospitality and order service...' },
      { id: 'card_staff_exp', title: 'Staff Experience', placeholder: 'Tell us about the server attention and recommendations...' },
      { id: 'card_menu_variety', title: 'Menu & Variety', placeholder: 'Tell us about the menu choices and beverage options...' },
      { id: 'card_dining_exp', title: 'Dining Experience', placeholder: 'Tell us about your time dining with us...' },
      { id: 'card_value_money', title: 'Value for Money', placeholder: 'Tell us about portion sizes, pricing, and value...' },
      { id: 'card_overall_exp', title: 'Overall Experience', placeholder: 'Tell us about your overall experience visiting us...' }
    ];
  }

  // 4. SALON & BEAUTY
  if (cat.includes('salon') || cat.includes('beauty') || cat.includes('spa') || combined.includes('hair') || combined.includes('makeup')) {
    return [
      { id: 'card_hair_service', title: 'Hair Service', placeholder: 'Tell us about your haircut, treatment, or hair care session...' },
      { id: 'card_styling_exp', title: 'Styling Experience', placeholder: 'Tell us how your styling or grooming was handled...' },
      { id: 'card_beauty_service', title: 'Beauty Service', placeholder: 'Tell us about your skincare, facial, or beauty appointment...' },
      { id: 'card_staff_assistance', title: 'Staff Assistance', placeholder: 'Tell us about the stylist attention and consultation...' },
      { id: 'card_service_exp', title: 'Service Experience', placeholder: 'Tell us about the hygiene, care, and service quality...' },
      { id: 'card_appointment_exp', title: 'Appointment Experience', placeholder: 'Tell us about scheduling and seating comfort...' },
      { id: 'card_overall_exp', title: 'Overall Experience', placeholder: 'Tell us about your overall experience at our salon...' },
      { id: 'card_something_else', title: 'Something Else', placeholder: 'Write a few words about what you personally experienced...' }
    ];
  }

  // 5. GARAGE & AUTOMOTIVE
  if (cat.includes('garage') || cat.includes('auto') || cat.includes('repair') || combined.includes('mechanic') || combined.includes('vehicle') || combined.includes('bike') || combined.includes('car')) {
    return [
      { id: 'card_service_exp', title: 'Service Experience', placeholder: 'Tell us about your vehicle servicing and maintenance...' },
      { id: 'card_repair_exp', title: 'Repair Experience', placeholder: 'Tell us about the repairs or troubleshooting done on your vehicle...' },
      { id: 'card_vehicle_handling', title: 'Vehicle Handling', placeholder: 'Tell us how carefully your car or bike was handled...' },
      { id: 'card_staff_assistance', title: 'Staff Assistance', placeholder: 'Tell us about the mechanic guidance and advisor discussion...' },
      { id: 'card_communication', title: 'Communication', placeholder: 'Tell us about the inspection updates and clear explanations...' },
      { id: 'card_service_process', title: 'Service Process', placeholder: 'Tell us about the handover, inspection, and delivery process...' },
      { id: 'card_overall_exp', title: 'Overall Experience', placeholder: 'Tell us about your overall service experience...' },
      { id: 'card_something_else', title: 'Something Else', placeholder: 'Write a few words about what you personally experienced...' }
    ];
  }

  // 6. CLOTHING & FASHION
  if (cat.includes('cloth') || cat.includes('fashion') || combined.includes('apparel') || combined.includes('garment')) {
    return [
      { id: 'card_collection_designs', title: 'Collection & Designs', placeholder: 'Tell us about the clothing styles and variety you browsed...' },
      { id: 'card_fitting_styling', title: 'Fitting & Sizing', placeholder: 'Tell us about the fit, sizes, and trial comfort...' },
      { id: 'card_staff_assistance', title: 'Staff Assistance', placeholder: 'Tell us about the staff helping you find outfits...' },
      { id: 'card_shopping_exp', title: 'Shopping Experience', placeholder: 'Tell us about browsing and shopping in the store...' },
      { id: 'card_fabric_exp', title: 'Fabric & Quality', placeholder: 'Tell us what you liked about the material and stitching...' },
      { id: 'card_billing_checkout', title: 'Checkout Experience', placeholder: 'Tell us about the counter and packing service...' },
      { id: 'card_overall_exp', title: 'Overall Experience', placeholder: 'Tell us about your overall store visit...' },
      { id: 'card_something_else', title: 'Something Else', placeholder: 'Write a few words about what you personally experienced...' }
    ];
  }

  // 7. HEALTHCARE & DENTAL
  if (cat.includes('health') || cat.includes('dental') || cat.includes('clinic') || combined.includes('doctor') || combined.includes('medical')) {
    return [
      { id: 'card_consultation_exp', title: 'Consultation Experience', placeholder: 'Tell us about doctor discussion and diagnosis...' },
      { id: 'card_treatment_care', title: 'Treatment Care', placeholder: 'Tell us about your procedure or clinical care...' },
      { id: 'card_staff_assistance', title: 'Staff Assistance', placeholder: 'Tell us about the clinic staff and reception support...' },
      { id: 'card_hygiene_comfort', title: 'Hygiene & Cleanliness', placeholder: 'Tell us about the clinic environment and cleanliness...' },
      { id: 'card_communication', title: 'Clear Guidance', placeholder: 'Tell us how well the advice or instructions were explained...' },
      { id: 'card_appointment_process', title: 'Appointment Process', placeholder: 'Tell us about the wait time and scheduling...' },
      { id: 'card_overall_exp', title: 'Overall Experience', placeholder: 'Tell us about your overall visit to our clinic...' },
      { id: 'card_something_else', title: 'Something Else', placeholder: 'Write a few words about what you personally experienced...' }
    ];
  }

  // 8. FITNESS & GYM
  if (cat.includes('fit') || cat.includes('gym') || combined.includes('workout') || combined.includes('trainer')) {
    return [
      { id: 'card_workout_exp', title: 'Workout Experience', placeholder: 'Tell us about your training session or workout routine...' },
      { id: 'card_trainer_guidance', title: 'Trainer Guidance', placeholder: 'Tell us about the trainer support and form corrections...' },
      { id: 'card_equipment_exp', title: 'Equipment & Space', placeholder: 'Tell us about the workout machines, weights, and space...' },
      { id: 'card_gym_ambience', title: 'Gym Atmosphere', placeholder: 'Tell us about the energy, music, and environment...' },
      { id: 'card_cleanliness', title: 'Cleanliness & Hygiene', placeholder: 'Tell us about locker room and floor cleanliness...' },
      { id: 'card_staff_support', title: 'Staff Support', placeholder: 'Tell us about front desk and team support...' },
      { id: 'card_overall_exp', title: 'Overall Experience', placeholder: 'Tell us about your fitness experience with us...' },
      { id: 'card_something_else', title: 'Something Else', placeholder: 'Write a few words about what you personally experienced...' }
    ];
  }

  // 9. GENERAL / OTHER BUSINESSES
  return [
    { id: 'card_service_exp', title: 'Service Experience', placeholder: 'Tell us about the primary service you received...' },
    { id: 'card_staff_assistance', title: 'Staff Assistance', placeholder: 'Tell us about the help and attention given by the team...' },
    { id: 'card_product_selection', title: 'Product Selection', placeholder: 'Tell us about the options and variety offered...' },
    { id: 'card_communication', title: 'Communication', placeholder: 'Tell us about the clarity, updates, and explanations...' },
    { id: 'card_visit_experience', title: 'Visit Experience', placeholder: 'Tell us about your in-person visit or engagement...' },
    { id: 'card_service_process', title: 'Service Process', placeholder: 'Tell us how smoothly the process was handled...' },
    { id: 'card_overall_exp', title: 'Overall Experience', placeholder: 'Tell us about your overall experience with our business...' },
    { id: 'card_something_else', title: 'Something Else', placeholder: 'Write a few words about what you personally experienced...' }
  ];
}

export interface BusinessCategoryTemplate {
  subcategories: string[];
  defaultTopics: string[];
}

export const BUSINESS_CATEGORY_TEMPLATES: Record<string, BusinessCategoryTemplate> = {
  Photography: {
    subcategories: [
      'Wedding Photographer',
      'Pre-Wedding Photographer',
      'Portrait Photographer',
      'Event Photographer',
      'Photography Studio',
      'Commercial Photographer',
      'Videographer',
      'Wedding Videographer',
      'Other'
    ],
    defaultTopics: [
      'Photography Experience',
      'Wedding Shoot',
      'Studio Experience',
      'Team Guidance',
      'Photo Experience',
      'Shoot Experience',
      'Overall Experience',
      'Something Else'
    ]
  },
  Videography: {
    subcategories: [
      'Wedding Videographer',
      'Cinematic Films',
      'Corporate Videography',
      'Event Videography',
      'Drone Videography',
      'Other'
    ],
    defaultTopics: [
      'Video Quality',
      'Shoot Experience',
      'Team Guidance',
      'Direction & Guidance',
      'Cinematic Coverage',
      'Editing & Output',
      'Overall Experience',
      'Something Else'
    ]
  },
  Jewellery: {
    subcategories: [
      'Gold Jewellery',
      'Silver Jewellery',
      'Diamond Jewellery',
      'Bridal Jewellery',
      'Traditional Jewellery',
      'Fashion Jewellery',
      'Custom Jewellery',
      'Other'
    ],
    defaultTopics: [
      'Collection & Designs',
      'Jewellery Selection',
      'Staff Assistance',
      'Shopping Experience',
      'Design Experience',
      'Buying Experience',
      'Overall Experience',
      'Something Else'
    ]
  },
  Restaurant: {
    subcategories: [
      'Fine Dining',
      'Family Restaurant',
      'Fast Food',
      'Pure Veg',
      'Multi-Cuisine',
      'Dhaba',
      'Bistro',
      'Other'
    ],
    defaultTopics: [
      'Food Experience',
      'Dining Experience',
      'Service',
      'Ambience',
      'Menu Experience',
      'Staff Assistance',
      'Overall Experience',
      'Something Else'
    ]
  },
  Cafe: {
    subcategories: [
      'Coffee House',
      'Bakery Cafe',
      'Breakfast Cafe',
      'Art Cafe',
      'Rooftop Cafe',
      'Tea Lounge',
      'Other'
    ],
    defaultTopics: [
      'Beverage Taste',
      'Coffee & Drinks',
      'Food & Snacks',
      'Ambience & Vibe',
      'Seating Comfort',
      'Staff Assistance',
      'Overall Experience',
      'Something Else'
    ]
  },
  Salon: {
    subcategories: [
      'Hair Salon',
      'Unisex Salon',
      'Men\'s Grooming',
      'Bridal Salon',
      'Spa & Wellness',
      'Nail Studio',
      'Other'
    ],
    defaultTopics: [
      'Hair Service',
      'Styling Experience',
      'Beauty Service',
      'Staff Assistance',
      'Service Experience',
      'Appointment Experience',
      'Overall Experience',
      'Something Else'
    ]
  },
  Beauty: {
    subcategories: [
      'Makeup Studio',
      'Skin Care Clinic',
      'Bridal Studio',
      'Lashes & Brows',
      'Aesthetic Studio',
      'Other'
    ],
    defaultTopics: [
      'Treatment Care',
      'Skin Treatment',
      'Makeup Experience',
      'Hygiene & Comfort',
      'Staff Guidance',
      'Product Quality',
      'Overall Experience',
      'Something Else'
    ]
  },
  Garage: {
    subcategories: [
      'Car Service',
      'Bike Service',
      'Multi-Brand Garage',
      'Car Repair',
      'Bike Repair',
      'Detailing',
      'Tyre Service',
      'Auto Electrical',
      'Other'
    ],
    defaultTopics: [
      'Service Experience',
      'Repair Experience',
      'Vehicle Handling',
      'Staff Assistance',
      'Communication',
      'Service Process',
      'Overall Experience',
      'Something Else'
    ]
  },
  Automotive: {
    subcategories: [
      'Car Dealership',
      'Used Car Sales',
      'Car Accessories',
      'Auto Spare Parts',
      'Washing & Detailing',
      'Other'
    ],
    defaultTopics: [
      'Vehicle Selection',
      'Showroom Experience',
      'Staff Guidance',
      'Pricing & Value',
      'Service Process',
      'Customer Care',
      'Overall Experience',
      'Something Else'
    ]
  },
  Clothing: {
    subcategories: [
      'Men\'s Wear',
      'Women\'s Wear',
      'Bridal & Ethnic',
      'Boutique',
      'Kids Wear',
      'Custom Tailoring',
      'Other'
    ],
    defaultTopics: [
      'Fabric & Fitting',
      'Collection & Variety',
      'Trial Experience',
      'Staff Assistance',
      'Design Quality',
      'Purchase Experience',
      'Overall Experience',
      'Something Else'
    ]
  },
  Fashion: {
    subcategories: [
      'Designer Wear',
      'Accessories & Footwear',
      'Handbags & Leather',
      'Seasonal Fashion',
      'Other'
    ],
    defaultTopics: [
      'Trendy Collection',
      'Product Quality',
      'Shopping Ambience',
      'Staff Assistance',
      'Selection Variety',
      'Buying Experience',
      'Overall Experience',
      'Something Else'
    ]
  },
  Electronics: {
    subcategories: [
      'Home Appliances',
      'TV & Audio',
      'Laptops & Computers',
      'Smart Gadgets',
      'Electronic Repair',
      'Other'
    ],
    defaultTopics: [
      'Product Demo',
      'Staff Knowledge',
      'Device Selection',
      'Pricing & Warranty',
      'Installation Support',
      'Billing Process',
      'Overall Experience',
      'Something Else'
    ]
  },
  Mobile: {
    subcategories: [
      'Smartphones & Accessories',
      'Mobile Repair',
      'Screen Replacement',
      'Exchange & Buyback',
      'Other'
    ],
    defaultTopics: [
      'Phone Selection',
      'Demo Explanation',
      'Repair Quality',
      'Staff Assistance',
      'Accessories Variety',
      'Quick Billing',
      'Overall Experience',
      'Something Else'
    ]
  },
  Grocery: {
    subcategories: [
      'Supermarket',
      'Organic Grocery',
      'Kirana Store',
      'Fruits & Vegetables',
      'Dairy & Bakery',
      'Other'
    ],
    defaultTopics: [
      'Fresh Quality',
      'Item Variety',
      'Clean Store',
      'Staff Support',
      'Quick Checkout',
      'Billing Accuracy',
      'Overall Experience',
      'Something Else'
    ]
  },
  Hotel: {
    subcategories: [
      'Boutique Hotel',
      'Resort',
      'Budget Hotel',
      'Homestay',
      'Business Hotel',
      'Other'
    ],
    defaultTopics: [
      'Room Cleanliness',
      'Check-in Process',
      'Staff Hospitality',
      'Dining & Breakfast',
      'Amenities & Comfort',
      'Stay Experience',
      'Overall Experience',
      'Something Else'
    ]
  },
  'Real Estate': {
    subcategories: [
      'Residential Sales',
      'Commercial Property',
      'Rental Agency',
      'Plot / Land Advisory',
      'Interior Projects',
      'Other'
    ],
    defaultTopics: [
      'Property Guidance',
      'Site Visit Experience',
      'Agent Communication',
      'Transparency',
      'Documentation Process',
      'Customer Support',
      'Overall Experience',
      'Something Else'
    ]
  },
  Education: {
    subcategories: [
      'Coaching Institute',
      'Skill Academy',
      'Language School',
      'Music / Arts Classes',
      'Preschool / Daycare',
      'Other'
    ],
    defaultTopics: [
      'Teaching Quality',
      'Faculty Guidance',
      'Course Material',
      'Learning Atmosphere',
      'Student Support',
      'Session Clarity',
      'Overall Experience',
      'Something Else'
    ]
  },
  Fitness: {
    subcategories: [
      'Gym & Cardio',
      'CrossFit',
      'Yoga & Pilates',
      'Personal Training',
      'Zumba & Dance',
      'Other'
    ],
    defaultTopics: [
      'Workout Experience',
      'Trainer Guidance',
      'Equipment & Space',
      'Gym Atmosphere',
      'Cleanliness & Hygiene',
      'Staff Support',
      'Overall Experience',
      'Something Else'
    ]
  },
  Healthcare: {
    subcategories: [
      'General Physician',
      'Specialty Clinic',
      'Diagnostic Lab',
      'Physiotherapy',
      'Eye Care',
      'Other'
    ],
    defaultTopics: [
      'Consultation Experience',
      'Doctor Attention',
      'Staff Assistance',
      'Hygiene & Cleanliness',
      'Diagnosis Guidance',
      'Appointment Process',
      'Overall Experience',
      'Something Else'
    ]
  },
  Dental: {
    subcategories: [
      'General Dentistry',
      'Orthodontics',
      'Root Canal & Surgery',
      'Teeth Whitening',
      'Pediatric Dental',
      'Other'
    ],
    defaultTopics: [
      'Consultation Experience',
      'Treatment Care',
      'Doctor Guidance',
      'Hygiene & Cleanliness',
      'Painless Procedure',
      'Staff Assistance',
      'Overall Experience',
      'Something Else'
    ]
  },
  Finance: {
    subcategories: [
      'Chartered Accountant',
      'Tax Consulting',
      'Insurance Advisor',
      'Mutual Funds / Wealth',
      'Loan Advisory',
      'Other'
    ],
    defaultTopics: [
      'Consultation Advice',
      'Process Clarity',
      'Tax Planning',
      'Communication',
      'Turnaround Time',
      'Professional Guidance',
      'Overall Experience',
      'Something Else'
    ]
  },
  Travel: {
    subcategories: [
      'Tour Packages',
      'Visa Assistance',
      'Flight & Hotel Bookings',
      'Custom Itineraries',
      'Other'
    ],
    defaultTopics: [
      'Trip Planning',
      'Package Value',
      'Booking Support',
      'Communication',
      'Coordination Quality',
      'Customer Care',
      'Overall Experience',
      'Something Else'
    ]
  },
  Furniture: {
    subcategories: [
      'Home Furniture',
      'Office Furniture',
      'Custom Woodwork',
      'Mattress & Sofa',
      'Other'
    ],
    defaultTopics: [
      'Wood & Build Quality',
      'Design Selection',
      'Store Assistance',
      'Finishing & Craft',
      'Delivery & Setup',
      'Pricing Value',
      'Overall Experience',
      'Something Else'
    ]
  },
  Hardware: {
    subcategories: [
      'Paints & Tools',
      'Sanitary & Plumbing',
      'Construction Material',
      'Locks & Fixtures',
      'Other'
    ],
    defaultTopics: [
      'Product Availability',
      'Quality of Items',
      'Counter Support',
      'Price Transparency',
      'Quick Billing',
      'Genuine Stock',
      'Overall Experience',
      'Something Else'
    ]
  },
  Electrical: {
    subcategories: [
      'Wiring & Switches',
      'Lighting & Fans',
      'Inverters & Batteries',
      'Industrial Supplies',
      'Other'
    ],
    defaultTopics: [
      'Product Selection',
      'Technical Guidance',
      'Authentic Brands',
      'Fair Pricing',
      'Quick Service',
      'Staff Support',
      'Overall Experience',
      'Something Else'
    ]
  },
  'Professional Services': {
    subcategories: [
      'Legal Services',
      'Architecture & Design',
      'Digital Marketing',
      'Consulting',
      'Other'
    ],
    defaultTopics: [
      'Project Guidance',
      'Communication',
      'Quality of Work',
      'Timely Delivery',
      'Professional Approach',
      'Attention to Detail',
      'Overall Experience',
      'Something Else'
    ]
  },
  'Repair Services': {
    subcategories: [
      'Appliance Repair',
      'AC Service & Repair',
      'Plumbing & Electrician',
      'Carpentry',
      'Other'
    ],
    defaultTopics: [
      'Service Experience',
      'Problem Diagnosis',
      'Timely Arrival',
      'Technician Skill',
      'Transparent Billing',
      'Work Quality',
      'Overall Experience',
      'Something Else'
    ]
  },
  Other: {
    subcategories: [
      'General Service',
      'Retail Shop',
      'Trade Contractor',
      'Other'
    ],
    defaultTopics: [
      'Service Experience',
      'Staff Assistance',
      'Product Selection',
      'Communication',
      'Visit Experience',
      'Service Process',
      'Overall Experience',
      'Something Else'
    ]
  }
};
