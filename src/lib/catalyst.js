// ═══════════════════════════════════════════════════════════════════════
// ZOHO CATALYST CLIENT — Replaces Supabase with Catalyst Data Store + Auth
// ═══════════════════════════════════════════════════════════════════════
//
// Architecture:
//   - When hosted on Catalyst: Uses @zcatalyst/auth-client + @zcatalyst/datastore directly
//   - When hosted externally (Vercel): Uses Catalyst REST API via serverless proxy
//
// Environment variables (set in .env):
//   VITE_CATALYST_PROJECT_ID   — Your Catalyst project ID
//   VITE_CATALYST_PROJECT_KEY  — Your Catalyst ZAID (project key)
//   VITE_CATALYST_API_DOMAIN   — API domain (e.g., https://api.catalyst.zoho.com for US)
//   VITE_CATALYST_ORG_ID       — Optional: Your Catalyst org ID
//   VITE_AUTH_MODE              — 'catalyst' | 'custom' (default: 'custom')
// ═══════════════════════════════════════════════════════════════════════

// Catalyst configuration
export const CATALYST_CONFIG = {
  projectId: import.meta.env.VITE_CATALYST_PROJECT_ID || '',
  projectKey: import.meta.env.VITE_CATALYST_PROJECT_KEY || '',
  apiDomain: import.meta.env.VITE_CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.in',
  orgId: import.meta.env.VITE_CATALYST_ORG_ID || '',
  authMode: import.meta.env.VITE_AUTH_MODE || 'custom',
}

// Determine the site URL for redirects
export const SITE_URL = typeof window !== 'undefined' ? window.location.origin : ''

// ═══════════════════════════════════════════════════════════════════════
// CATALYST REST API CLIENT
// A lightweight fetch-based client for Catalyst Data Store REST API
// ═══════════════════════════════════════════════════════════════════════

class CatalystClient {
  constructor(config) {
    this.config = config
    this.baseUrl = `${config.apiDomain}/baas/v1/project/${config.projectId}`
    this._accessToken = null
    this._tokenExpiry = 0
  }

  /**
   * Set the OAuth access token (called from auth flow or serverless proxy)
   */
  setAccessToken(token, expiresIn = 3600) {
    this._accessToken = token
    this._tokenExpiry = Date.now() + (expiresIn * 1000) - 60000 // 1 min buffer
  }

  /**
   * Get auth headers for API calls
   */
  _getHeaders(contentType = 'application/json') {
    const headers = {}
    if (contentType) headers['Content-Type'] = contentType
    if (this._accessToken) {
      headers['Authorization'] = `Zoho-oauthtoken ${this._accessToken}`
    }
    if (this.config.orgId) {
      headers['CATALYST-ORG'] = this.config.orgId
    }
    return headers
  }

  /**
   * Check if token is still valid
   */
  isTokenValid() {
    return this._accessToken && Date.now() < this._tokenExpiry
  }

  // ═══ DATA STORE OPERATIONS ═══

  /**
   * Execute a ZCQL query
   */
  async query(zcqlQuery) {
    const res = await fetch(`${this.baseUrl}/zcql`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify({ query: zcqlQuery }),
    })
    const json = await res.json()
    if (json.status !== 'success') throw new Error(json.message || 'ZCQL query failed')
    return json.data || []
  }

  /**
   * Insert row(s) into a table
   */
  async insertRow(tableName, rowData) {
    const payload = Array.isArray(rowData) ? rowData : [rowData]
    const res = await fetch(`${this.baseUrl}/table/${tableName}/row`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.status !== 'success') throw new Error(json.message || 'Insert failed')
    return json.data
  }

  /**
   * Get all rows from a table (with pagination support)
   */
  async getRows(tableName, { maxRows = 200, nextToken } = {}) {
    let url = `${this.baseUrl}/table/${tableName}/row?max_rows=${maxRows}`
    if (nextToken) url += `&next_token=${nextToken}`

    const res = await fetch(url, {
      method: 'GET',
      headers: this._getHeaders(null),
    })
    const json = await res.json()
    if (json.status !== 'success') throw new Error(json.message || 'Fetch rows failed')
    return {
      data: json.data || [],
      moreRecords: json.more_records || false,
      nextToken: json.next_token || null,
    }
  }

  /**
   * Get all rows by fetching all pages
   */
  async getAllRows(tableName) {
    const allRows = []
    let nextToken = null
    do {
      const result = await this.getRows(tableName, { maxRows: 200, nextToken })
      allRows.push(...result.data)
      nextToken = result.moreRecords ? result.nextToken : null
    } while (nextToken)
    return allRows
  }

  /**
   * Update a row in a table
   */
  async updateRow(tableName, rowData) {
    const payload = Array.isArray(rowData) ? rowData : [rowData]
    const res = await fetch(`${this.baseUrl}/table/${tableName}/row`, {
      method: 'PUT',
      headers: this._getHeaders(),
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (json.status !== 'success') throw new Error(json.message || 'Update failed')
    return json.data
  }

  /**
   * Delete a row from a table
   */
  async deleteRow(tableName, rowId) {
    const res = await fetch(`${this.baseUrl}/table/${tableName}/row/${rowId}`, {
      method: 'DELETE',
      headers: this._getHeaders(null),
    })
    const json = await res.json()
    if (json.status !== 'success') throw new Error(json.message || 'Delete failed')
    return json.data
  }

  /**
   * Bulk delete rows
   */
  async deleteRows(tableName, rowIds) {
    const ids = rowIds.join(',')
    const res = await fetch(`${this.baseUrl}/table/${tableName}/row?ids=${ids}`, {
      method: 'DELETE',
      headers: this._getHeaders(null),
    })
    const json = await res.json()
    if (json.status !== 'success') throw new Error(json.message || 'Bulk delete failed')
    return json.data
  }

  // ═══ AUTH OPERATIONS (via proxy or direct) ═══

  /**
   * Sign up a new user
   */
  async signUpUser({ firstName, lastName, email, redirectUrl }) {
    const res = await fetch(`${this.baseUrl}/project-user/signup`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify({
        user_details: {
          first_name: firstName,
          last_name: lastName || '',
          email_id: email,
        },
        platform_type: 'web',
        redirect_url: redirectUrl || SITE_URL,
      }),
    })
    const json = await res.json()
    if (json.status !== 'success') throw new Error(json.message || 'Sign up failed')
    return json.data
  }

  /**
   * Get current user details
   */
  async getCurrentUser() {
    const res = await fetch(`${this.baseUrl}/project-user/current`, {
      method: 'GET',
      headers: this._getHeaders(null),
    })
    const json = await res.json()
    if (json.status !== 'success') return null
    return json.data
  }

  /**
   * Reset user password
   */
  async resetPassword(email) {
    const res = await fetch(`${this.baseUrl}/project-user/forgotpassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'PROJECT_ID': this.config.projectKey,
      },
      body: JSON.stringify({
        user_details: { email_id: email },
        platform_type: 'web',
      }),
    })
    const json = await res.json()
    if (json.status !== 'success') throw new Error(json.message || 'Password reset failed')
    return json.data
  }
}

// Create and export the singleton client
export const catalyst = new CatalystClient(CATALYST_CONFIG)

// ═══════════════════════════════════════════════════════════════════════
// SHARED CONSTANTS (migrated from supabase.js)
// ═══════════════════════════════════════════════════════════════════════

export const PRICING = {
  'Year 1-6': 13,
  'Year 7-10': 20,
  'Year 11-12': 27,
  'Special Needs': 27,
}

export const ADMIN_EMAILS = [
  'zenithpranavi786@gmail.com',
  'v72653666@gmail.com',
  'admin@zped.org',
  'vidhyadharanss@gmail.com',
  'sanmugapriyaa786@gmail.com',
  'hvdrksp2003@gmail.com',
]
