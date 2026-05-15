import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de prueba de estrés
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Fase 1: 50 usuarios
    { duration: '3m', target: 50 },   // Estable en 50
    
    { duration: '2m', target: 100 },  // Fase 2: 100 usuarios
    { duration: '3m', target: 100 },  // Estable en 100
    
    { duration: '2m', target: 200 },  // Fase 3: 200 usuarios
    { duration: '3m', target: 200 },  // Estable en 200
    
    { duration: '2m', target: 300 },  // Fase 4: 300 usuarios (máximo estrés)
    { duration: '3m', target: 300 },  // Estable en 300
    
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // Umbrales más relajados para estrés
    http_req_failed: ['rate<0.2'],                    // Aceptar hasta 20% de errores
  },
  ext: {
    loadimpact: {
      projectID: 3123621,
      name: 'Stress Test - MVP CIBERSECURITY Backend'
    }
  }
};

const BASE_URL = 'http://localhost:8000';

// Contador global para estadísticas
let errorCount = 0;
let successCount = 0;
let requestCount = 0;

// Datos de prueba
function generateRandomEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return `stresstest_${timestamp}_${random}@test.local`;
}

// Test de Autenticación con retry
function testAuthWithRetry() {
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
  requestCount++;
  
  const checks = check(response, {
    'auth status 200 or 401': (r) => r.status === 200 || r.status === 401,
    'auth response time < 1500ms': (r) => r.timings.duration < 1500,
    'auth has token (success)': (r) => r.status === 200 && r.json('access_token') !== null,
  });

  if (response.status === 200) {
    successCount++;
  } else {
    errorCount++;
  }

  return response.json('access_token');
}

// Test de creación de evaluaciones (carga intensiva)
function testCreateEvaluation(token) {
  if (!token) {
    return;
  }

  const evaluationPayload = JSON.stringify({
    organization_id: 1,
    answers: {
      question_1: 'Yes',
      question_2: 'Critical',
      question_3: 'Implemented'
    },
    fecha: new Date().toISOString().split('T')[0]
  });

  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${BASE_URL}/evaluations`, evaluationPayload, params);
  requestCount++;

  check(response, {
    'create evaluation status 200 or 409': (r) => r.status === 200 || r.status === 409,
    'create evaluation response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  if (response.status === 200 || response.status === 409) {
    successCount++;
  } else {
    errorCount++;
  }
}

// Test de lectura de evaluaciones
function testListEvaluations(token) {
  if (!token) {
    return;
  }

  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const response = http.get(`${BASE_URL}/evaluations`, params);
  requestCount++;

  check(response, {
    'list evaluations status 200': (r) => r.status === 200,
    'list evaluations response time < 1500ms': (r) => r.timings.duration < 1500,
  });

  if (response.status === 200) {
    successCount++;
  } else {
    errorCount++;
  }
}

// Test de lectura de organizaciones
function testListOrganizations(token) {
  if (!token) {
    return;
  }

  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const response = http.get(`${BASE_URL}/organizations`, params);
  requestCount++;

  check(response, {
    'list organizations status 200': (r) => r.status === 200,
    'list organizations response time < 1500ms': (r) => r.timings.duration < 1500,
  });

  if (response.status === 200) {
    successCount++;
  } else {
    errorCount++;
  }
}

// Test de usuarios/cuestionarios
function testListQuestionnaires(token) {
  if (!token) {
    return;
  }

  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const response = http.get(`${BASE_URL}/questionnaires`, params);
  requestCount++;

  check(response, {
    'list questionnaires status 200': (r) => r.status === 200,
    'list questionnaires response time < 1500ms': (r) => r.timings.duration < 1500,
  });

  if (response.status === 200) {
    successCount++;
  } else {
    errorCount++;
  }
}

// Función setup para test
export function setup() {
  console.log('=== INICIANDO PRUEBA DE ESTRÉS ===');
  console.log('Base URL: ' + BASE_URL);
  console.log('Fases: 50 → 100 → 200 → 300 usuarios');
  return {
    token: null
  };
}

// Main execution
export default function () {
  // Obtener token de autenticación
  const token = testAuthWithRetry();
  sleep(0.5);

  // Si el token es válido, ejecutar operaciones
  if (token) {
    // Test de lectura (menos intensivo)
    testListEvaluations(token);
    sleep(0.3);

    testListOrganizations(token);
    sleep(0.3);

    testListQuestionnaires(token);
    sleep(0.3);

    // Test de creación (más intensivo)
    testCreateEvaluation(token);
    sleep(0.5);
  } else {
    // Si falla auth, reintentar lectura sin token (fallará pero medimos)
    testListEvaluations(null);
    sleep(1);
  }
}

// Teardown: Mostrar estadísticas finales
export function teardown() {
  console.log('\n=== RESULTADOS FINALES STRESS TEST ===');
  console.log('Total requests: ' + requestCount);
  console.log('Successful: ' + successCount);
  console.log('Failed: ' + errorCount);
  console.log('Error rate: ' + ((errorCount / requestCount) * 100).toFixed(2) + '%');
}
