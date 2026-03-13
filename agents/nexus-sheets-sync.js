/**
 * NexusSheetsSync - Google Sheets integration for reference website database
 *
 * Maintains a spreadsheet of reference sites discovered by the extractor agent.
 * Uses only built-in Node.js modules (https, crypto, fs, path).
 *
 * Usage:
 *   const sync = new NexusSheetsSync({ credentialsPath: '~/.nexus/google-credentials.json' });
 *   await sync.addReference({ companyName: 'Stripe', url: 'https://stripe.com', ... });
 *
 * CLI:
 *   node nexus-sheets-sync.js --setup
 *   node nexus-sheets-sync.js --add --company "Stripe" --url "https://stripe.com"
 *   node nexus-sheets-sync.js --list
 *   node nexus-sheets-sync.js --search --sector "Fintech"
 */

'use strict';

const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive';
const SHEET_NAME = 'Sites Database';
const HEADER_ROW = [
  'Company',
  'URL',
  'Sector',
  'Design Score',
  'Tech Stack',
  'Primary Colors',
  'Fonts',
  'Visual Effects',
  'Components Count',
  'Extracted Date',
  'Last Updated',
  'Notes',
];

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve ~ to the user home directory.
 */
function resolvePath(p) {
  if (!p) return p;
  if (p.startsWith('~')) {
    return path.join(process.env.HOME || process.env.USERPROFILE || '', p.slice(1));
  }
  return path.resolve(p);
}

/**
 * URL-safe Base64 encoding (no padding).
 */
function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Create a signed JWT for Google Service Account authentication.
 */
function createJWT(serviceAccount) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: SCOPES,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const segments = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(payload));
  const signature = crypto.sign('RSA-SHA256', Buffer.from(segments, 'utf8'), serviceAccount.private_key);
  return segments + '.' + base64url(signature);
}

/**
 * Perform an HTTPS request. Returns { statusCode, headers, body (parsed JSON or string) }.
 */
function httpsRequest(method, urlStr, body, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: method,
      headers: { ...headers },
    };

    let payload;
    if (body) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (_) {
          parsed = raw;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Pause execution for ms milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert a column index (0-based) to a sheet column letter (A, B, ..., Z, AA, ...).
 */
function colLetter(index) {
  let letter = '';
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

// ---------------------------------------------------------------------------
// NexusSheetsSync
// ---------------------------------------------------------------------------

class NexusSheetsSync {
  /**
   * @param {object} options
   * @param {string} [options.credentialsPath] - Path to service account JSON key file.
   * @param {string} [options.spreadsheetId]   - Existing spreadsheet ID. Omit to create new.
   */
  constructor(options = {}) {
    this._config = this._loadConfig();

    const merged = { ...this._config, ...options };

    this._credentialsPath = resolvePath(merged.credentialsPath || '~/.nexus/google-credentials.json');
    this._spreadsheetId = merged.spreadsheetId || null;
    this._serviceAccount = null;
    this._accessToken = null;
    this._tokenExpiry = 0;
    this._sheetReady = false;
  }

  // -----------------------------------------------------------------------
  // Config
  // -----------------------------------------------------------------------

  /**
   * Read optional config from ~/.nexus/config.json
   */
  _loadConfig() {
    const configPath = resolvePath('~/.nexus/config.json');
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      const cfg = JSON.parse(raw);
      return cfg.googleSheets || {};
    } catch (_) {
      return {};
    }
  }

  // -----------------------------------------------------------------------
  // Authentication
  // -----------------------------------------------------------------------

  /**
   * Load the service account key file.
   */
  _loadCredentials() {
    if (this._serviceAccount) return this._serviceAccount;

    if (!fs.existsSync(this._credentialsPath)) {
      console.warn(
        `[NexusSheetsSync] WARNING: Credentials file not found at ${this._credentialsPath}. ` +
          'Sheets sync will be disabled. Place a Google Service Account JSON key there or set credentialsPath.'
      );
      return null;
    }

    try {
      const raw = fs.readFileSync(this._credentialsPath, 'utf8');
      this._serviceAccount = JSON.parse(raw);
      return this._serviceAccount;
    } catch (err) {
      console.warn(`[NexusSheetsSync] WARNING: Failed to parse credentials file: ${err.message}`);
      return null;
    }
  }

  /**
   * Obtain (or refresh) an OAuth2 access token via the service account JWT flow.
   */
  async _authenticate() {
    // Return cached token if still valid (with 60s margin)
    if (this._accessToken && Date.now() < this._tokenExpiry - 60000) {
      return this._accessToken;
    }

    const sa = this._loadCredentials();
    if (!sa) return null;

    const jwt = createJWT(sa);

    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString();

    const res = await httpsRequest('POST', TOKEN_URL, body, {
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    if (res.statusCode !== 200) {
      throw new Error(`[NexusSheetsSync] Auth failed (${res.statusCode}): ${JSON.stringify(res.body)}`);
    }

    this._accessToken = res.body.access_token;
    this._tokenExpiry = Date.now() + (res.body.expires_in || 3600) * 1000;
    return this._accessToken;
  }

  // -----------------------------------------------------------------------
  // Generic API helper
  // -----------------------------------------------------------------------

  /**
   * Make an authenticated request to the Sheets (or Drive) API with retry on 429.
   * @param {string} method  HTTP method
   * @param {string} url     Full URL
   * @param {object} [body]  Request body (will be JSON-stringified)
   * @param {number} [attempt] Current retry attempt (internal)
   * @returns {object} Parsed response body
   */
  async _request(method, url, body, attempt = 0) {
    const token = await this._authenticate();
    if (!token) {
      throw new Error('[NexusSheetsSync] Not authenticated. Cannot make API request.');
    }

    const res = await httpsRequest(method, url, body, {
      Authorization: `Bearer ${token}`,
    });

    // Rate limited — exponential backoff
    if (res.statusCode === 429 && attempt < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
      console.warn(`[NexusSheetsSync] Rate limited. Retrying in ${Math.round(delay)}ms...`);
      await sleep(delay);
      return this._request(method, url, body, attempt + 1);
    }

    if (res.statusCode >= 400) {
      const msg =
        typeof res.body === 'object' && res.body.error
          ? res.body.error.message || JSON.stringify(res.body.error)
          : JSON.stringify(res.body);
      throw new Error(`[NexusSheetsSync] API error ${res.statusCode} ${method} ${url}: ${msg}`);
    }

    return res.body;
  }

  // -----------------------------------------------------------------------
  // Spreadsheet setup
  // -----------------------------------------------------------------------

  /**
   * Ensure the target spreadsheet exists and has the correct structure.
   * If no spreadsheetId is configured, creates a new spreadsheet.
   */
  async ensureSheet() {
    if (this._sheetReady) return this._spreadsheetId;

    if (this._spreadsheetId) {
      // Verify it exists
      try {
        await this._request('GET', `${SHEETS_API_BASE}/${this._spreadsheetId}?fields=spreadsheetId,sheets.properties`);
      } catch (err) {
        console.warn(`[NexusSheetsSync] Could not access spreadsheet ${this._spreadsheetId}: ${err.message}`);
        console.warn('[NexusSheetsSync] Will attempt to create a new spreadsheet.');
        this._spreadsheetId = null;
      }
    }

    if (!this._spreadsheetId) {
      this._spreadsheetId = await this._createSpreadsheet();
    }

    // Ensure the "Sites Database" sheet and headers exist
    await this._ensureSheetTab();
    await this._ensureHeaders();
    await this.formatSheet();

    this._sheetReady = true;
    return this._spreadsheetId;
  }

  /**
   * Create a brand-new spreadsheet with today's date in the title.
   */
  async _createSpreadsheet() {
    const today = new Date().toISOString().slice(0, 10);
    const title = `NEXUS References - ${today}`;

    const body = {
      properties: { title },
      sheets: [
        {
          properties: {
            title: SHEET_NAME,
            gridProperties: { frozenRowCount: 1 },
          },
        },
      ],
    };

    const res = await this._request('POST', SHEETS_API_BASE, body);
    console.log(`[NexusSheetsSync] Created spreadsheet "${title}" (${res.spreadsheetId})`);
    return res.spreadsheetId;
  }

  /**
   * Make sure the "Sites Database" tab exists.
   */
  async _ensureSheetTab() {
    const meta = await this._request(
      'GET',
      `${SHEETS_API_BASE}/${this._spreadsheetId}?fields=sheets.properties`
    );

    const exists = meta.sheets && meta.sheets.some((s) => s.properties.title === SHEET_NAME);
    if (!exists) {
      await this._request('POST', `${SHEETS_API_BASE}/${this._spreadsheetId}:batchUpdate`, {
        requests: [
          {
            addSheet: {
              properties: {
                title: SHEET_NAME,
                gridProperties: { frozenRowCount: 1 },
              },
            },
          },
        ],
      });
    }
  }

  /**
   * Write header row if the first row is empty.
   */
  async _ensureHeaders() {
    const range = `'${SHEET_NAME}'!A1:L1`;
    const url = `${SHEETS_API_BASE}/${this._spreadsheetId}/values/${encodeURIComponent(range)}`;
    const existing = await this._request('GET', url);

    if (!existing.values || existing.values.length === 0 || existing.values[0].length === 0) {
      await this._request(
        'PUT',
        `${url}?valueInputOption=RAW`,
        { range, majorDimension: 'ROWS', values: [HEADER_ROW] }
      );
    }
  }

  /**
   * Get the sheetId (numeric) for our tab.
   */
  async _getSheetId() {
    const meta = await this._request(
      'GET',
      `${SHEETS_API_BASE}/${this._spreadsheetId}?fields=sheets.properties`
    );
    const sheet = meta.sheets && meta.sheets.find((s) => s.properties.title === SHEET_NAME);
    return sheet ? sheet.properties.sheetId : 0;
  }

  /**
   * Apply visual formatting: bold headers, auto-resize columns, alternating row colors,
   * freeze header row, and add a basic filter.
   */
  async formatSheet() {
    const sheetId = await this._getSheetId();
    const numCols = HEADER_ROW.length;

    const requests = [
      // Freeze header row
      {
        updateSheetProperties: {
          properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
          fields: 'gridProperties.frozenRowCount',
        },
      },
      // Bold header row
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: numCols },
          cell: {
            userEnteredFormat: {
              textFormat: { bold: true, fontSize: 11 },
              backgroundColor: { red: 0.15, green: 0.15, blue: 0.22, alpha: 1 },
              textFormat: { bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
              horizontalAlignment: 'CENTER',
            },
          },
          fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment)',
        },
      },
      // Auto-resize columns
      {
        autoResizeDimensions: {
          dimensions: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: numCols },
        },
      },
      // Add basic filter on header row
      {
        setBasicFilter: {
          filter: {
            range: { sheetId, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: numCols },
          },
        },
      },
      // Alternating (banded) colors
      {
        addBanding: {
          bandedRange: {
            range: { sheetId, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: numCols },
            rowProperties: {
              headerColor: { red: 0.15, green: 0.15, blue: 0.22, alpha: 1 },
              firstBandColor: { red: 1, green: 1, blue: 1, alpha: 1 },
              secondBandColor: { red: 0.94, green: 0.95, blue: 0.97, alpha: 1 },
            },
          },
        },
      },
    ];

    try {
      await this._request('POST', `${SHEETS_API_BASE}/${this._spreadsheetId}:batchUpdate`, { requests });
    } catch (err) {
      // Banding may already exist; ignore that specific error and try without it.
      if (err.message && err.message.includes('bandedRange')) {
        await this._request('POST', `${SHEETS_API_BASE}/${this._spreadsheetId}:batchUpdate`, {
          requests: requests.slice(0, -1),
        });
      } else {
        throw err;
      }
    }
  }

  // -----------------------------------------------------------------------
  // Data helpers
  // -----------------------------------------------------------------------

  /**
   * Convert a reference object into a flat row array matching HEADER_ROW order.
   */
  _refToRow(data) {
    const joinArr = (v) => (Array.isArray(v) ? v.join(', ') : v || '');
    return [
      data.companyName || '',
      data.url || '',
      data.sector || '',
      data.designScore != null ? String(data.designScore) : '',
      joinArr(data.techStack),
      joinArr(data.colors),
      joinArr(data.fonts),
      joinArr(data.effects),
      data.componentsExtracted != null ? String(data.componentsExtracted) : '',
      data.extractedAt || new Date().toISOString().slice(0, 10),
      new Date().toISOString().slice(0, 10),
      data.notes || '',
    ];
  }

  /**
   * Convert a row array back to a reference object.
   */
  _rowToRef(row) {
    const splitStr = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
    return {
      companyName: row[0] || '',
      url: row[1] || '',
      sector: row[2] || '',
      designScore: row[3] ? parseFloat(row[3]) : null,
      techStack: splitStr(row[4]),
      colors: splitStr(row[5]),
      fonts: splitStr(row[6]),
      effects: splitStr(row[7]),
      componentsExtracted: row[8] ? parseInt(row[8], 10) : null,
      extractedAt: row[9] || '',
      lastUpdated: row[10] || '',
      notes: row[11] || '',
    };
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Add a single reference site to the spreadsheet.
   * @param {object} data Reference data object.
   * @returns {object} The appended reference.
   */
  async addReference(data) {
    await this.ensureSheet();

    const row = this._refToRow(data);
    const range = `'${SHEET_NAME}'!A:L`;
    const url =
      `${SHEETS_API_BASE}/${this._spreadsheetId}/values/${encodeURIComponent(range)}:append` +
      '?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS';

    await this._request('POST', url, {
      range,
      majorDimension: 'ROWS',
      values: [row],
    });

    return this._rowToRef(row);
  }

  /**
   * Batch-add multiple reference sites.
   * @param {object[]} dataArray Array of reference data objects.
   * @returns {object[]} The appended references.
   */
  async addReferences(dataArray) {
    if (!dataArray || dataArray.length === 0) return [];

    await this.ensureSheet();

    const rows = dataArray.map((d) => this._refToRow(d));
    const range = `'${SHEET_NAME}'!A:L`;
    const url =
      `${SHEETS_API_BASE}/${this._spreadsheetId}/values/${encodeURIComponent(range)}:append` +
      '?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS';

    await this._request('POST', url, {
      range,
      majorDimension: 'ROWS',
      values: rows,
    });

    return rows.map((r) => this._rowToRef(r));
  }

  /**
   * Get all references from the spreadsheet.
   * @returns {object[]} Array of reference objects.
   */
  async getReferences() {
    await this.ensureSheet();

    const range = `'${SHEET_NAME}'!A2:L`;
    const url = `${SHEETS_API_BASE}/${this._spreadsheetId}/values/${encodeURIComponent(range)}`;
    const res = await this._request('GET', url);

    if (!res.values || res.values.length === 0) return [];
    return res.values.map((row) => this._rowToRef(row));
  }

  /**
   * Search references by matching one or more fields.
   * Filters are applied locally after fetching all rows.
   *
   * Supported filter keys: companyName, url, sector, designScore (min), techStack (substring),
   * colors, fonts, effects, extractedAt.
   *
   * String comparisons are case-insensitive substring matches.
   *
   * @param {object} filters Key/value pairs to match.
   * @returns {object[]} Matching references.
   */
  async searchReferences(filters) {
    const all = await this.getReferences();
    if (!filters || Object.keys(filters).length === 0) return all;

    return all.filter((ref) => {
      for (const [key, value] of Object.entries(filters)) {
        if (value == null) continue;
        const refVal = ref[key];

        if (key === 'designScore') {
          // Numeric: treat filter value as minimum score
          if (refVal == null || refVal < Number(value)) return false;
        } else if (Array.isArray(refVal)) {
          // Array fields: check if any element contains the filter substring
          const needle = String(value).toLowerCase();
          if (!refVal.some((v) => v.toLowerCase().includes(needle))) return false;
        } else {
          // String fields: case-insensitive substring
          if (!String(refVal).toLowerCase().includes(String(value).toLowerCase())) return false;
        }
      }
      return true;
    });
  }

  /**
   * Update a reference by URL (finds the row, updates matching columns).
   * @param {string} targetUrl The URL of the row to update.
   * @param {object} data      Fields to update.
   * @returns {object|null} Updated reference or null if not found.
   */
  async updateReference(targetUrl, data) {
    await this.ensureSheet();

    // Read all data rows to find the target
    const range = `'${SHEET_NAME}'!A2:L`;
    const url = `${SHEETS_API_BASE}/${this._spreadsheetId}/values/${encodeURIComponent(range)}`;
    const res = await this._request('GET', url);

    if (!res.values || res.values.length === 0) return null;

    const rowIndex = res.values.findIndex(
      (row) => row[1] && row[1].trim().toLowerCase() === targetUrl.trim().toLowerCase()
    );

    if (rowIndex === -1) return null;

    // Merge existing row with new data
    const existing = this._rowToRef(res.values[rowIndex]);
    const merged = { ...existing, ...data, url: existing.url }; // preserve original URL as key
    merged.lastUpdated = new Date().toISOString().slice(0, 10);
    const newRow = this._refToRow(merged);
    // Force lastUpdated into the row
    newRow[10] = merged.lastUpdated;

    const actualRow = rowIndex + 2; // +1 for 0-index, +1 for header row
    const updateRange = `'${SHEET_NAME}'!A${actualRow}:L${actualRow}`;
    const updateUrl =
      `${SHEETS_API_BASE}/${this._spreadsheetId}/values/${encodeURIComponent(updateRange)}` +
      '?valueInputOption=USER_ENTERED';

    await this._request('PUT', updateUrl, {
      range: updateRange,
      majorDimension: 'ROWS',
      values: [newRow],
    });

    return this._rowToRef(newRow);
  }
}

// ---------------------------------------------------------------------------
// CLI Mode
// ---------------------------------------------------------------------------

async function cli() {
  const args = process.argv.slice(2);

  function getArg(name) {
    const idx = args.indexOf(`--${name}`);
    if (idx === -1) return undefined;
    if (idx + 1 < args.length && !args[idx + 1].startsWith('--')) {
      return args[idx + 1];
    }
    return true;
  }

  const hasFlag = (name) => args.includes(`--${name}`);

  // Build options from CLI args
  const options = {};
  if (getArg('credentials') && typeof getArg('credentials') === 'string') {
    options.credentialsPath = getArg('credentials');
  }
  if (getArg('sheet-id') && typeof getArg('sheet-id') === 'string') {
    options.spreadsheetId = getArg('sheet-id');
  }

  const sync = new NexusSheetsSync(options);

  try {
    // --setup: create spreadsheet and output its ID
    if (hasFlag('setup')) {
      const id = await sync.ensureSheet();
      console.log(`\nSpreadsheet ready.`);
      console.log(`  ID: ${id}`);
      console.log(`  URL: https://docs.google.com/spreadsheets/d/${id}`);
      console.log(`\nSave the ID to ~/.nexus/config.json:`);
      console.log(JSON.stringify({ googleSheets: { spreadsheetId: id } }, null, 2));
      return;
    }

    // --add: add a single reference
    if (hasFlag('add')) {
      const ref = {
        companyName: typeof getArg('company') === 'string' ? getArg('company') : '',
        url: typeof getArg('url') === 'string' ? getArg('url') : '',
        sector: typeof getArg('sector') === 'string' ? getArg('sector') : '',
        designScore: getArg('score') ? parseFloat(getArg('score')) : null,
        techStack: typeof getArg('tech') === 'string' ? getArg('tech').split(',') : [],
        colors: typeof getArg('colors') === 'string' ? getArg('colors').split(',') : [],
        fonts: typeof getArg('fonts') === 'string' ? getArg('fonts').split(',') : [],
        effects: typeof getArg('effects') === 'string' ? getArg('effects').split(',') : [],
        componentsExtracted: getArg('components') ? parseInt(getArg('components'), 10) : null,
        extractedAt: typeof getArg('date') === 'string' ? getArg('date') : new Date().toISOString().slice(0, 10),
        notes: typeof getArg('notes') === 'string' ? getArg('notes') : '',
      };

      const result = await sync.addReference(ref);
      console.log('Reference added:');
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // --list: show all references
    if (hasFlag('list')) {
      const refs = await sync.getReferences();
      if (refs.length === 0) {
        console.log('No references found.');
      } else {
        console.log(`Found ${refs.length} reference(s):\n`);
        for (const ref of refs) {
          console.log(
            `  ${ref.companyName || '(unnamed)'} | ${ref.url} | ${ref.sector} | Score: ${ref.designScore ?? 'N/A'} | ${ref.componentsExtracted ?? 0} components`
          );
        }
      }
      return;
    }

    // --search: filter references
    if (hasFlag('search')) {
      const filters = {};
      for (const key of ['companyName', 'company', 'url', 'sector', 'designScore', 'techStack', 'tech', 'colors', 'fonts', 'effects']) {
        const val = getArg(key);
        if (val && typeof val === 'string') {
          // Map CLI-friendly names to object keys
          const mappedKey = key === 'company' ? 'companyName' : key === 'tech' ? 'techStack' : key;
          filters[mappedKey] = val;
        }
      }

      const results = await sync.searchReferences(filters);
      if (results.length === 0) {
        console.log('No matching references found.');
      } else {
        console.log(`Found ${results.length} matching reference(s):\n`);
        for (const ref of results) {
          console.log(
            `  ${ref.companyName || '(unnamed)'} | ${ref.url} | ${ref.sector} | Score: ${ref.designScore ?? 'N/A'} | Components: ${ref.componentsExtracted ?? 0}`
          );
          if (ref.techStack.length) console.log(`    Tech: ${ref.techStack.join(', ')}`);
          if (ref.effects.length) console.log(`    Effects: ${ref.effects.join(', ')}`);
          if (ref.notes) console.log(`    Notes: ${ref.notes}`);
          console.log();
        }
      }
      return;
    }

    // No recognized command
    console.log(`
NexusSheetsSync - Google Sheets reference database

Usage:
  node nexus-sheets-sync.js --setup                               Create spreadsheet & output ID
  node nexus-sheets-sync.js --add --company "X" --url "..." ...   Add a reference
  node nexus-sheets-sync.js --list                                List all references
  node nexus-sheets-sync.js --search --sector "Fintech"           Search references

Options:
  --credentials <path>   Path to service account JSON key
  --sheet-id <id>        Existing spreadsheet ID
  --company <name>       Company name
  --url <url>            Website URL
  --sector <sector>      Business sector
  --score <number>       Design score (0-10)
  --tech <csv>           Tech stack (comma-separated)
  --colors <csv>         Brand colors (comma-separated hex)
  --fonts <csv>          Fonts used (comma-separated)
  --effects <csv>        Visual effects (comma-separated)
  --components <number>  Number of components extracted
  --date <YYYY-MM-DD>    Extraction date
  --notes <text>         Additional notes
`);
  } catch (err) {
    console.error(`[NexusSheetsSync] Error: ${err.message}`);
    process.exitCode = 1;
  }
}

// Run CLI if executed directly
if (require.main === module) {
  cli();
}

module.exports = NexusSheetsSync;
