import mongoose from 'mongoose'
import 'dotenv/config'
import User from './models/User.js'
import Opportunity from './models/Opportunity.js'
import Product from './models/Product.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/silverhands'

export const demoUsers = [
  {
    name: 'Priya Raman',
    phone: '1234567890',
    password: '123456',
    role: 'job_provider',
    city: 'Chennai',
    state: 'Tamil Nadu',
    skills: ['Hiring', 'Cooking Trainer', 'Event Management'],
    languages: ['Tamil', 'English', 'Hindi'],
    bio: 'Local business owner and job provider looking to hire skilled senior citizens and homemakers.',
    rating: 5.0,
    totalReviews: 24,
    totalEarnings: 0,
    isVerified: true,
    onboardingComplete: true,
  },
  {
    name: 'Lakshmi Ammal',
    phone: '8667415174',
    password: '123456',
    role: 'provider',
    providerType: 'senior_citizen',
    city: 'Chennai',
    state: 'Tamil Nadu',
    skills: ['Cooking', 'Catering', 'Pickle Making', 'South Indian Recipes'],
    languages: ['Tamil', 'English'],
    bio: '15 years of experience in traditional South Indian home cooking and authentic homemade pickles.',
    rating: 4.9,
    totalReviews: 42,
    totalEarnings: 18500,
    isVerified: true,
    onboardingComplete: true,
  },
  {
    name: 'Meenakshi Sundaram',
    phone: '9876543211',
    password: 'password123',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    skills: ['Tailoring', 'Embroidery', 'Blouse Stitching', 'Dress Alteration'],
    languages: ['Tamil'],
    bio: 'Expert tailor specializing in Aari embroidery, custom blouse designs, and festive wear.',
    rating: 4.8,
    totalReviews: 35,
    totalEarnings: 15200,
    isVerified: true,
    onboardingComplete: true,
  },
  {
    name: 'Saraswathi Devi',
    phone: '9876543212',
    password: 'password123',
    city: 'Madurai',
    state: 'Tamil Nadu',
    skills: ['Handicrafts', 'Terracotta Diyas', 'Puja Items', 'Painting'],
    languages: ['Tamil'],
    bio: 'Artisan crafting authentic terracotta lamps, handmade puja accessories, and traditional decor.',
    rating: 4.9,
    totalReviews: 29,
    totalEarnings: 12800,
    isVerified: true,
    onboardingComplete: true,
  },
  {
    name: 'Ravi Kumar',
    phone: '9876543213',
    password: 'password123',
    city: 'Chennai',
    state: 'Tamil Nadu',
    skills: ['Maths Tutor', 'Physics', 'Exam Prep', 'Teaching'],
    languages: ['Tamil', 'English'],
    bio: 'Retired high school mathematics teacher with 25+ years of passion for mentoring students.',
    rating: 5.0,
    totalReviews: 50,
    totalEarnings: 22000,
    isVerified: true,
    onboardingComplete: true,
  },
]

export const demoOpportunities = [
  {
    title: 'Home Cooking Instructor for Small Family',
    category: 'Cooking',
    description: 'Looking for an experienced home cook to teach traditional South Indian dishes to our family 2 weekends a month in T. Nagar.',
    requirements: ['Mastery of South Indian vegetarian recipes', 'Patience & hygiene focused', 'Available Saturday mornings'],
    skills: ['Cooking', 'Catering'],
    languages: ['Tamil', 'English'],
    pay: '₹600/session',
    payNote: 'Estimated pay based on market rates',
    location: 'T. Nagar, Chennai',
    city: 'Chennai',
    coordinates: { lat: 13.0418, lng: 80.2341 },
    type: 'Part-time',
    clientName: 'Priya Raman',
    clientVerified: true,
    urgent: true,
    posted: '2 hours ago',
  },
  {
    title: 'Custom Saree Blouse Stitching & Embroidery Order',
    category: 'Tailoring',
    description: 'Require expert tailor for stitching 5 bridal silk blouses with intricate Aari embroidery work.',
    requirements: ['Proven experience in silk blouse fitting', 'Aari needle work skills', 'Delivery within 10 days'],
    skills: ['Tailoring', 'Embroidery', 'Blouse Stitching'],
    languages: ['Tamil'],
    pay: '₹1,200/piece',
    payNote: 'Materials provided by client',
    location: 'RS Puram, Coimbatore',
    city: 'Coimbatore',
    coordinates: { lat: 11.0084, lng: 76.9492 },
    type: 'Freelance',
    clientName: 'Kavitha Swaminathan',
    clientVerified: true,
    urgent: true,
    posted: '5 hours ago',
  },
  {
    title: 'Handmade Terracotta Diyas Stall for Temple Festival',
    category: 'Handicrafts',
    description: 'Looking for artisan to supply 200 hand-painted clay diyas and manage a festive handicrafts stall at Madurai temple complex.',
    requirements: ['Terracotta molding or painting background', 'Friendly customer interaction'],
    skills: ['Handicrafts', 'Terracotta Diyas'],
    languages: ['Tamil'],
    pay: '₹800/day',
    payNote: 'Food & transport allowance included',
    location: 'Meenakshi Temple Area, Madurai',
    city: 'Madurai',
    coordinates: { lat: 9.9195, lng: 78.1193 },
    type: 'Flexible',
    clientName: 'Madurai Heritage Guild',
    clientVerified: true,
    urgent: false,
    posted: '1 day ago',
  },
  {
    title: 'Class 10 CBSE Board Maths Tutor Needed',
    category: 'Teaching',
    description: 'Looking for a patient Maths tutor for a 10th standard student to help prepare for upcoming board exams.',
    requirements: ['Clear concept clarity in Algebra & Geometry', '2 hours/day (3 days a week)', 'Evening slot'],
    skills: ['Maths Tutor', 'Teaching'],
    languages: ['Tamil', 'English'],
    pay: '₹500/hour',
    payNote: 'Monthly payout negotiable',
    location: 'Adyar, Chennai',
    city: 'Chennai',
    coordinates: { lat: 13.0067, lng: 80.2570 },
    type: 'Part-time',
    clientName: 'Suresh Narayanan',
    clientVerified: true,
    urgent: false,
    posted: 'Yesterday',
  },
  {
    title: 'Weekend Breakfast Catering for 20 Guests',
    category: 'Cooking',
    description: 'Need authentic homemade Idli, Vada, Sambar & Chutney catering for a housewarming function in Velachery.',
    requirements: ['Strictly home-hygiene standards', 'Timely delivery by 7:30 AM'],
    skills: ['Cooking', 'Catering'],
    languages: ['Tamil'],
    pay: '₹3,500 total',
    payNote: 'Includes raw material cost',
    location: 'Velachery, Chennai',
    city: 'Chennai',
    coordinates: { lat: 12.9815, lng: 80.2180 },
    type: 'Freelance',
    clientName: 'Deepak V',
    clientVerified: false,
    urgent: true,
    posted: '3 hours ago',
  },
]

export const demoProducts = [
  // Products
  {
    name: 'Homemade Mango Avakkai Pickle (500g)',
    itemType: 'product',
    category: 'Food',
    seller: 'Lakshmi Ammal',
    sellerVerified: true,
    price: '₹250',
    location: 'Chennai, Tamil Nadu',
    city: 'Chennai',
    rating: 4.9,
    reviews: 38,
    emoji: '🫙',
    description: 'Authentic traditional South Indian mango pickle made with sun-dried mangoes, cold-pressed sesame oil, and freshly ground spices. Zero chemical preservatives.',
    highlights: ['100% Homemade', 'Cold-pressed Oil', 'Traditional Recipe', 'Ships in 24 hrs'],
    inStock: true,
    badge: 'Best Seller',
  },
  {
    name: 'Hand-embroidered Silk Cushion Cover',
    itemType: 'product',
    category: 'Craft',
    seller: 'Meenakshi Sundaram',
    sellerVerified: true,
    price: '₹450',
    location: 'Coimbatore, Tamil Nadu',
    city: 'Coimbatore',
    rating: 4.8,
    reviews: 24,
    emoji: '🪡',
    description: 'Handcrafted raw silk cushion cover featuring intricate Aari threadwork and peacock motifs. Zipper closure at back.',
    highlights: ['Handmade Aari Work', 'Pure Raw Silk', 'Machine Washable', 'Custom Colors Available'],
    inStock: true,
    badge: 'Artisan Choice',
  },
  {
    name: 'Hand-painted Terracotta Clay Diyas (Set of 12)',
    itemType: 'product',
    category: 'Decor',
    seller: 'Saraswathi Devi',
    sellerVerified: true,
    price: '₹320',
    location: 'Madurai, Tamil Nadu',
    city: 'Madurai',
    rating: 5.0,
    reviews: 45,
    emoji: '🪔',
    description: 'Eco-friendly terracotta earthen lamps hand-painted with vibrant organic colors and gold glitter. Perfect for festivals and puja room decor.',
    highlights: ['Natural Clay', 'Eco-friendly Colors', 'Long Oil Capacity', 'Gift Packed'],
    inStock: true,
    badge: 'Top Rated',
  },
  {
    name: 'Pure Organic Cow Ghee (500ml)',
    itemType: 'product',
    category: 'Food',
    seller: 'Lakshmi Ammal',
    sellerVerified: true,
    price: '₹480',
    location: 'Chennai, Tamil Nadu',
    city: 'Chennai',
    rating: 4.9,
    reviews: 52,
    emoji: '🥛',
    description: 'Freshly churned cultured A2 cow ghee prepared using the traditional Bilona method. Rich aroma and granular texture.',
    highlights: ['Bilona Method', 'Lab Tested Pure', 'Grass-fed Cows', 'Rich Aroma'],
    inStock: true,
    badge: 'Popular',
  },

  // Services
  {
    name: 'Traditional South Indian Catering Service',
    itemType: 'service',
    category: 'Cooking',
    seller: 'Lakshmi Ammal',
    sellerVerified: true,
    price: '₹500/meal',
    location: 'Chennai, Tamil Nadu',
    city: 'Chennai',
    rating: 4.9,
    reviews: 60,
    emoji: '🍲',
    description: 'Authentic home-cooked meals catered for small gatherings, pujas, and private family dinners (10–30 guests). Custom menus available.',
    highlights: ['Fresh Pure Veg', 'Hygienic Home Kitchen', 'Custom Spice Level', 'Banana Leaf Option'],
    inStock: true,
    badge: 'Top Provider',
  },
  {
    name: 'Custom Blouse Design & Tailoring Service',
    itemType: 'service',
    category: 'Tailoring',
    seller: 'Meenakshi Sundaram',
    sellerVerified: true,
    price: '₹600/stitch',
    location: 'Coimbatore, Tamil Nadu',
    city: 'Coimbatore',
    rating: 4.8,
    reviews: 31,
    emoji: '👗',
    description: 'Professional blouse tailoring service including measurement pickup, custom neckline designs, piping, and express 3-day turnaround.',
    highlights: ['Doorstep Measurement', 'Perfect Fitting Guarantee', 'Express Delivery', 'Pattern Alterations'],
    inStock: true,
    badge: 'Verified Specialist',
  },
  {
    name: '1-on-1 High School Mathematics Tutoring',
    itemType: 'service',
    category: 'Teaching',
    seller: 'Ravi Kumar',
    sellerVerified: true,
    price: '₹400/hour',
    location: 'Chennai, Tamil Nadu',
    city: 'Chennai',
    rating: 5.0,
    reviews: 48,
    emoji: '📐',
    description: 'Personalized online or home tuition for 8th to 12th CBSE/State Board students. Focus on problem solving and exam confidence.',
    highlights: ['25+ Yrs Experience', 'Flexible Timings', 'Regular Mock Tests', 'Personal Care'],
    inStock: true,
    badge: 'Master Educator',
  },
]

async function seedDB() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB for seeding...')

    // Clear existing collections
    await User.deleteMany({})
    await Opportunity.deleteMany({})
    await Product.deleteMany({})
    console.log('🧹 Cleaned previous database entries.')

    // Insert Users
    const createdUsers = await User.insertMany(demoUsers)
    console.log(`👤 Seeded ${createdUsers.length} Users (Lakshmi, Meenakshi, Saraswathi, Ravi).`)

    // Link users to opportunities & products
    const lakshmi = createdUsers.find(u => u.name.includes('Lakshmi'))
    const meenakshi = createdUsers.find(u => u.name.includes('Meenakshi'))
    const saraswathi = createdUsers.find(u => u.name.includes('Saraswathi'))
    const ravi = createdUsers.find(u => u.name.includes('Ravi'))

    const opportunitiesWithRefs = demoOpportunities.map(opp => {
      let postedBy = lakshmi._id
      if (opp.city === 'Coimbatore') postedBy = meenakshi._id
      if (opp.city === 'Madurai') postedBy = saraswathi._id
      return { ...opp, postedBy }
    })
    const createdOpps = await Opportunity.insertMany(opportunitiesWithRefs)
    console.log(`💼 Seeded ${createdOpps.length} Opportunities.`)

    const productsWithRefs = demoProducts.map(prod => {
      let sellerId = lakshmi._id
      if (prod.seller.includes('Meenakshi')) sellerId = meenakshi._id
      if (prod.seller.includes('Saraswathi')) sellerId = saraswathi._id
      if (prod.seller.includes('Ravi')) sellerId = ravi._id
      return { ...prod, sellerId }
    })
    const createdProducts = await Product.insertMany(productsWithRefs)
    console.log(`🛒 Seeded ${createdProducts.length} Products/Services.`)

    console.log('🎉 Seeding completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

if (process.argv[1].endsWith('seed.js')) {
  seedDB()
}
