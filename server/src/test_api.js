import axios from 'axios'

async function runTest() {
  const baseURL = 'http://localhost:5050/api'
  console.log('Logging in...')
  
  try {
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      phone: '9876543210',
      password: 'password123'
    })
    
    const token = loginRes.data.token
    console.log('Login successful. Token:', token ? 'Exists' : 'Missing')
    console.log('User:', loginRes.data.user)
    
    console.log('\nFetching current profile...')
    const getRes1 = await axios.get(`${baseURL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('Current preferredLanguage in DB:', getRes1.data.user.preferredLanguage)
    
    console.log('\nPatching preferredLanguage to "தமிழ் (Tamil)"...')
    const patchRes = await axios.patch(`${baseURL}/users/me`, 
      { preferredLanguage: 'தமிழ் (Tamil)' },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    console.log('Patch response success:', patchRes.data.success)
    console.log('Patch response user:', patchRes.data.user)
    
    console.log('\nRe-fetching profile...')
    const getRes2 = await axios.get(`${baseURL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    console.log('PreferredLanguage in DB after patch:', getRes2.data.user.preferredLanguage)
  } catch (err) {
    console.error('Test failed with error:', err.response ? err.response.data : err.message)
  }
}

runTest()
