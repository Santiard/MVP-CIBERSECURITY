import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba de carga
export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Ramp-up: 0 → 20 usuarios en 2 min
    { duration: '5m', target: 50 },   // Ramp-up: 20 → 50 usuarios en 5 min
    { duration: '5m', target: 50 },   // Stay: 50 usuarios por 5 min
    { duration: '2m', target: 0 },    // Ramp-down: 50 → 0 usuarios en 2 min
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.1'],                    // Menos del 10% de errores
  },
  ext: {
    loadimpact: {
      projectID: 3123621,
      name: 'Load Test - MVP CIBERSECURITY Backend'
    }
  }
};

// Credenciales de prueba
const BASE_URL = 'http://localhost:8000';

// Datos de prueba para registro
function generateRandomEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `testuser_${timestamp}_${random}@test.local`;
}

// Test de Login
function testLogin() {
  const loginPayload = JSON.stringify({
    email: 'admin@example.com',
    password: 'Admin123!@'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${BASE_URL}/auth/token`, loginPayload, params);
  
  check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => r.json('access_token') !== null,
    'login response has user_id': (r) => r.json('user_id') !== null,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });

  return response.json('access_token');
}

// Test de Registro
function testRegister() {
  const email = generateRandomEmail();
  const registerPayload = JSON.stringify({
    email: email,
    name: 'Test User ' + Math.floor(Math.random() * 10000),
    password: 'TestPass123!@',
    phone: '+34912345678'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${BASE_URL}/auth/register`, registerPayload, params);
  
  check(response, {
    'register status is 200': (r) => r.status === 200 || r.status === 409,
    'register response has token': (r) => r.json('access_token') !== null || r.status === 409,
    'register response time < 800ms': (r) => r.timings.duration < 800,
  });

  return response.json('access_token');
}

// Test de Evaluaciones (Dashboard)
function testGetEvaluations(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const response = http.get(`${BASE_URL}/evaluations`, params);
  
  check(response, {
    'get evaluations status is 200': (r) => r.status === 200,
    'get evaluations response time < 500ms': (r) => r.timings.duration < 500,
    'get evaluations returns array': (r) => Array.isArray(r.json()),
  });
}

// Test de Organizaciones
function testGetOrganizations(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const response = http.get(`${BASE_URL}/organizations`, params);
  
  check(response, {
    'get organizations status is 200': (r) => r.status === 200,
    'get organizations response time < 500ms': (r) => r.timings.duration < 500,
    'get organizations returns array': (r) => Array.isArray(r.json()),
  });
}

// Test de Health Check
function testHealth() {
  const response = http.get(`${BASE_URL}/health`);
  
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
}

// Main execution
export default function () {
  // Test de Health
  testHealth();
  sleep(1);

  // Test de Login
  const loginToken = testLogin();
  sleep(1);

  // Test de Registro (con email único)
  const registerToken = testRegister();
  sleep(1);

  // Test de Evaluaciones con token de login
  if (loginToken) {
    testGetEvaluations(loginToken);
    sleep(1);
  }

  // Test de Organizaciones
  if (loginToken) {
    testGetOrganizations(loginToken);
    sleep(1);
  }

  // Test adicional de Evaluaciones
  if (registerToken) {
    testGetEvaluations(registerToken);
    sleep(1);
  }
}
