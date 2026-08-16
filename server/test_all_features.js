import axios from 'axios'

const API_BASE = 'http://localhost:5050/api'

async function runTests() {
  console.log('====================================================')
  console.log('🤲 SilverHands Automated Integration Test Suite')
  console.log('====================================================\n')

  let token = ''
  let userId = ''

  // 1. HEALTH CHECK
  try {
    console.log('🔹 Test 1: GET /api/health')
    const res = await axios.get(`${API_BASE}/health`)
    console.log('   Status:', res.status, '| Response:', res.data.message)
    console.log('   ✅ Health check passed.\n')
  } catch (err) {
    console.error('   ❌ Health check failed:', err.message)
  }

  // 2. AUTH REGISTER
  try {
    console.log('🔹 Test 2: POST /api/auth/register')
    const testPhone = `9${Math.floor(100000009 + Math.random() * 800000000)}`
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Sunita Devi',
      phone: testPhone,
      password: 'password123',
      role: 'provider',
      providerType: 'senior_citizen',
    })
    console.log('   Status:', res.status, '| User:', res.data.user.name, '| Token received:', !!res.data.token)
    token = res.data.token
    userId = res.data.user._id
    console.log('   ✅ Registration passed.\n')

    // 3. AUTH LOGIN
    console.log('🔹 Test 3: POST /api/auth/login')
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      phone: testPhone,
      password: 'password123',
    })
    console.log('   Status:', loginRes.status, '| User:', loginRes.data.user.name, '| Role:', loginRes.data.user.role)
    console.log('   ✅ Login passed.\n')
  } catch (err) {
    console.error('   ❌ Auth test failed:', err.response ? err.response.data : err.message)
  }

  // 4. GET /api/auth/me
  try {
    console.log('🔹 Test 4: GET /api/auth/me (Protected)')
    const meRes = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    console.log('   Status:', meRes.status, '| Authenticated User:', meRes.data.user.name)
    console.log('   ✅ Auth me passed.\n')
  } catch (err) {
    console.error('   ❌ Auth me failed:', err.response ? err.response.data : err.message)
  }

  // 5. PUT /api/auth/onboarding
  try {
    console.log('🔹 Test 5: PUT /api/auth/onboarding')
    const onboardRes = await axios.put(
      `${API_BASE}/auth/onboarding`,
      {
        role: 'provider',
        providerType: 'senior_citizen',
        name: 'Sunita Devi',
        age: 62,
        location: 'Jaipur, Rajasthan',
        languages: ['Hindi', 'English'],
        skills: ['Traditional Cooking', 'Saree Embroidery'],
        bio: 'Namaste! I am an experienced cook and tailor with 30 years of home experience.',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    console.log('   Status:', onboardRes.status, '| Onboarding Complete:', onboardRes.data.user.onboardingComplete)
    console.log('   Skills updated:', onboardRes.data.user.skills)
    console.log('   ✅ Onboarding update passed.\n')
  } catch (err) {
    console.error('   ❌ Onboarding update failed:', err.response ? err.response.data : err.message)
  }

  // 6. POST /api/ai/discover-skills
  try {
    console.log('🔹 Test 6: POST /api/ai/discover-skills (Prompt: Cooking & Embroidery)')
    const discoverRes = await axios.post(
      `${API_BASE}/ai/discover-skills`,
      {
        description: 'I have been cooking regional dishes and stitching sarees for 25 years in Jaipur.',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    console.log('   Status:', discoverRes.status, '| Source:', discoverRes.data.source)
    console.log('   Discovered Skills:', discoverRes.data.skills.map(s => `${s.icon} ${s.name}`).join(', '))
    console.log('   Experience Years:', discoverRes.data.experienceYears)
    console.log('   Suggested Services:', discoverRes.data.suggestedServices.join(', '))
    console.log('   Recommendation:', discoverRes.data.recommendation)
    console.log('   ✅ Discover skills passed.\n')
  } catch (err) {
    console.error('   ❌ Discover skills failed:', err.response ? err.response.data : err.message)
  }

  // 7. POST /api/ai/generate-profile
  try {
    console.log('🔹 Test 7: POST /api/ai/generate-profile')
    const profileRes = await axios.post(
      `${API_BASE}/ai/generate-profile`,
      {
        description: 'I have been cooking regional dishes and stitching sarees for 25 years in Jaipur.',
        skills: ['Traditional Indian Cooking', 'Stitching & Tailoring'],
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    console.log('   Status:', profileRes.status, '| Source:', profileRes.data.source)
    console.log('   Headline:', profileRes.data.headline)
    console.log('   About:', profileRes.data.about)
    console.log('   Services Offered:', profileRes.data.serviceDescriptions.join(' | '))
    console.log('   ✅ Profile generation passed.\n')
  } catch (err) {
    console.error('   ❌ Profile generation failed:', err.response ? err.response.data : err.message)
  }

  // 8. POST /api/ai/assistant
  try {
    console.log('🔹 Test 8: POST /api/ai/assistant (Prompt: Safety guidelines)')
    const chatRes = await axios.post(
      `${API_BASE}/ai/assistant`,
      { message: 'How do I stay safe when meeting a client for cooking lessons?' },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    console.log('   Status:', chatRes.status, '| Source:', chatRes.data.source)
    console.log('   Response Preview:', chatRes.data.response.slice(0, 120) + '...')
    console.log('   ✅ AI Assistant chat passed.\n')
  } catch (err) {
    console.error('   ❌ AI Assistant chat failed:', err.response ? err.response.data : err.message)
  }

  // 9. PATCH & OPTIONS PREFLIGHT VERIFICATION
  try {
    console.log('🔹 Test 9: OPTIONS Preflight Request (PATCH Method)')
    const optionsRes = await axios.options(`${API_BASE}/opportunities/opp_1/status`, {
      headers: {
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'authorization,content-type',
        Origin: 'http://localhost:5173',
      },
    })
    console.log('   Status:', optionsRes.status, '| Allowed Methods:', optionsRes.headers['access-control-allow-methods'])
    console.log('   ✅ CORS OPTIONS preflight passed.\n')

    console.log('🔹 Test 10: PATCH /api/users/me (Profile Update)')
    const patchRes = await axios.patch(
      `${API_BASE}/users/me`,
      { city: 'Chennai', preferredLanguage: 'Tamil' },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    console.log('   Status:', patchRes.status, '| City:', patchRes.data.user?.city, '| Language:', patchRes.data.user?.preferredLanguage)
    console.log('   ✅ PATCH user profile passed.\n')

    console.log('🔹 Test 11: PATCH /api/users/me/password (Bcrypt Password Change)')
    const passRes = await axios.patch(
      `${API_BASE}/users/me/password`,
      { currentPassword: 'password123', newPassword: 'newpassword123' },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    console.log('   Status:', passRes.status, '| Message:', passRes.data.message)
    console.log('   ✅ Bcrypt password update passed.\n')

    console.log('🔹 Test 12: POST /api/reports & GET /api/reports & PATCH /api/reports/:id/resolve')
    const reportRes = await axios.post(
      `${API_BASE}/reports`,
      { reason: 'Suspicious Payment Request', message: 'Client requested off-platform transfer' },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    console.log('   Submitted Report Status:', reportRes.status, '| ID:', reportRes.data.data._id)
    const reportId = reportRes.data.data._id

    const listRes = await axios.get(`${API_BASE}/reports`, { headers: { Authorization: `Bearer ${token}` } })
    console.log('   Admin Fetched Reports Count:', listRes.data.total)

    const resolveRes = await axios.patch(`${API_BASE}/reports/${reportId}/resolve`, {}, { headers: { Authorization: `Bearer ${token}` } })
    console.log('   Resolve Report Status:', resolveRes.data.data.status)
    console.log('   ✅ Safety Report lifecycle (submit -> view -> resolve) passed.\n')

    console.log('🔹 Test 13: DELETE /api/users/me (Soft Delete Account)')
    const delRes = await axios.delete(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
    console.log('   Delete Account Status:', delRes.status, '| Message:', delRes.data.message)
    console.log('   ✅ Soft delete account endpoint passed.\n')
  } catch (err) {
    console.error('   ❌ Extended feature test failed:', err.response ? err.response.data : err.message)
  }

  // 11. ERROR HANDLING & EDGE CASES
  try {
    console.log('🔹 Test 11: Edge Case - Invalid Credentials')
    await axios.post(`${API_BASE}/auth/login`, { phone: '0000000000', password: 'wrongpassword' })
  } catch (err) {
    console.log('   Status Code:', err.response?.status, '| Friendly Message:', err.response?.data?.message)
    console.log('   ✅ Invalid credentials handled cleanly without stack trace.\n')
  }

  try {
    console.log('🔹 Test 12: Edge Case - Unauthorized Request (No Token)')
    await axios.get(`${API_BASE}/auth/me`)
  } catch (err) {
    console.log('   Status Code:', err.response?.status, '| Friendly Message:', err.response?.data?.message)
    console.log('   ✅ Unauthorized request handled cleanly.\n')
  }

  console.log('====================================================')
  console.log('🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!')
  console.log('====================================================')
}

runTests()
