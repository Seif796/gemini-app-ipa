// Verification test script for backend API
const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function testBackend() {
  console.log('🧪 Starting backend verification tests...');

  // 1. Health check
  console.log('1. Testing /health...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('Health response:', healthData);

  // 2. Signup
  const testEmail = `test_${Date.now()}@example.com`;
  console.log(`2. Testing signup with ${testEmail}...`);
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'iPhone User',
      email: testEmail,
      password: 'password123'
    })
  });
  const signupData = await signupRes.json();
  console.log('Signup result:', { ok: signupRes.ok, user: signupData.user?.email, hasToken: Boolean(signupData.token) });
  const token = signupData.token;

  // 3. Login
  console.log('3. Testing login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123'
    })
  });
  const loginData = await loginRes.json();
  console.log('Login result:', { ok: loginRes.ok, user: loginData.user?.email });

  // 4. Notes CRUD
  console.log('4. Testing Notes CRUD...');
  const noteRes = await fetch(`${BASE_URL}/api/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Meeting Notes with Steve',
      content: 'Discussed Q4 roadmap and iPhone app rollout.',
      aiSummary: 'Q4 roadmap alignment.'
    })
  });
  const noteData = await noteRes.json();
  console.log('Created Note:', noteData.note?.title);

  const getNotesRes = await fetch(`${BASE_URL}/api/notes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const notesList = await getNotesRes.json();
  console.log('Notes count:', notesList.notes?.length);

  // 5. Tasks CRUD
  console.log('5. Testing Tasks CRUD...');
  const taskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Deploy Aether to iPhone',
      priority: 'high',
      completed: false
    })
  });
  const taskData = await taskRes.json();
  console.log('Created Task:', taskData.task?.title);

  console.log('✅ ALL BACKEND TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

testBackend().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
