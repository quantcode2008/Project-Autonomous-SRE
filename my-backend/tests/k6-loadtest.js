import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'

const healthLatency = new Trend('health_duration_ms')
const waitlistLatency = new Trend('waitlist_post_duration_ms')
const adminUsersLatency = new Trend('admin_users_list_duration_ms')
const adminUsersPagedLatency = new Trend('admin_users_paged_filter_duration_ms')
const errorRate = new Rate('custom_error_rate')

export const options = {
  stages: [
    { duration: '5s', target: 20 },  // Warm-up ramp
    { duration: '20s', target: 50 }, // Sustained load at 50 concurrent VUs
    { duration: '5s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'], // 95% of all requests under 250ms
    custom_error_rate: ['rate<0.01'], // Error rate under 1%
  },
}

const BASE_URL = __ENV.TARGET_URL || 'http://host.docker.internal:4000'
const BYPASS_HEADER = 'sre-load-test-authorized'

export function setup() {
  // Authenticate as Admin to acquire session cookie
  const loginRes = http.post(
    `${BASE_URL}/api/auth/sign-in/email`,
    JSON.stringify({
      email: 'mirajmisba1@gmail.com',
      password: 'MISBA1234',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Load-Test-Bypass': BYPASS_HEADER,
      },
    }
  )

  check(loginRes, {
    'admin login succeeded (200)': (r) => r.status === 200,
  })

  // Return the session cookie header
  const setCookie = loginRes.headers['Set-Cookie'] || ''
  return { cookie: setCookie }
}

export default function (data) {
  const commonHeaders = {
    'Content-Type': 'application/json',
    'X-Load-Test-Bypass': BYPASS_HEADER,
  }

  const authHeaders = {
    ...commonHeaders,
    Cookie: data.cookie,
  }

  // 1. Health Probe Endpoint
  {
    const res = http.get(`${BASE_URL}/health`, { headers: commonHeaders })
    healthLatency.add(res.timings.duration)
    const ok = check(res, { 'health status is 200': (r) => r.status === 200 })
    if (!ok) errorRate.add(1)
  }

  // 2. Waitlist Registration Write Path
  {
    const randomSuffix = Math.floor(Math.random() * 100000000)
    const payload = JSON.stringify({
      email: `k6_tester_${randomSuffix}@benchmark.internal`,
      role: 'sre',
    })
    const res = http.post(`${BASE_URL}/api/v1/waitlist`, payload, {
      headers: commonHeaders,
    })
    waitlistLatency.add(res.timings.duration)
    const ok = check(res, { 'waitlist status is 200 or 201': (r) => r.status === 200 || r.status === 201 })
    if (!ok) errorRate.add(1)
  }

  // 3. Admin User List (Page 1 over 100,000 rows with Sorting & Pagination)
  {
    const res = http.get(`${BASE_URL}/api/v1/admin/users?page=1&limit=20`, {
      headers: authHeaders,
    })
    adminUsersLatency.add(res.timings.duration)
    const ok = check(res, { 'admin users page 1 is 200': (r) => r.status === 200 })
    if (!ok) errorRate.add(1)
  }

  // 4. Admin User Filtered & Deep Pagination over 100,000 rows
  {
    const res = http.get(`${BASE_URL}/api/v1/admin/users?page=50&limit=20&status=pending`, {
      headers: authHeaders,
    })
    adminUsersPagedLatency.add(res.timings.duration)
    const ok = check(res, { 'admin users filtered page 50 is 200': (r) => r.status === 200 })
    if (!ok) errorRate.add(1)
  }

  sleep(0.05) // Short realistic user pacing
}
