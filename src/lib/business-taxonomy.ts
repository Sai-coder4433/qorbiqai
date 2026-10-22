/**
 * REVIEWFLOW AI — 34 MAIN BUSINESS CATEGORIES & DYNAMIC SUBCATEGORIES
 * Hard contextual constraint for the AI Analysis & Review Grounding Engine
 */

export interface SubCategoryItem {
  id: string;
  label: string;
}

export interface MainCategoryItem {
  id: string;
  label: string;
  description: string;
  subcategories: SubCategoryItem[];
}

export const MAIN_CATEGORIES: MainCategoryItem[] = [
  {
    id: 'jewellery_gold',
    label: 'Jewellery & Gold',
    description: 'Gold, silver, diamond, bridal & fashion ornaments',
    subcategories: [
      { id: 'gold_jewellery', label: 'Gold Jewellery' },
      { id: 'silver_jewellery', label: 'Silver Jewellery' },
      { id: 'diamond_jewellery', label: 'Diamond Jewellery' },
      { id: 'bridal_jewellery', label: 'Bridal Jewellery' },
      { id: 'traditional_jewellery', label: 'Traditional Jewellery' },
      { id: 'fashion_jewellery', label: 'Fashion & Imitation Jewellery' },
      { id: 'custom_jewellery', label: 'Custom & 3D Designed Jewellery' },
      { id: 'multi_brand_jeweller', label: 'Multi-Brand Showroom' },
      { id: 'other', label: 'Other Jewellery Specialty' }
    ]
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    description: 'Dine-in, family, regional & fine dining dining outlets',
    subcategories: [
      { id: 'maharashtrian_restaurant', label: 'Maharashtrian Restaurant' },
      { id: 'north_indian', label: 'North Indian Restaurant' },
      { id: 'south_indian', label: 'South Indian Restaurant' },
      { id: 'chinese', label: 'Chinese & Pan-Asian' },
      { id: 'fast_food', label: 'Fast Food & Snacks' },
      { id: 'family_restaurant', label: 'Family Dining Restaurant' },
      { id: 'fine_dining', label: 'Fine Dining' },
      { id: 'pure_veg', label: 'Pure Vegetarian Restaurant' },
      { id: 'non_veg', label: 'Multi-Cuisine & Non-Veg' },
      { id: 'biryani_tandoor', label: 'Biryani & Tandoor Specialty' },
      { id: 'other', label: 'Other Restaurant Concept' }
    ]
  },
  {
    id: 'cafe',
    label: 'Cafe',
    description: 'Coffee shops, artisanal tea lounges & casual hangouts',
    subcategories: [
      { id: 'coffee_shop', label: 'Specialty Coffee Shop' },
      { id: 'tea_lounge', label: 'Artisanal Chai & Tea Lounge' },
      { id: 'bistro_cafe', label: 'Bistro & Continental Cafe' },
      { id: 'dessert_cafe', label: 'Dessert & Waffle Cafe' },
      { id: 'quick_service_cafe', label: 'Quick Service Cafe & Kiosk' },
      { id: 'other', label: 'Other Cafe' }
    ]
  },
  {
    id: 'bakery',
    label: 'Bakery & Confectionery',
    description: 'Fresh bread, cakes, pastries & baked goods',
    subcategories: [
      { id: 'cake_shop', label: 'Custom Cake Shop' },
      { id: 'artisan_bakery', label: 'Artisanal Bread & Bakery' },
      { id: 'pastry_shop', label: 'Pastry & Dessert Studio' },
      { id: 'traditional_bakery', label: 'Traditional Bakery & Cookies' },
      { id: 'other', label: 'Other Bakery' }
    ]
  },
  {
    id: 'hotel_hospitality',
    label: 'Hotel & Hospitality',
    description: 'Hotels, resorts, homestays, lodges & banquet venues',
    subcategories: [
      { id: 'business_hotel', label: 'Business Hotel' },
      { id: 'resort', label: 'Resort & Weekend Stay' },
      { id: 'homestay_bnb', label: 'Homestay & Bed & Breakfast' },
      { id: 'banquet_hall', label: 'Banquet & Marriage Hall' },
      { id: 'budget_lodge', label: 'Budget Hotel & Lodge' },
      { id: 'other', label: 'Other Hospitality' }
    ]
  },
  {
    id: 'salon_beauty',
    label: 'Salon & Beauty',
    description: 'Haircuts, hair styling, skin treatments & makeup',
    subcategories: [
      { id: 'unisex_salon', label: 'Unisex Salon' },
      { id: 'mens_salon', label: "Men's Salon & Barbershop" },
      { id: 'womens_salon', label: "Women's Beauty Parlour" },
      { id: 'hair_salon', label: 'Hair Studio & Keratin Care' },
      { id: 'makeup_studio', label: 'Makeup Studio & Artistry' },
      { id: 'bridal_makeup', label: 'Bridal Makeover Studio' },
      { id: 'nail_art_studio', label: 'Nail Art & Eyelash Studio' },
      { id: 'other', label: 'Other Salon' }
    ]
  },
  {
    id: 'spa_wellness',
    label: 'Spa & Wellness',
    description: 'Therapeutic massages, wellness centers & Ayurvedic spas',
    subcategories: [
      { id: 'day_spa', label: 'Day Spa & Relaxation' },
      { id: 'ayurvedic_spa', label: 'Ayurvedic Treatment & Panchakarma' },
      { id: 'massage_therapy', label: 'Therapeutic Massage Center' },
      { id: 'wellness_retreat', label: 'Holistic Wellness Studio' },
      { id: 'other', label: 'Other Spa' }
    ]
  },
  {
    id: 'photography_videography',
    label: 'Photography & Videography',
    description: 'Weddings, portraits, commercial shoots, camera studio',
    subcategories: [
      { id: 'wedding_photographer', label: 'Wedding Photographer' },
      { id: 'pre_wedding_photographer', label: 'Pre-Wedding Photographer' },
      { id: 'portrait_photographer', label: 'Portrait & Family Photographer' },
      { id: 'event_photographer', label: 'Event & Corporate Photographer' },
      { id: 'product_photographer', label: 'Product & E-Commerce Photographer' },
      { id: 'commercial_photographer', label: 'Commercial & Fashion Photographer' },
      { id: 'videographer', label: 'Videographer & Cinematographer' },
      { id: 'wedding_videographer', label: 'Wedding Videographer' },
      { id: 'photography_studio', label: 'Indoor Photography Studio' },
      { id: 'photo_video_studio', label: 'Photo & Video Production Studio' },
      { id: 'other', label: 'Other Photography Service' }
    ]
  },
  {
    id: 'garage_auto',
    label: 'Garage & Auto Service',
    description: 'Car & 2-wheeler repair, servicing, detailing & maintenance',
    subcategories: [
      { id: 'car_service', label: 'Car Service Center' },
      { id: 'bike_service', label: 'Two-Wheeler & Bike Service' },
      { id: 'multi_brand_garage', label: 'Multi-Brand Car Garage' },
      { id: 'authorized_service', label: 'Authorized Brand Service Center' },
      { id: 'car_repair', label: 'Mechanical Car Repair & Engine' },
      { id: 'bike_repair', label: 'Bike Repair & Tuning' },
      { id: 'auto_detailing', label: 'Car Detailing & Ceramic Coating' },
      { id: 'tyre_service', label: 'Tyre, Wheel Alignment & Balancing' },
      { id: 'auto_electrical', label: 'Auto Electrical & AC Repair' },
      { id: 'other', label: 'Other Automotive Service' }
    ]
  },
  {
    id: 'clothing_fashion',
    label: 'Clothing & Fashion',
    description: 'Apparel, ethnic wear, bridal collections & boutiques',
    subcategories: [
      { id: 'mens_wear', label: "Men's Wear & Suitings" },
      { id: 'womens_wear', label: "Women's Ethnic & Western Wear" },
      { id: 'bridal_trousseau', label: 'Bridal Lehengas & Sarees' },
      { id: 'designer_boutique', label: 'Designer Fashion Boutique' },
      { id: 'kids_wear', label: "Kids & Children's Clothing" },
      { id: 'custom_tailoring', label: 'Bespoke Tailoring & Alterations' },
      { id: 'other', label: 'Other Clothing' }
    ]
  },
  {
    id: 'footwear',
    label: 'Footwear',
    description: 'Shoes, sandals, formal, sports & ethnic footwear',
    subcategories: [
      { id: 'multi_brand_footwear', label: 'Multi-Brand Family Footwear' },
      { id: 'sports_sneakers', label: 'Sports Shoes & Sneakers' },
      { id: 'leather_formal', label: 'Formal Leather Shoes' },
      { id: 'womens_footwear', label: "Women's Heels & Ethnic Footwear" },
      { id: 'other', label: 'Other Footwear' }
    ]
  },
  {
    id: 'electronics',
    label: 'Electronics',
    description: 'Home appliances, smart TVs, sound systems & laptops',
    subcategories: [
      { id: 'consumer_electronics', label: 'Home Appliances & TVs' },
      { id: 'laptop_computers', label: 'Laptops, PCs & Peripherals' },
      { id: 'audio_sound', label: 'Sound Systems & Audio Gear' },
      { id: 'kitchen_appliances', label: 'Kitchen & Home Gadgets' },
      { id: 'other', label: 'Other Electronics' }
    ]
  },
  {
    id: 'mobile_accessories',
    label: 'Mobile & Accessories',
    description: 'Smartphones, mobile repair, covers & gadgets',
    subcategories: [
      { id: 'smartphones_sales', label: 'Smartphone Sales' },
      { id: 'mobile_repair', label: 'Mobile Screen & Hardware Repair' },
      { id: 'mobile_accessories_store', label: 'Cases, Chargers & Audio Accessories' },
      { id: 'pre_owned_phones', label: 'Refurbished & Pre-Owned Phones' },
      { id: 'other', label: 'Other Mobile Service' }
    ]
  },
  {
    id: 'furniture_home',
    label: 'Furniture & Home',
    description: 'Sofas, beds, modular kitchens & home furnishing',
    subcategories: [
      { id: 'living_bedroom_furniture', label: 'Living & Bedroom Furniture' },
      { id: 'modular_kitchen', label: 'Modular Kitchens & Wardrobes' },
      { id: 'office_furniture', label: 'Office & Ergonomic Furniture' },
      { id: 'home_decor', label: 'Curtains, Mattresses & Home Decor' },
      { id: 'custom_woodwork', label: 'Custom Carpentry & Woodcraft' },
      { id: 'other', label: 'Other Furniture' }
    ]
  },
  {
    id: 'grocery_supermarket',
    label: 'Grocery & Supermarket',
    description: 'Provisions, daily essentials, organic food & supermarkets',
    subcategories: [
      { id: 'supermarket', label: 'Supermarket & Mart' },
      { id: 'provisions_kirana', label: 'Provisions & Kirana Store' },
      { id: 'organic_grocery', label: 'Organic & Health Food Store' },
      { id: 'dry_fruits_spices', label: 'Dry Fruits, Nuts & Gourmet Spices' },
      { id: 'other', label: 'Other Grocery' }
    ]
  },
  {
    id: 'medical_pharmacy',
    label: 'Medical & Pharmacy',
    description: 'Chemist, prescription medicines & health supplements',
    subcategories: [
      { id: 'retail_pharmacy', label: 'Retail Chemist & Pharmacy' },
      { id: 'ayurvedic_pharmacy', label: 'Ayurvedic Medicine Store' },
      { id: 'surgical_supplies', label: 'Surgical & Medical Equipment' },
      { id: 'other', label: 'Other Pharmacy' }
    ]
  },
  {
    id: 'dental_healthcare',
    label: 'Dental & Healthcare',
    description: 'Dental clinics, polyclinics, diagnostic labs & therapy',
    subcategories: [
      { id: 'dental_clinic', label: 'Dental Clinic & Orthodontics' },
      { id: 'polyclinic_consultation', label: "Doctor's Polyclinic" },
      { id: 'diagnostic_lab', label: 'Pathology & Diagnostic Laboratory' },
      { id: 'physiotherapy', label: 'Physiotherapy & Rehabilitation' },
      { id: 'eye_clinic', label: 'Eye Care & Optical Clinic' },
      { id: 'other', label: 'Other Healthcare' }
    ]
  },
  {
    id: 'fitness_gym',
    label: 'Fitness & Gym',
    description: 'Fitness centers, weight training, yoga & crossfit studios',
    subcategories: [
      { id: 'gym_fitness_center', label: 'Gym & Strength Training' },
      { id: 'crossfit_functional', label: 'CrossFit & Functional Training' },
      { id: 'yoga_pilates', label: 'Yoga & Pilates Studio' },
      { id: 'martial_arts_boxing', label: 'Martial Arts & Self Defense' },
      { id: 'personal_training', label: 'Personal Fitness Coaching' },
      { id: 'other', label: 'Other Fitness' }
    ]
  },
  {
    id: 'real_estate',
    label: 'Real Estate',
    description: 'Property consultancy, rentals, commercial & residential brokerage',
    subcategories: [
      { id: 'residential_brokerage', label: 'Residential Buying & Selling' },
      { id: 'rental_services', label: 'Rental & Leasing Agency' },
      { id: 'commercial_property', label: 'Commercial Real Estate' },
      { id: 'plots_land', label: 'Plots & Farmhouse Land' },
      { id: 'other', label: 'Other Real Estate' }
    ]
  },
  {
    id: 'education_coaching',
    label: 'Education & Coaching',
    description: 'Tuition classes, competitive exams, language & skill academies',
    subcategories: [
      { id: 'school_tuition', label: 'School & College Coaching' },
      { id: 'competitive_exams', label: 'Competitive Exam Prep (JEE/NEET/UPSC)' },
      { id: 'language_institute', label: 'Foreign Language & Spoken English' },
      { id: 'music_dance_academy', label: 'Music, Dance & Fine Arts' },
      { id: 'it_coding_skills', label: 'IT, Coding & Digital Skills' },
      { id: 'other', label: 'Other Coaching' }
    ]
  },
  {
    id: 'travel_tourism',
    label: 'Travel & Tourism',
    description: 'Tour operators, visa consultancy, cab rentals & holiday packages',
    subcategories: [
      { id: 'holiday_packages', label: 'Domestic & International Tours' },
      { id: 'car_rental_tours', label: 'Car Rental & Outstation Cabs' },
      { id: 'ticketing_visa', label: 'Air Ticketing & Visa Assistance' },
      { id: 'pilgrimage_tours', label: 'Pilgrimage & Heritage Tours' },
      { id: 'other', label: 'Other Travel' }
    ]
  },
  {
    id: 'finance_insurance',
    label: 'Finance & Insurance',
    description: 'Tax consultancy, chartered accountant, loans & insurance brokerage',
    subcategories: [
      { id: 'chartered_accountant', label: 'Taxation & CA Services' },
      { id: 'loan_consultancy', label: 'Home, Personal & Business Loans' },
      { id: 'insurance_advisory', label: 'Life & General Insurance' },
      { id: 'wealth_investment', label: 'Mutual Funds & Wealth Advisory' },
      { id: 'other', label: 'Other Financial Service' }
    ]
  },
  {
    id: 'hardware_electrical',
    label: 'Hardware & Electrical',
    description: 'Paints, sanitary, electrical fixtures, tools & plumbing supplies',
    subcategories: [
      { id: 'electrical_lighting', label: 'Electrical Fittings & LED Lighting' },
      { id: 'paints_coatings', label: 'Paints, Wall Finishes & Waterproofing' },
      { id: 'sanitary_plumbing', label: 'Sanitaryware, Bath & Plumbing' },
      { id: 'tools_hardware', label: 'Industrial Tools & Fasteners' },
      { id: 'other', label: 'Other Hardware' }
    ]
  },
  {
    id: 'construction_interior',
    label: 'Construction & Interior',
    description: 'Interior design, architects, civil renovation & modular work',
    subcategories: [
      { id: 'interior_designer', label: 'Residential Interior Designer' },
      { id: 'commercial_interiors', label: 'Office & Retail Interiors' },
      { id: 'architectural_services', label: 'Architect & Building Plans' },
      { id: 'civil_renovation', label: 'Home Renovation & Remodeling' },
      { id: 'modular_fabrication', label: 'Aluminium & Glass Fabrication' },
      { id: 'other', label: 'Other Interior/Construction' }
    ]
  },
  {
    id: 'professional_services',
    label: 'Professional Services',
    description: 'Legal, business consultants, marketing agencies & notary',
    subcategories: [
      { id: 'legal_advocate', label: 'Advocate & Legal Advisory' },
      { id: 'business_consulting', label: 'Business & Management Consulting' },
      { id: 'digital_marketing', label: 'Digital Marketing & Web Agency' },
      { id: 'notary_registration', label: 'Document Registration & Notary' },
      { id: 'recruitment_hr', label: 'Staffing & HR Solutions' },
      { id: 'other', label: 'Other Professional Service' }
    ]
  },
  {
    id: 'repair_maintenance',
    label: 'Repair & Maintenance',
    description: 'AC service, appliance repair, plumbing, electrical & home repair',
    subcategories: [
      { id: 'ac_refrigeration', label: 'AC Installation & Repair' },
      { id: 'home_appliance_repair', label: 'Washing Machine, Fridge, Microwave Repair' },
      { id: 'electrician_plumber', label: 'Home Electrician & Plumber Services' },
      { id: 'water_purifier_ro', label: 'RO & Water Purifier Service' },
      { id: 'other', label: 'Other Repair' }
    ]
  },
  {
    id: 'printing_stationery',
    label: 'Printing & Stationery',
    description: 'Digital printing, visiting cards, banners, office supplies',
    subcategories: [
      { id: 'commercial_printing', label: 'Brochures, Cards & Banners' },
      { id: 'custom_gifting_print', label: 'Custom Mugs, T-shirts & Gifting' },
      { id: 'office_stationery', label: 'Office & Student Stationery Store' },
      { id: 'other', label: 'Other Printing' }
    ]
  },
  {
    id: 'pet_services',
    label: 'Pet Services',
    description: 'Veterinary clinics, pet grooming, pet stores & boarding',
    subcategories: [
      { id: 'veterinary_clinic', label: 'Veterinary Clinic & Pet Doctor' },
      { id: 'pet_grooming', label: 'Pet Grooming & Spa' },
      { id: 'pet_supplies_food', label: 'Pet Food & Accessories Store' },
      { id: 'pet_boarding_hostel', label: 'Pet Boarding & Daycare' },
      { id: 'other', label: 'Other Pet Service' }
    ]
  },
  {
    id: 'beauty_products',
    label: 'Beauty Products & Cosmetics',
    description: 'Cosmetics, skincare, perfumes & salon supply store',
    subcategories: [
      { id: 'cosmetics_store', label: 'Cosmetics & Makeup Store' },
      { id: 'organic_skincare', label: 'Natural & Ayurvedic Skincare' },
      { id: 'perfumes_fragrance', label: 'Perfumes & Attars' },
      { id: 'salon_wholesale_supply', label: 'Salon Professional Supplies' },
      { id: 'other', label: 'Other Beauty Products' }
    ]
  },
  {
    id: 'food_beverage',
    label: 'Food & Beverage',
    description: 'Sweet shops, ice cream parlours, juice bars & caterers',
    subcategories: [
      { id: 'sweet_farsan_mart', label: 'Mithai & Farsan Shop' },
      { id: 'ice_cream_parlour', label: 'Ice Cream & Dessert Parlour' },
      { id: 'juice_smoothie_bar', label: 'Fresh Juice & Shake Bar' },
      { id: 'catering_services', label: 'Outdoor & Wedding Catering' },
      { id: 'other', label: 'Other Food Outlet' }
    ]
  },
  {
    id: 'automotive_sales',
    label: 'Automotive Sales',
    description: 'Used car dealership, two-wheeler showroom & commercial vehicles',
    subcategories: [
      { id: 'used_cars', label: 'Pre-Owned Car Dealership' },
      { id: 'two_wheeler_sales', label: 'Two-Wheeler Showroom' },
      { id: 'ev_sales', label: 'Electric Vehicle (EV) Dealership' },
      { id: 'commercial_vehicles', label: 'Commercial Vehicles & Tractors' },
      { id: 'other', label: 'Other Vehicle Sales' }
    ]
  },
  {
    id: 'retail_store',
    label: 'Retail Store',
    description: 'General retail store, gift shop, opticals, toys & variety',
    subcategories: [
      { id: 'gift_novelty_shop', label: 'Gifts, Toys & Novelty Store' },
      { id: 'optical_eyewear', label: 'Optical & Eyewear Store' },
      { id: 'watch_clock_store', label: 'Watch & Clock Store' },
      { id: 'luggage_bags', label: 'Bags, Luggage & Travel Gear' },
      { id: 'other', label: 'Other Retail Store' }
    ]
  },
  {
    id: 'service_business',
    label: 'Service Business',
    description: 'Event management, catering, cleaning, security & pest control',
    subcategories: [
      { id: 'event_management', label: 'Event Management & Wedding Planning' },
      { id: 'cleaning_housekeeping', label: 'Deep Cleaning & Sanitization' },
      { id: 'pest_control', label: 'Pest Control Services' },
      { id: 'security_facility', label: 'Security & Facility Management' },
      { id: 'laundry_dryclean', label: 'Laundry & Dry Cleaning' },
      { id: 'other', label: 'Other Service Business' }
    ]
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Any other specialized local trade or enterprise',
    subcategories: [
      { id: 'custom_enterprise', label: 'Custom Enterprise / Local Trade' },
      { id: 'artisan_craft', label: 'Artisan & Handcraft' },
      { id: 'other', label: 'Other' }
    ]
  }
];

export function findCategoryById(catId: string): MainCategoryItem | undefined {
  return MAIN_CATEGORIES.find(c => c.id === catId);
}

export function getCategoryLabel(catId: string): string {
  const cat = findCategoryById(catId);
  return cat ? cat.label : catId;
}

export function getSubcategoryLabel(catId: string, subId?: string): string {
  if (!subId) return '';
  const cat = findCategoryById(catId);
  if (!cat) return subId;
  const sub = cat.subcategories.find(s => s.id === subId);
  return sub ? sub.label : subId;
}
