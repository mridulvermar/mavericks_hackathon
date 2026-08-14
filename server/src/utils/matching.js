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

/**
 * Calculates Haversine distance in kilometers between two lat/lng points.
 * Structured so a Google Maps Distance Matrix API call can easily drop in later.
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
  return Math.round(dist * 10) / 10 // Round to 1 decimal place
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
 * Main matching function that scores an opportunity against a user profile.
 * Returns matchPercent and human-readable reason.
 */
export function scoreOpportunity(opportunity, user = {}) {
  const userSkills = (user.skills || ['Cooking', 'Tailoring', 'Handicrafts', 'Teaching']).map(s => s.toLowerCase())
  const userCity = user.city || 'Chennai'
  const userLanguages = (user.languages || ['Tamil', 'English']).map(l => l.toLowerCase())

  const oppSkills = (opportunity.skills || [opportunity.category || 'General']).map(s => s.toLowerCase())
  const oppCity = opportunity.city || opportunity.location || 'Chennai'
  const oppLanguages = (opportunity.languages || ['Tamil', 'English']).map(l => l.toLowerCase())

  // 1. Skill Match
  const matchingSkills = userSkills.filter(s =>
    oppSkills.some(os => os.includes(s) || s.includes(os)) ||
    (opportunity.title && opportunity.title.toLowerCase().includes(s)) ||
    (opportunity.category && opportunity.category.toLowerCase().includes(s))
  )
  const skillScore = matchingSkills.length > 0 ? 50 : 20

  // 2. Location & Distance Match
  const userCoords = user.coordinates || getCoordinates(userCity)
  const oppCoords = opportunity.coordinates || getCoordinates(oppCity)
  
  let distanceKm = 3.2
  let sameCity = false
  if (userCity.toLowerCase() === oppCity.toLowerCase() || opportunity.location?.toLowerCase().includes(userCity.toLowerCase())) {
    sameCity = true
    distanceKm = Math.floor(Math.random() * 4) + 1.5 // 1.5 km - 5 km
  } else {
    distanceKm = calculateDistance(userCoords, oppCoords)
  }

  let locationScore = 40
  if (sameCity || distanceKm <= 10) {
    locationScore = 40
  } else if (distanceKm <= 50) {
    locationScore = 25
  } else {
    locationScore = 15
  }

  // 3. Language Match
  const langMatch = userLanguages.some(l => oppLanguages.includes(l))
  const langScore = langMatch ? 10 : 5

  // Total Score (out of 100)
  const rawScore = skillScore + locationScore + langScore
  const matchPercent = Math.min(98, Math.max(65, rawScore))

  // Human Readable Reason Generator
  let reason = ''
  const skillName = matchingSkills.length > 0 ? matchingSkills[0] : (userSkills[0] || 'your profile')
  const capitalizedSkill = skillName.charAt(0).toUpperCase() + skillName.slice(1)

  if (sameCity && matchingSkills.length > 0) {
    reason = `Recommended because you have ${capitalizedSkill} experience and this customer is ${distanceKm} km away in ${oppCity}.`
  } else if (matchingSkills.length > 0) {
    reason = `Recommended because your ${capitalizedSkill} background matches this requirement.`
  } else if (sameCity) {
    reason = `Recommended because this opportunity is nearby in ${oppCity} (${distanceKm} km away).`
  } else {
    reason = `Recommended based on your wisdom and verified skills.`
  }

  return {
    ...opportunity,
    matchPercent,
    matchReason: reason,
    distanceKm,
    distanceText: `${distanceKm} km away`,
  }
}
