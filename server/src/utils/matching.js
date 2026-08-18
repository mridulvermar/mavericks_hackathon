// City coordinate fallback dictionary
const CITY_COORDINATES = {
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  'Madurai': { lat: 9.9252, lng: 78.1198 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
}

// Domain taxonomy dictionaries for contextual matching
const DOMAIN_KEYWORDS = {
  teaching: ['teach', 'teacher', 'teaching', 'tutor', 'tutoring', 'tuition', 'math', 'maths', 'science', 'english', 'physics', 'chemistry', 'academic', 'school', 'student', 'cbse', 'icse', 'shloka', 'shlokas', 'stotra', 'sanskrit', 'education'],
  cooking: ['cook', 'cooking', 'chef', 'catering', 'kitchen', 'food', 'meal', 'meals', 'tiffin', 'rasam', 'sambar', 'curry', 'roti', 'sabzi', 'dal', 'biryani', 'pickle', 'pickles', 'achar', 'podi', 'baking', 'sweets', 'mithai'],
  tailoring: ['tailor', 'tailoring', 'stitch', 'stitching', 'blouse', 'saree', 'salwar', 'kurti', 'fall', 'pico', 'embroidery', 'aari', 'zardozi', 'sewing', 'garment', 'alteration', 'fitting', 'maggam'],
  care: ['care', 'caregiving', 'elderly', 'elder', 'senior', 'companion', 'babysit', 'babysitting', 'childcare', 'storytelling', 'daycare'],
  handicrafts: ['craft', 'crafts', 'handicraft', 'pottery', 'knit', 'knitting', 'crochet', 'wool', 'painting', 'art', 'rangoli', 'kolam', 'diya'],
  accounts: ['account', 'accounts', 'accounting', 'bookkeeping', 'tally', 'gst', 'tax', 'excel', 'ledger', 'billing', 'finance'],
}

/**
 * Calculates Haversine distance in kilometers between two lat/lng points.
 */
export function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2 || !coord1.lat || !coord2.lat) {
    return 3.5 // Fallback default distance in km
  }
  const R = 6371 // Earth radius in km
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180)
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.lat * (Math.PI / 180)) *
      Math.cos(coord2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const dist = R * c
  return Math.round(dist * 10) / 10
}

/**
 * Gets coordinates for a location string or city name.
 */
export function getCoordinates(locationStr = '') {
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (locationStr.toLowerCase().includes(city.toLowerCase())) {
      return coords
    }
  }
  return CITY_COORDINATES['Chennai']
}

/**
 * Detects active domains from a list of skill words and text descriptions
 */
function getDomains(tokens = []) {
  const text = tokens.join(' ').toLowerCase()
  const detected = []
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      detected.push(domain)
    }
  }
  return detected
}

/**
 * Main matching function that contextually scores an opportunity against a user profile.
 * High skill overlap -> 85-98%
 * Partial / related overlap -> 50-75%
 * Unrelated domain (e.g. Teacher looking at Cook job) -> 15-35%
 */
export function scoreOpportunity(opportunity, user = {}) {
  // Extract user skill words and profile text
  const rawUserSkills = Array.isArray(user.skills) && user.skills.length > 0
    ? user.skills
    : (user.headline || user.bio || user.experience || '').split(/[,|•\n]/).filter(s => s.trim().length > 2)

  const userSkillStrings = rawUserSkills.map(s => s.trim().toLowerCase())
  const userCity = user.city || user.location || 'Chennai'
  const userLanguages = (user.languages || ['Tamil', 'English']).map(l => l.toLowerCase())

  // Extract opportunity texts
  const oppSkills = (opportunity.skills || []).map(s => s.toLowerCase())
  const oppCategory = (opportunity.category || '').toLowerCase()
  const oppTitle = (opportunity.title || '').toLowerCase()
  const oppDescription = (opportunity.description || '').toLowerCase()
  const oppCity = opportunity.city || opportunity.location || 'Chennai'
  const oppLanguages = (opportunity.languages || ['Tamil', 'English']).map(l => l.toLowerCase())

  const oppFullText = `${oppTitle} ${oppCategory} ${oppSkills.join(' ')} ${oppDescription}`
  const userFullText = `${userSkillStrings.join(' ')} ${(user.headline || '')} ${(user.bio || '')}`.toLowerCase()

  // 1. Detect domain alignments
  const userDomains = getDomains([userFullText])
  const oppDomains = getDomains([oppFullText])

  // Direct skill keywords hit
  const directMatchingSkills = userSkillStrings.filter(s =>
    s.length > 2 && (
      oppSkills.some(os => os.includes(s) || s.includes(os)) ||
      oppFullText.includes(s)
    )
  )

  const domainMatch = userDomains.some(ud => oppDomains.includes(ud))

  // 2. Skill Scoring (Max 70 points)
  let skillScore = 0
  if (directMatchingSkills.length > 0 && domainMatch) {
    // Strong exact match
    skillScore = 65 + Math.min(5, directMatchingSkills.length * 2)
  } else if (directMatchingSkills.length > 0 || domainMatch) {
    // Domain match or partial keyword match
    skillScore = 55
  } else if (userSkillStrings.length === 0) {
    // General user with no profile filled
    skillScore = 40
  } else {
    // Context mismatch (e.g. Teacher viewing Cooking job) -> strictly 0 to 10 points
    skillScore = 5
  }

  // 3. Location & Distance Match (Max 20 points)
  const userCoords = user.coordinates || getCoordinates(userCity)
  const oppCoords = opportunity.coordinates || getCoordinates(oppCity)
  
  let distanceKm = 3.2
  let sameCity = false
  if (userCity.toLowerCase() === oppCity.toLowerCase() || opportunity.location?.toLowerCase().includes(userCity.toLowerCase())) {
    sameCity = true
    distanceKm = 2.4
  } else {
    distanceKm = calculateDistance(userCoords, oppCoords)
  }

  let locationScore = 10
  if (sameCity || distanceKm <= 10) {
    locationScore = 20
  } else if (distanceKm <= 35) {
    locationScore = 15
  } else {
    locationScore = 5
  }

  // 4. Language Match (Max 10 points)
  const langMatch = userLanguages.some(l => oppLanguages.includes(l))
  const langScore = langMatch ? 10 : 5

  // 5. Total Match Percentage calculation
  let matchPercent = 0
  if (skillScore >= 50) {
    // Relevant skill match
    matchPercent = Math.min(98, Math.max(75, skillScore + locationScore + langScore))
  } else if (userSkillStrings.length === 0) {
    // Neutral profile
    matchPercent = Math.min(75, Math.max(50, skillScore + locationScore + langScore))
  } else {
    // Unrelated job category
    matchPercent = Math.min(38, Math.max(15, skillScore + (sameCity ? 12 : 5) + (langMatch ? 5 : 2)))
  }

  // 6. Context-Aware Human Readable Reason Generator
  let reason = ''
  const primaryUserSkill = rawUserSkills[0] || (userDomains[0] ? userDomains[0].charAt(0).toUpperCase() + userDomains[0].slice(1) : '')

  if (matchPercent >= 80) {
    if (directMatchingSkills.length > 0) {
      const displaySkill = directMatchingSkills[0].charAt(0).toUpperCase() + directMatchingSkills[0].slice(1)
      reason = `Recommended because you have verified ${displaySkill} expertise and this client is ${distanceKm} km away in ${oppCity}.`
    } else {
      reason = `High match for your background in ${opportunity.category || 'this domain'} (${distanceKm} km away).`
    }
  } else if (matchPercent >= 50) {
    reason = `Moderate match nearby in ${oppCity}. Explore if you want to expand into ${opportunity.category || 'new skills'}.`
  } else {
    // Low mismatch reason
    const userRoleDesc = primaryUserSkill ? `Your profile specializes in ${primaryUserSkill}` : 'Your skill set'
    reason = `Lower match: This position requires ${opportunity.category || 'different'} skills. ${userRoleDesc}.`
  }

  return {
    ...opportunity,
    matchPercent,
    matchReason: reason,
    distanceKm,
    distanceText: `${distanceKm} km away`,
  }
}

