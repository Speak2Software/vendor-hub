import { v4 as uuidv4 } from 'uuid'

const KEYS = {
  USERS: 'vh_users',
  COMMUNITIES: 'vh_communities',
  APPLICATIONS: 'vh_applications',
  VENDOR_PROFILES: 'vh_vendor_profiles',
  COMPANY_PROFILES: 'vh_company_profiles',
  CURRENT_USER: 'vh_current_user',
  SEED_VERSION: 'vh_seed_version',
  REVIEWS: 'vh_reviews',
  MESSAGES: 'vh_messages',
}

const SEED_VERSION = '6'

function get(key) {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : null
  } catch {
    return null
  }
}

function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ── Seed ──────────────────────────────────────────────────────────────────────
export function seed() {
  if (get(KEYS.SEED_VERSION) === SEED_VERSION) return // already at current version
  // Clear all data and re-seed fresh
  Object.values(KEYS).forEach((k) => { if (k !== KEYS.CURRENT_USER) localStorage.removeItem(k) })

  // ── IDs ──────────────────────────────────────────────────────────────────────
  const adminId  = uuidv4()
  // Managers
  const mgr1Id = uuidv4(), mgr2Id = uuidv4()
  // Communities
  const comm1Id = uuidv4(), comm2Id = uuidv4(), comm3Id = uuidv4()
  const comm4Id = uuidv4(), comm5Id = uuidv4(), comm6Id = uuidv4(), comm7Id = uuidv4()
  // Vendors
  const v1Id  = uuidv4() // BrightPath Transportation (original)
  const v2Id  = uuidv4() // CareFirst Home Health
  const v3Id  = uuidv4() // Silver Shuttle
  const v4Id  = uuidv4() // Nourish Senior Meals
  const v5Id  = uuidv4() // Fresh & Clean Housekeeping
  const v6Id  = uuidv4() // ComfortFix Maintenance
  const v7Id  = uuidv4() // Gentle Touch Personal Care
  const v8Id  = uuidv4() // MoveBetter Therapy Group
  const v9Id  = uuidv4() // Mindbridge Counseling
  const v10Id = uuidv4() // SeniorTech Solutions
  const v11Id = uuidv4() // Golden Years Pharmacy

  const ago = (days) => new Date(Date.now() - days * 864e5).toISOString()

  // ── Users ─────────────────────────────────────────────────────────────────────
  const users = [
    { id: adminId, name: 'Admin User',      email: 'admin@vendorhub.com',         password: 'admin123',   role: 'admin',             createdAt: ago(60) },
    { id: mgr1Id,  name: 'Sandra Reyes',    email: 'sandra@sunrisegarden.com',    password: 'manager123', role: 'community_manager', communityId: comm1Id, createdAt: ago(50) },
    { id: mgr2Id,  name: 'James Holloway',  email: 'james@maplegrove.com',        password: 'manager123', role: 'community_manager', communityId: comm2Id, createdAt: ago(50) },
    { id: v1Id,    name: 'Maria Gonzalez',  email: 'vendor@demo.com',             password: 'vendor123',  role: 'vendor', createdAt: ago(45) },
    { id: v2Id,    name: 'Linda Pearson',   email: 'linda@carefirst.com',         password: 'vendor123',  role: 'vendor', createdAt: ago(40) },
    { id: v3Id,    name: 'Carlos Mendez',   email: 'carlos@silvershuttle.com',    password: 'vendor123',  role: 'vendor', createdAt: ago(38) },
    { id: v4Id,    name: 'Priya Nair',      email: 'priya@nourishmeals.com',      password: 'vendor123',  role: 'vendor', createdAt: ago(35) },
    { id: v5Id,    name: 'Rachel Kim',      email: 'rachel@freshandclean.com',    password: 'vendor123',  role: 'vendor', createdAt: ago(30) },
    { id: v6Id,    name: 'Derek Walsh',     email: 'derek@comfortfix.com',        password: 'vendor123',  role: 'vendor', createdAt: ago(28) },
    { id: v7Id,    name: 'Angela Torres',   email: 'angela@gentletouch.com',      password: 'vendor123',  role: 'vendor', createdAt: ago(25) },
    { id: v8Id,    name: 'Thomas Blake',    email: 'thomas@movebetter.com',       password: 'vendor123',  role: 'vendor', createdAt: ago(22) },
    { id: v9Id,    name: 'Dr. Sara Okonkwo',email: 'sara@mindbridge.com',         password: 'vendor123',  role: 'vendor', createdAt: ago(20) },
    { id: v10Id,   name: 'Kevin Park',      email: 'kevin@seniortech.com',        password: 'vendor123',  role: 'vendor', createdAt: ago(18) },
    { id: v11Id,   name: 'Helen Russo',     email: 'helen@goldenyearsrx.com',     password: 'vendor123',  role: 'vendor', createdAt: ago(15) },
  ]

  // ── Communities ───────────────────────────────────────────────────────────────
  const communities = [
    {
      id: comm1Id, name: 'Sunrise Garden Senior Living',
      address: '1420 Sunrise Blvd, Phoenix, AZ 85006',
      description: 'A warm, welcoming community offering personalized care in a garden setting.',
      careLevels: ['Independent Living', 'Assisted Living', 'Memory Care'],
      size: 'Medium (50–150 residents)', logoUrl: '',
      location: { lat: 33.4484, lng: -112.074 }, managerId: mgr1Id, createdAt: ago(50),
      contactUrl: 'www.sunrisegarden.com', contactEmail: 'info@sunrisegarden.com', contactPhone: '(602) 555-0100',
      showUrl: true, showEmail: true, showPhone: true,
    },
    {
      id: comm2Id, name: 'Maple Grove Retirement Center',
      address: '892 Maple Grove Dr, Scottsdale, AZ 85251',
      description: 'Luxury retirement living with resort-style amenities and skilled nursing care.',
      careLevels: ['Independent Living', 'Skilled Nursing', 'Respite Care'],
      size: 'Large (150–300 residents)', logoUrl: '',
      location: { lat: 33.4942, lng: -111.9261 }, managerId: mgr2Id, createdAt: ago(50),
      contactUrl: 'www.maplegrove.com', contactEmail: 'james@maplegrove.com', contactPhone: '(480) 555-0200',
      showUrl: true, showEmail: false, showPhone: true,
    },
    {
      id: comm3Id, name: 'Oceanview Assisted Living',
      address: '3800 Coronado Ave, San Diego, CA 92107',
      description: 'Coastal senior living with ocean breezes, vibrant activities, and compassionate assisted care.',
      careLevels: ['Assisted Living', 'Memory Care', 'Respite Care'],
      size: 'Medium (50–150 residents)', logoUrl: '',
      location: { lat: 32.7157, lng: -117.1611 }, managerId: '', createdAt: ago(45),
      contactUrl: '', contactEmail: '', contactPhone: '',
      showUrl: false, showEmail: false, showPhone: false,
    },
    {
      id: comm4Id, name: 'Prairie Winds Senior Living',
      address: '5120 Dodge St, Omaha, NE 68132',
      description: 'A peaceful Midwestern community focused on independent and active senior lifestyles.',
      careLevels: ['Independent Living', 'Assisted Living'],
      size: 'Small (< 50 residents)', logoUrl: '',
      location: { lat: 41.2565, lng: -95.9345 }, managerId: '', createdAt: ago(40),
      contactUrl: '', contactEmail: '', contactPhone: '',
      showUrl: false, showEmail: false, showPhone: false,
    },
    {
      id: comm5Id, name: 'Lakeside Gardens Retirement',
      address: '742 N Lake Shore Dr, Chicago, IL 60611',
      description: 'Upscale lakeside retirement community offering a full continuum of care in the heart of Chicago.',
      careLevels: ['Independent Living', 'Assisted Living', 'Skilled Nursing', 'Continuing Care Retirement Community (CCRC)'],
      size: 'Very Large (300+ residents)', logoUrl: '',
      location: { lat: 41.8827, lng: -87.6233 }, managerId: '', createdAt: ago(38),
      contactUrl: '', contactEmail: '', contactPhone: '',
      showUrl: false, showEmail: false, showPhone: false,
    },
    {
      id: comm6Id, name: 'Magnolia Grove Senior Community',
      address: '1190 Peachtree St NE, Atlanta, GA 30309',
      description: 'Southern hospitality meets modern senior care in our beautifully landscaped Atlanta campus.',
      careLevels: ['Independent Living', 'Assisted Living', 'Memory Care'],
      size: 'Large (150–300 residents)', logoUrl: '',
      location: { lat: 33.7490, lng: -84.3880 }, managerId: '', createdAt: ago(35),
      contactUrl: '', contactEmail: '', contactPhone: '',
      showUrl: false, showEmail: false, showPhone: false,
    },
    {
      id: comm7Id, name: 'Blue Ridge Memory Care',
      address: '210 Merrimon Ave, Asheville, NC 28801',
      description: 'Nestled in the Blue Ridge Mountains, specializing in compassionate memory and dementia care.',
      careLevels: ['Memory Care', 'Skilled Nursing', 'Respite Care'],
      size: 'Small (< 50 residents)', logoUrl: '',
      location: { lat: 35.5951, lng: -82.5515 }, managerId: '', createdAt: ago(30),
      contactUrl: '', contactEmail: '', contactPhone: '',
      showUrl: false, showEmail: false, showPhone: false,
    },
  ]

  // ── Vendor Profiles (location + radius) ────────────────────────────────────
  const vendorProfiles = [
    { userId: v1Id,  location: { lat: 33.4484, lng: -112.074  }, serviceRadiusMiles: 25,  updatedAt: ago(44) },
    { userId: v2Id,  location: { lat: 33.5200, lng: -112.0600 }, serviceRadiusMiles: 30,  updatedAt: ago(39) },
    { userId: v3Id,  location: { lat: 32.7300, lng: -117.1500 }, serviceRadiusMiles: 40,  updatedAt: ago(37) },
    { userId: v4Id,  location: { lat: 41.8700, lng: -87.6400  }, serviceRadiusMiles: 20,  updatedAt: ago(34) },
    { userId: v5Id,  location: { lat: 33.4600, lng: -112.0500 }, serviceRadiusMiles: 15,  updatedAt: ago(29) },
    { userId: v6Id,  location: { lat: 33.7550, lng: -84.3900  }, serviceRadiusMiles: 35,  updatedAt: ago(27) },
    { userId: v7Id,  location: { lat: 33.5000, lng: -111.9200 }, serviceRadiusMiles: 20,  updatedAt: ago(24) },
    { userId: v8Id,  location: { lat: 33.4300, lng: -112.0900 }, serviceRadiusMiles: 25,  updatedAt: ago(21) },
    { userId: v9Id,  location: { lat: 35.6000, lng: -82.5600  }, serviceRadiusMiles: 50,  updatedAt: ago(19) },
    { userId: v10Id, location: { lat: 41.2600, lng: -95.9300  }, serviceRadiusMiles: 60,  updatedAt: ago(17) },
    { userId: v11Id, location: { lat: 41.8900, lng: -87.6100  }, serviceRadiusMiles: 25,  updatedAt: ago(14) },
  ]

  // ── Applications ──────────────────────────────────────────────────────────────
  function mkApp(overrides) {
    const base = {
      id: uuidv4(), status: 'pending',
      backgroundCheckConsent: true, termsAgreed: true,
      notes: [], reference1Name: '', reference1Company: '', reference1Phone: '',
      reference2Name: '', reference2Company: '', reference2Phone: '',
      licenseInfo: '', insuranceProvider: '', insurancePolicyNumber: '', insuranceExpiration: '',
    }
    const merged = { ...base, ...overrides }
    if (!merged.statusHistory) {
      merged.statusHistory = [{ status: 'pending', timestamp: merged.submittedAt, note: 'Application submitted.' }]
    }
    return merged
  }

  function approvedHistory(submittedAt, approvedAt) {
    return [
      { status: 'pending',  timestamp: submittedAt, note: 'Application submitted.' },
      { status: 'approved', timestamp: approvedAt,  note: 'Application approved.' },
    ]
  }

  const applications = [
    // ── v1: BrightPath Transportation ──────────────────────────────────────────
    mkApp({
      vendorId: v1Id, communityId: comm1Id, status: 'pending',
      submittedAt: ago(2),
      businessName: 'BrightPath Transportation', contactName: 'Maria Gonzalez',
      contactEmail: 'vendor@demo.com', contactPhone: '(602) 555-0177',
      businessAddress: '305 W Van Buren St, Phoenix, AZ 85003',
      serviceCategory: 'Transportation', yearsInBusiness: '7',
      businessDescription: 'Non-emergency medical transportation and senior shuttle services throughout the Phoenix metro area.',
      servicesOffered: 'Door-to-door medical appointments, grocery runs, social outings, wheelchair-accessible vehicles.',
      licenseInfo: 'AZ DOT License #AZ-MED-22947', insuranceProvider: 'Nationwide',
      insurancePolicyNumber: 'NW-88712-XL', insuranceExpiration: '2026-11-30',
      reference1Name: 'Dr. Elaine Ford', reference1Company: 'Desert Valley Medical Group', reference1Phone: '(602) 555-0220',
      reference2Name: 'Robert Kim', reference2Company: 'Sunbelt Senior Services', reference2Phone: '(602) 555-0384',
    }),

    // ── v2: CareFirst Home Health ──────────────────────────────────────────────
    mkApp({
      vendorId: v2Id, communityId: comm1Id, status: 'approved',
      submittedAt: ago(30), statusHistory: approvedHistory(ago(30), ago(22)),
      businessName: 'CareFirst Home Health', contactName: 'Linda Pearson',
      contactEmail: 'linda@carefirst.com', contactPhone: '(602) 555-0310',
      businessAddress: '4700 N Central Ave, Phoenix, AZ 85012',
      serviceCategory: 'Medical / Healthcare', yearsInBusiness: '12',
      businessDescription: 'Licensed home health agency providing skilled nursing, medication management, and chronic disease support to seniors.',
      servicesOffered: 'Skilled nursing visits, wound care, medication management, chronic disease monitoring, post-hospitalization recovery.',
      licenseInfo: 'AZ Health Services License #HH-4821', insuranceProvider: 'BlueCross BlueShield',
      insurancePolicyNumber: 'BCBS-99021-C', insuranceExpiration: '2026-06-30',
      reference1Name: 'Dr. Marcus Webb', reference1Company: 'Banner Health', reference1Phone: '(602) 555-0441',
      reference2Name: 'Carla Simmons', reference2Company: 'HomeFirst Agency', reference2Phone: '(602) 555-0512',
    }),
    mkApp({
      vendorId: v2Id, communityId: comm2Id, status: 'approved',
      submittedAt: ago(28), statusHistory: approvedHistory(ago(28), ago(20)),
      businessName: 'CareFirst Home Health', contactName: 'Linda Pearson',
      contactEmail: 'linda@carefirst.com', contactPhone: '(602) 555-0310',
      businessAddress: '4700 N Central Ave, Phoenix, AZ 85012',
      serviceCategory: 'Medical / Healthcare', yearsInBusiness: '12',
      businessDescription: 'Licensed home health agency providing skilled nursing, medication management, and chronic disease support to seniors.',
      servicesOffered: 'Skilled nursing visits, wound care, medication management, chronic disease monitoring, post-hospitalization recovery.',
      licenseInfo: 'AZ Health Services License #HH-4821', insuranceProvider: 'BlueCross BlueShield',
      insurancePolicyNumber: 'BCBS-99021-C', insuranceExpiration: '2026-06-30',
    }),

    // ── v3: Silver Shuttle ─────────────────────────────────────────────────────
    mkApp({
      vendorId: v3Id, communityId: comm3Id, status: 'pending',
      submittedAt: ago(5),
      businessName: 'Silver Shuttle', contactName: 'Carlos Mendez',
      contactEmail: 'carlos@silvershuttle.com', contactPhone: '(619) 555-0188',
      businessAddress: '2200 Kettner Blvd, San Diego, CA 92101',
      serviceCategory: 'Transportation', yearsInBusiness: '4',
      businessDescription: 'Dedicated senior transportation across San Diego County with a focus on comfort, dignity, and on-time service.',
      servicesOffered: 'Medical appointments, dialysis transport, airport transfers, social outings, ADA-compliant vehicles.',
      licenseInfo: 'CA PUC License #TCP-41892', insuranceProvider: 'State Farm',
      insurancePolicyNumber: 'SF-77342-T', insuranceExpiration: '2026-08-15',
    }),

    // ── v4: Nourish Senior Meals ───────────────────────────────────────────────
    mkApp({
      vendorId: v4Id, communityId: comm5Id, status: 'approved',
      submittedAt: ago(20), statusHistory: approvedHistory(ago(20), ago(14)),
      businessName: 'Nourish Senior Meals', contactName: 'Priya Nair',
      contactEmail: 'priya@nourishmeals.com', contactPhone: '(312) 555-0229',
      businessAddress: '900 W Fulton Market, Chicago, IL 60607',
      serviceCategory: 'Food & Nutrition Services', yearsInBusiness: '9',
      businessDescription: 'Chef-prepared meal delivery and dining program designed specifically for seniors, including therapeutic and allergen-aware menus.',
      servicesOffered: 'Daily meal delivery, dining program management, dietitian consultations, soft/pureed diet options, holiday meal events.',
      licenseInfo: 'IL Food Service License #FS-38841', insuranceProvider: 'Travelers',
      insurancePolicyNumber: 'TR-55102-F', insuranceExpiration: '2026-04-30',
      reference1Name: 'Chef David Lau', reference1Company: 'Midwest Culinary Group', reference1Phone: '(312) 555-0300',
      reference2Name: 'Dr. Alice Hom', reference2Company: 'Rush University Medical', reference2Phone: '(312) 555-0388',
    }),

    // ── v5: Fresh & Clean Housekeeping ────────────────────────────────────────
    mkApp({
      vendorId: v5Id, communityId: comm1Id, status: 'approved',
      submittedAt: ago(25), statusHistory: approvedHistory(ago(25), ago(18)),
      businessName: 'Fresh & Clean Housekeeping', contactName: 'Rachel Kim',
      contactEmail: 'rachel@freshandclean.com', contactPhone: '(602) 555-0395',
      businessAddress: '1800 E Thomas Rd, Phoenix, AZ 85016',
      serviceCategory: 'Housekeeping & Laundry', yearsInBusiness: '6',
      businessDescription: 'Bonded and insured housekeeping and laundry service specializing in senior living environments with gentle, non-toxic products.',
      servicesOffered: 'Weekly and daily room cleaning, laundry and linen service, deep cleaning, common-area maintenance.',
      licenseInfo: 'AZ Contractor License #C-17732', insuranceProvider: 'Zurich',
      insurancePolicyNumber: 'ZU-44210-H', insuranceExpiration: '2026-09-30',
    }),
    mkApp({
      vendorId: v5Id, communityId: comm2Id, status: 'pending',
      submittedAt: ago(8),
      businessName: 'Fresh & Clean Housekeeping', contactName: 'Rachel Kim',
      contactEmail: 'rachel@freshandclean.com', contactPhone: '(602) 555-0395',
      businessAddress: '1800 E Thomas Rd, Phoenix, AZ 85016',
      serviceCategory: 'Housekeeping & Laundry', yearsInBusiness: '6',
      businessDescription: 'Bonded and insured housekeeping and laundry service specializing in senior living environments with gentle, non-toxic products.',
      servicesOffered: 'Weekly and daily room cleaning, laundry and linen service, deep cleaning, common-area maintenance.',
    }),

    // ── v6: ComfortFix Maintenance ────────────────────────────────────────────
    mkApp({
      vendorId: v6Id, communityId: comm6Id, status: 'pending',
      submittedAt: ago(4),
      businessName: 'ComfortFix Maintenance', contactName: 'Derek Walsh',
      contactEmail: 'derek@comfortfix.com', contactPhone: '(404) 555-0271',
      businessAddress: '300 Marietta St NW, Atlanta, GA 30313',
      serviceCategory: 'Maintenance & Facilities', yearsInBusiness: '11',
      businessDescription: 'Full-service facilities maintenance and repair company with extensive experience in senior living properties.',
      servicesOffered: 'HVAC servicing, plumbing, electrical repairs, painting, flooring, emergency on-call maintenance, ADA compliance upgrades.',
      licenseInfo: 'GA Contractor License #GCCO-88312', insuranceProvider: 'Hartford',
      insurancePolicyNumber: 'HF-23410-M', insuranceExpiration: '2026-12-31',
    }),

    // ── v7: Gentle Touch Personal Care ────────────────────────────────────────
    mkApp({
      vendorId: v7Id, communityId: comm2Id, status: 'approved',
      submittedAt: ago(35), statusHistory: approvedHistory(ago(35), ago(28)),
      businessName: 'Gentle Touch Personal Care', contactName: 'Angela Torres',
      contactEmail: 'angela@gentletouch.com', contactPhone: '(480) 555-0342',
      businessAddress: '7500 E McCormick Pkwy, Scottsdale, AZ 85258',
      serviceCategory: 'Personal Care & Grooming', yearsInBusiness: '8',
      businessDescription: 'In-residence beauty and grooming services that bring salon-quality care directly to seniors in their community.',
      servicesOffered: 'Haircuts and styling, manicures and pedicures, shaving, skincare treatments, mobile barbershop services.',
      licenseInfo: 'AZ Board of Cosmetology License #COS-29841',
      insuranceProvider: 'USAA', insurancePolicyNumber: 'US-11904-P', insuranceExpiration: '2026-05-31',
    }),
    mkApp({
      vendorId: v7Id, communityId: comm1Id, status: 'pending',
      submittedAt: ago(6),
      businessName: 'Gentle Touch Personal Care', contactName: 'Angela Torres',
      contactEmail: 'angela@gentletouch.com', contactPhone: '(480) 555-0342',
      businessAddress: '7500 E McCormick Pkwy, Scottsdale, AZ 85258',
      serviceCategory: 'Personal Care & Grooming', yearsInBusiness: '8',
      businessDescription: 'In-residence beauty and grooming services that bring salon-quality care directly to seniors in their community.',
      servicesOffered: 'Haircuts and styling, manicures and pedicures, shaving, skincare treatments, mobile barbershop services.',
    }),

    // ── v8: MoveBetter Therapy Group ──────────────────────────────────────────
    mkApp({
      vendorId: v8Id, communityId: comm1Id, status: 'pending',
      submittedAt: ago(3),
      businessName: 'MoveBetter Therapy Group', contactName: 'Thomas Blake',
      contactEmail: 'thomas@movebetter.com', contactPhone: '(602) 555-0483',
      businessAddress: '2929 N 44th St, Phoenix, AZ 85018',
      serviceCategory: 'Physical / Occupational Therapy', yearsInBusiness: '5',
      businessDescription: 'Licensed physical and occupational therapy practice focused on improving mobility, reducing fall risk, and restoring independence in older adults.',
      servicesOffered: 'PT and OT evaluations, fall prevention programs, post-surgical rehab, balance training, adaptive equipment assessments.',
      licenseInfo: 'AZ PT License #PT-18822 / OT License #OT-22019',
      insuranceProvider: 'ProAssurance', insurancePolicyNumber: 'PA-67310-T', insuranceExpiration: '2026-07-31',
      reference1Name: 'Dr. Nina Patel', reference1Company: 'Banner Estrella Medical', reference1Phone: '(602) 555-0550',
      reference2Name: 'Gail Ortiz', reference2Company: 'AZ Senior Rehab Network', reference2Phone: '(602) 555-0601',
    }),

    // ── v9: Mindbridge Counseling ──────────────────────────────────────────────
    mkApp({
      vendorId: v9Id, communityId: comm7Id, status: 'pending',
      submittedAt: ago(7),
      businessName: 'Mindbridge Counseling', contactName: 'Dr. Sara Okonkwo',
      contactEmail: 'sara@mindbridge.com', contactPhone: '(828) 555-0134',
      businessAddress: '45 Haywood St, Asheville, NC 28801',
      serviceCategory: 'Mental Health & Counseling', yearsInBusiness: '14',
      businessDescription: 'Licensed clinical social workers and psychologists providing individual and group counseling for older adults navigating life transitions, grief, and depression.',
      servicesOffered: 'Individual therapy, group sessions, grief counseling, anxiety and depression treatment, family consultation.',
      licenseInfo: 'NC LCSW License #C-14772', insuranceProvider: 'CUNA Mutual',
      insurancePolicyNumber: 'CM-38801-C', insuranceExpiration: '2026-10-31',
    }),

    // ── v10: SeniorTech Solutions ──────────────────────────────────────────────
    mkApp({
      vendorId: v10Id, communityId: comm4Id, status: 'approved',
      submittedAt: ago(18), statusHistory: approvedHistory(ago(18), ago(11)),
      businessName: 'SeniorTech Solutions', contactName: 'Kevin Park',
      contactEmail: 'kevin@seniortech.com', contactPhone: '(402) 555-0219',
      businessAddress: '1000 Howard St, Omaha, NE 68102',
      serviceCategory: 'Technology & Telehealth', yearsInBusiness: '3',
      businessDescription: 'Senior-focused technology company providing easy-to-use telehealth platforms, smart monitoring devices, and on-site tech support.',
      servicesOffered: 'Telehealth setup and training, remote patient monitoring, fall detection devices, family communication tablets, IT support.',
      licenseInfo: 'NE Technology Vendor Cert #TECH-9041',
      insuranceProvider: 'Markel', insurancePolicyNumber: 'MK-52019-T', insuranceExpiration: '2026-03-31',
      reference1Name: 'Dr. Janet Liu', reference1Company: 'CHI Health', reference1Phone: '(402) 555-0280',
      reference2Name: 'Brian Novak', reference2Company: 'Nebraska Senior Services', reference2Phone: '(402) 555-0319',
    }),

    // ── v11: Golden Years Pharmacy ────────────────────────────────────────────
    mkApp({
      vendorId: v11Id, communityId: comm5Id, status: 'pending',
      submittedAt: ago(9),
      businessName: 'Golden Years Pharmacy', contactName: 'Helen Russo',
      contactEmail: 'helen@goldenyearsrx.com', contactPhone: '(773) 555-0266',
      businessAddress: '6000 N Winthrop Ave, Chicago, IL 60660',
      serviceCategory: 'Pharmacy & Medical Supplies', yearsInBusiness: '16',
      businessDescription: 'Independent pharmacy specializing in long-term care and senior living communities, offering blister packaging, delivery, and on-site consultations.',
      servicesOffered: 'Medication blister packing, free delivery, medication therapy management, OTC supply fulfillment, pharmacist consultations.',
      licenseInfo: 'IL Pharmacy License #054-018842',
      insuranceProvider: 'Pharmacists Mutual', insurancePolicyNumber: 'PM-77003-R', insuranceExpiration: '2026-11-30',
      reference1Name: 'Dr. Frank Molina', reference1Company: 'Advocate Medical Group', reference1Phone: '(773) 555-0330',
      reference2Name: 'Tasha Green', reference2Company: 'Chicago Senior Living Assoc.', reference2Phone: '(773) 555-0411',
    }),
  ]

  // ── Company Profiles (one per vendor — saved once, reused across applications) ──
  const companyProfiles = [
    {
      userId: v1Id, updatedAt: ago(44),
      businessName: 'BrightPath Transportation', contactName: 'Maria Gonzalez',
      contactEmail: 'vendor@demo.com', contactPhone: '(602) 555-0177',
      businessAddress: '305 W Van Buren St, Phoenix, AZ 85003',
      serviceCategory: 'Transportation', yearsInBusiness: '7',
      businessDescription: 'Non-emergency medical transportation and senior shuttle services throughout the Phoenix metro area.',
      licenseInfo: 'AZ DOT License #AZ-MED-22947', insuranceProvider: 'Nationwide',
      insurancePolicyNumber: 'NW-88712-XL', insuranceExpiration: '2026-11-30',
      reference1Name: 'Dr. Elaine Ford', reference1Company: 'Desert Valley Medical Group', reference1Phone: '(602) 555-0220',
      backgroundCheckConsent: true, termsAgreed: true,
    },
    {
      userId: v2Id, updatedAt: ago(39),
      businessName: 'CareFirst Home Health', contactName: 'Linda Pearson',
      contactEmail: 'linda@carefirst.com', contactPhone: '(602) 555-0310',
      businessAddress: '4700 N Central Ave, Phoenix, AZ 85012',
      serviceCategory: 'Medical / Healthcare', yearsInBusiness: '12',
      businessDescription: 'Licensed home health agency providing skilled nursing, medication management, and chronic disease support to seniors.',
      licenseInfo: 'AZ Health Services License #HH-4821', insuranceProvider: 'BlueCross BlueShield',
      insurancePolicyNumber: 'BCBS-99021-C', insuranceExpiration: '2026-06-30',
      reference1Name: 'Dr. Marcus Webb', reference1Company: 'Banner Health', reference1Phone: '(602) 555-0441',
      backgroundCheckConsent: true, termsAgreed: true,
    },
    {
      userId: v3Id, updatedAt: ago(37),
      businessName: 'Silver Shuttle', contactName: 'Carlos Mendez',
      contactEmail: 'carlos@silvershuttle.com', contactPhone: '(619) 555-0188',
      businessAddress: '2200 Kettner Blvd, San Diego, CA 92101',
      serviceCategory: 'Transportation', yearsInBusiness: '4',
      businessDescription: 'Dedicated senior transportation across San Diego County with a focus on comfort, dignity, and on-time service.',
      licenseInfo: 'CA PUC License #TCP-41892', insuranceProvider: 'State Farm',
      insurancePolicyNumber: 'SF-77342-T', insuranceExpiration: '2026-08-15',
      reference1Name: '', reference1Company: '', reference1Phone: '',
      backgroundCheckConsent: true, termsAgreed: true,
    },
    {
      userId: v4Id, updatedAt: ago(34),
      businessName: 'Nourish Senior Meals', contactName: 'Priya Nair',
      contactEmail: 'priya@nourishmeals.com', contactPhone: '(312) 555-0229',
      businessAddress: '900 W Fulton Market, Chicago, IL 60607',
      serviceCategory: 'Food & Nutrition Services', yearsInBusiness: '9',
      businessDescription: 'Chef-prepared meal delivery and dining program designed specifically for seniors, including therapeutic and allergen-aware menus.',
      licenseInfo: 'IL Food Service License #FS-38841', insuranceProvider: 'Travelers',
      insurancePolicyNumber: 'TR-55102-F', insuranceExpiration: '2026-04-30',
      reference1Name: 'Chef David Lau', reference1Company: 'Midwest Culinary Group', reference1Phone: '(312) 555-0300',
      backgroundCheckConsent: true, termsAgreed: true,
    },
    {
      userId: v5Id, updatedAt: ago(29),
      businessName: 'Fresh & Clean Housekeeping', contactName: 'Rachel Kim',
      contactEmail: 'rachel@freshandclean.com', contactPhone: '(602) 555-0395',
      businessAddress: '1800 E Thomas Rd, Phoenix, AZ 85016',
      serviceCategory: 'Housekeeping & Laundry', yearsInBusiness: '6',
      businessDescription: 'Bonded and insured housekeeping and laundry service specializing in senior living environments with gentle, non-toxic products.',
      licenseInfo: 'AZ Contractor License #C-17732', insuranceProvider: 'Zurich',
      insurancePolicyNumber: 'ZU-44210-H', insuranceExpiration: '2026-09-30',
      reference1Name: '', reference1Company: '', reference1Phone: '',
      backgroundCheckConsent: true, termsAgreed: true,
    },
    {
      userId: v6Id, updatedAt: ago(27),
      businessName: 'ComfortFix Maintenance', contactName: 'Derek Walsh',
      contactEmail: 'derek@comfortfix.com', contactPhone: '(404) 555-0271',
      businessAddress: '300 Marietta St NW, Atlanta, GA 30313',
      serviceCategory: 'Maintenance & Facilities', yearsInBusiness: '11',
      businessDescription: 'Full-service facilities maintenance and repair company with extensive experience in senior living properties.',
      licenseInfo: 'GA Contractor License #GCCO-88312', insuranceProvider: 'Hartford',
      insurancePolicyNumber: 'HF-23410-M', insuranceExpiration: '2026-12-31',
      reference1Name: '', reference1Company: '', reference1Phone: '',
      backgroundCheckConsent: true, termsAgreed: true,
    },
    {
      userId: v7Id, updatedAt: ago(24),
      businessName: 'Gentle Touch Personal Care', contactName: 'Angela Torres',
      contactEmail: 'angela@gentletouch.com', contactPhone: '(480) 555-0342',
      businessAddress: '7500 E McCormick Pkwy, Scottsdale, AZ 85258',
      serviceCategory: 'Personal Care & Grooming', yearsInBusiness: '8',
      businessDescription: 'In-residence beauty and grooming services that bring salon-quality care directly to seniors in their community.',
      licenseInfo: 'AZ Board of Cosmetology License #COS-29841',
      insuranceProvider: 'USAA', insurancePolicyNumber: 'US-11904-P', insuranceExpiration: '2026-05-31',
      reference1Name: '', reference1Company: '', reference1Phone: '',
      backgroundCheckConsent: true, termsAgreed: true,
    },
    {
      userId: v8Id, updatedAt: ago(21),
      businessName: 'MoveBetter Therapy Group', contactName: 'Thomas Blake',
      contactEmail: 'thomas@movebetter.com', contactPhone: '(602) 555-0483',
      businessAddress: '2929 N 44th St, Phoenix, AZ 85018',
      serviceCategory: 'Physical / Occupational Therapy', yearsInBusiness: '5',
      businessDescription: 'Licensed physical and occupational therapy practice focused on improving mobility, reducing fall risk, and restoring independence in older adults.',
      licenseInfo: 'AZ PT License #PT-18822 / OT License #OT-22019',
      insuranceProvider: 'ProAssurance', insurancePolicyNumber: 'PA-67310-T', insuranceExpiration: '2026-07-31',
      reference1Name: 'Dr. Nina Patel', reference1Company: 'Banner Estrella Medical', reference1Phone: '(602) 555-0550',
      backgroundCheckConsent: true, termsAgreed: true,
    },
    {
      userId: v9Id, updatedAt: ago(19),
      businessName: 'Mindbridge Counseling', contactName: 'Dr. Sara Okonkwo',
      contactEmail: 'sara@mindbridge.com', contactPhone: '(828) 555-0134',
      businessAddress: '45 Haywood St, Asheville, NC 28801',
      serviceCategory: 'Mental Health & Counseling', yearsInBusiness: '14',
      businessDescription: 'Licensed clinical social workers and psychologists providing individual and group counseling for older adults navigating life transitions, grief, and depression.',
      licenseInfo: 'NC LCSW License #C-14772', insuranceProvider: 'CUNA Mutual',
      insurancePolicyNumber: 'CM-38801-C', insuranceExpiration: '2026-10-31',
      reference1Name: '', reference1Company: '', reference1Phone: '',
      backgroundCheckConsent: true, termsAgreed: true,
    },
    {
      userId: v10Id, updatedAt: ago(17),
      businessName: 'SeniorTech Solutions', contactName: 'Kevin Park',
      contactEmail: 'kevin@seniortech.com', contactPhone: '(402) 555-0219',
      businessAddress: '1000 Howard St, Omaha, NE 68102',
      serviceCategory: 'Technology & Telehealth', yearsInBusiness: '3',
      businessDescription: 'Senior-focused technology company providing easy-to-use telehealth platforms, smart monitoring devices, and on-site tech support.',
      licenseInfo: 'NE Technology Vendor Cert #TECH-9041',
      insuranceProvider: 'Markel', insurancePolicyNumber: 'MK-52019-T', insuranceExpiration: '2026-03-31',
      reference1Name: 'Dr. Janet Liu', reference1Company: 'CHI Health', reference1Phone: '(402) 555-0280',
      backgroundCheckConsent: true, termsAgreed: true,
    },
    {
      userId: v11Id, updatedAt: ago(14),
      businessName: 'Golden Years Pharmacy', contactName: 'Helen Russo',
      contactEmail: 'helen@goldenyearsrx.com', contactPhone: '(773) 555-0266',
      businessAddress: '6000 N Winthrop Ave, Chicago, IL 60660',
      serviceCategory: 'Pharmacy & Medical Supplies', yearsInBusiness: '16',
      businessDescription: 'Independent pharmacy specializing in long-term care and senior living communities, offering blister packaging, delivery, and on-site consultations.',
      licenseInfo: 'IL Pharmacy License #054-018842',
      insuranceProvider: 'Pharmacists Mutual', insurancePolicyNumber: 'PM-77003-R', insuranceExpiration: '2026-11-30',
      reference1Name: 'Dr. Frank Molina', reference1Company: 'Advocate Medical Group', reference1Phone: '(773) 555-0330',
      backgroundCheckConsent: true, termsAgreed: true,
    },
  ]

  set(KEYS.USERS, users)
  set(KEYS.COMMUNITIES, communities)
  set(KEYS.VENDOR_PROFILES, vendorProfiles)
  set(KEYS.COMPANY_PROFILES, companyProfiles)
  set(KEYS.APPLICATIONS, applications)
  set(KEYS.SEED_VERSION, SEED_VERSION)
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export function getCurrentUser() {
  const id = get(KEYS.CURRENT_USER)
  if (!id) return null
  return getUsers().find((u) => u.id === id) || null
}

export function login(email, password) {
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  )
  if (!user) return null
  set(KEYS.CURRENT_USER, user.id)
  return user
}

export function logout() {
  localStorage.removeItem(KEYS.CURRENT_USER)
}

export function createUser(data) {
  const users = getUsers()
  if (users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    throw new Error('Email already in use.')
  }
  const user = { id: uuidv4(), createdAt: new Date().toISOString(), ...data }
  set(KEYS.USERS, [...users, user])
  set(KEYS.CURRENT_USER, user.id)
  return user
}

export function updateUser(id, updates) {
  const users = getUsers().map((u) => (u.id === id ? { ...u, ...updates } : u))
  set(KEYS.USERS, users)
}

// ── Users ─────────────────────────────────────────────────────────────────────
export function getUsers() {
  return get(KEYS.USERS) || []
}

// ── Communities ───────────────────────────────────────────────────────────────
export function getCommunities() {
  return get(KEYS.COMMUNITIES) || []
}

export function getCommunity(id) {
  return getCommunities().find((c) => c.id === id) || null
}

export function saveCommunity(community) {
  const list = getCommunities()
  const existing = list.findIndex((c) => c.id === community.id)
  if (existing >= 0) {
    list[existing] = community
  } else {
    list.push({ id: uuidv4(), createdAt: new Date().toISOString(), ...community })
  }
  set(KEYS.COMMUNITIES, list)
}

export function deleteCommunity(id) {
  set(KEYS.COMMUNITIES, getCommunities().filter((c) => c.id !== id))
}

// ── Vendor Profiles ───────────────────────────────────────────────────────────
export function getVendorProfile(userId) {
  const profiles = get(KEYS.VENDOR_PROFILES) || []
  return profiles.find((p) => p.userId === userId) || null
}

export function saveVendorProfile(profile) {
  const profiles = get(KEYS.VENDOR_PROFILES) || []
  const idx = profiles.findIndex((p) => p.userId === profile.userId)
  if (idx >= 0) {
    profiles[idx] = { ...profiles[idx], ...profile, updatedAt: new Date().toISOString() }
  } else {
    profiles.push({ ...profile, updatedAt: new Date().toISOString() })
  }
  set(KEYS.VENDOR_PROFILES, profiles)
}

// ── Applications ──────────────────────────────────────────────────────────────
export function getApplications() {
  return get(KEYS.APPLICATIONS) || []
}

export function getApplication(id) {
  return getApplications().find((a) => a.id === id) || null
}

export function getApplicationsForCommunity(communityId) {
  return getApplications().filter((a) => a.communityId === communityId)
}

export function getApplicationsForVendor(vendorId) {
  return getApplications().filter((a) => a.vendorId === vendorId)
}

export function saveApplication(application) {
  const list = getApplications()
  const idx = list.findIndex((a) => a.id === application.id)
  if (idx >= 0) {
    list[idx] = application
  } else {
    list.push({ id: uuidv4(), submittedAt: new Date().toISOString(), ...application })
  }
  set(KEYS.APPLICATIONS, list)
  return list.find((a) => a.id === application.id) || application
}

export function addApplicationNote(appId, note, managerId) {
  const list = getApplications()
  const idx = list.findIndex((a) => a.id === appId)
  if (idx < 0) return
  list[idx].notes = [
    ...(list[idx].notes || []),
    { id: uuidv4(), text: note, managerId, timestamp: new Date().toISOString() },
  ]
  set(KEYS.APPLICATIONS, list)
  return list[idx]
}

export function revokeApplication(id) {
  const list = getApplications()
  const idx = list.findIndex((a) => a.id === id)
  if (idx < 0) return
  list[idx].status = 'revoked'
  list[idx].statusHistory = [
    ...(list[idx].statusHistory || []),
    { status: 'revoked', timestamp: new Date().toISOString(), note: 'Application revoked by vendor.' },
  ]
  set(KEYS.APPLICATIONS, list)
  return list[idx]
}

export function updateApplicationStatus(appId, status, managerId, note) {
  const list = getApplications()
  const idx = list.findIndex((a) => a.id === appId)
  if (idx < 0) return
  list[idx].status = status
  list[idx].statusHistory = [
    ...(list[idx].statusHistory || []),
    {
      status,
      timestamp: new Date().toISOString(),
      managerId,
      note: note || `Status changed to ${status}.`,
    },
  ]
  set(KEYS.APPLICATIONS, list)
  return list[idx]
}

// ── Reviews ───────────────────────────────────────────────────────────────────
// One review per (appId, communityId) pair — community managers rate a vendor
// in the context of their specific community relationship.
export function getReviews() {
  return get(KEYS.REVIEWS) || []
}

export function getReview(appId) {
  return getReviews().find((r) => r.appId === appId) || null
}

export function getReviewsForCommunity(communityId) {
  return getReviews().filter((r) => r.communityId === communityId)
}

export function saveReview({ appId, vendorId, communityId, managerId, rating, review }) {
  const reviews = getReviews()
  const idx = reviews.findIndex((r) => r.appId === appId)
  const now = new Date().toISOString()
  if (idx >= 0) {
    reviews[idx] = { ...reviews[idx], rating, review, managerId, updatedAt: now }
  } else {
    reviews.push({ id: uuidv4(), appId, vendorId, communityId, managerId, rating, review, createdAt: now, updatedAt: now })
  }
  set(KEYS.REVIEWS, reviews)
  return reviews.find((r) => r.appId === appId)
}

// ── Company Profiles ──────────────────────────────────────────────────────────
export function getCompanyProfile(userId) {
  const list = get(KEYS.COMPANY_PROFILES) || []
  return list.find((p) => p.userId === userId) || null
}

export function saveCompanyProfile(profile) {
  const list = get(KEYS.COMPANY_PROFILES) || []
  const idx = list.findIndex((p) => p.userId === profile.userId)
  const record = { ...profile, updatedAt: new Date().toISOString() }
  if (idx >= 0) { list[idx] = record } else { list.push(record) }
  set(KEYS.COMPANY_PROFILES, list)
  return record
}

// ── Messages ──────────────────────────────────────────────────────────────────
export function getMessages() {
  return get(KEYS.MESSAGES) || []
}

export function getMessagesForVendor(vendorId) {
  return getMessages().filter((m) => m.vendorId === vendorId)
}

export function saveMessage(message) {
  const list = getMessages()
  list.unshift({ ...message, id: message.id || uuidv4(), sentAt: message.sentAt || new Date().toISOString() })
  set(KEYS.MESSAGES, list)
  return message
}

// ── Geo helpers ───────────────────────────────────────────────────────────────
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8 // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
