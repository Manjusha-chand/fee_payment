const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(
  /\/$/,
  '',
)

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, { token, method = 'GET', body } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      'Cannot reach the server. Make sure the API is running on port 5000.',
      0,
    )
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // no JSON body
  }

  if (!response.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${response.status}.`,
      response.status,
    )
  }

  return data
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  bootstrap: (token) => request('/bootstrap', { token }),
  createPayment: (token, payload) =>
    request('/payments', { token, method: 'POST', body: payload }),
  reviewPayment: (token, id, payload) =>
    request(`/payments/${encodeURIComponent(id)}/review`, {
      token,
      method: 'PATCH',
      body: payload,
    }),
  addStudent: (token, payload) =>
    request('/students', { token, method: 'POST', body: payload }),
  updateStudent: (token, id, payload) =>
    request(`/students/${encodeURIComponent(id)}`, {
      token,
      method: 'PUT',
      body: payload,
    }),
  resetDemo: () => request('/demo/reset', { method: 'POST' }),
}
