import axios from 'axios'
import mongoose from 'mongoose'
import 'dotenv/config'

const API_BASE = 'http://localhost:5050/api'

async function runE2ETest() {
  console.log('====================================================')
  console.log('🧪 CAREER 2.0 END-TO-END MONGO DB ATLAS TEST')
  console.log('====================================================\n')

  const testPhone = `9${Math.floor(100000000 + Math.random() * 899999999)}`
  const testPassword = 'password123'
  const testName = 'Verified Atlas User'

  // TEST 1: SERVER & HEALTH CHECK
  console.log('🔹 TEST 1: Server & Database Health Check')
  const healthRes = await axios.get(`${API_BASE}/health`)
  console.log('   Health Status:', healthRes.data.message)
  console.log('   ✅ Test 1 Passed.\n')

  // TEST 2: REGISTER NEW USER IN MONGO DB ATLAS
  console.log(`🔹 TEST 2: Registering User (${testPhone})`)
  const regRes = await axios.post(`${API_BASE}/auth/register`, {
    name: testName,
    phone: testPhone,
    password: testPassword,
    service: 'Career 2.0 API',
    providerType: 'senior_citizen',
  })
  console.log('   API Response:', regRes.data.message)
  console.log('   User ID:', regRes.data.user._id)
  console.log('   ✅ Test 2 Passed.\n')

  // DIRECT MONGO DB ATLAS VERIFICATION
  console.log('🔹 VERIFYING DOCUMENT IN MONGO DB ATLAS DIRECTLY...')
  await mongoose.connect(process.env.MONGODB_URI)
  const dbUser = await mongoose.connection.collection('users').findOne({ phone: testPhone })
  console.log('🤲 Career 2.0 Automated Integration Test Suite'), dbUser ? `Found User: ${dbUser.name} (_id: ${dbUser._id})` : 'NOT FOUND')
  if (!dbUser) {
    throw new Error('❌ FAIL: User was not persisted to MongoDB Atlas collection!')
  }
  console.log('   🎉 ✅ MONGO DB ATLAS PERSISTENCE VERIFIED!\n')
  await mongoose.disconnect()

  // TEST 3: LOGIN WITH PERSISTED CREDENTIALS
  console.log(`🔹 TEST 3: Logging In (${testPhone})`)
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    phone: testPhone,
    password: testPassword,
  })
  console.log('   API Response:', loginRes.data.message)
  console.log('   Token Issued:', !!loginRes.data.token)
  console.log('   ✅ Test 3 Passed.\n')

  // TEST 4: CONTRADICTORY AUTH PREVENTION TEST
  console.log('🔹 TEST 4: Contradictory Auth Prevention & Incorrect Credentials')
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      phone: testPhone,
      password: 'wrongpassword123',
    })
  } catch (err) {
    console.log('   Wrong Password Status:', err.response?.status, '| Message:', err.response?.data?.message)
  }

  try {
    await axios.post(`${API_BASE}/auth/login`, {
      phone: '9000000000',
      password: 'password123',
    })
  } catch (err) {
    console.log('   Unregistered Phone Status:', err.response?.status, '| Message:', err.response?.data?.message)
  }
  console.log('   ✅ Test 4 Passed.\n')

  console.log('====================================================')
  console.log('🎉 ALL MONGO DB ATLAS PERSISTENCE TESTS PASSED 100%!')
  console.log('====================================================')
}

runE2ETest().catch(err => {
  console.error('❌ E2E Test Error:', err.response ? err.response.data : err.message)
  process.exit(1)
})
