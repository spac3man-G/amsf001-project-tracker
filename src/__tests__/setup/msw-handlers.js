/**
 * Mock Service Worker Handlers
 * Mocks Supabase API responses for testing
 */

import { http, HttpResponse } from 'msw';

const SUPABASE_URL = 'https://ljqpmrcqxzgcfojrkxce.supabase.co';

// ============================================
// MOCK DATA STORES
// ============================================

// These can be modified in tests to simulate different scenarios
export const mockData = {
  users: [
    {
      id: 'user-1',
      email: 'admin@example.com',
      full_name: 'Admin User',
      role: 'admin',
    },
    {
      id: 'user-2',
      email: 'pm@example.com',
      full_name: 'Project Manager',
      role: 'supplier_pm',
    },
    {
      id: 'user-3',
      email: 'contributor@example.com',
      full_name: 'Contributor User',
      role: 'contributor',
    },
  ],
  projects: [
    {
      id: 'project-1',
      name: 'AMSF001 Network Standards',
      code: 'AMSF001',
      status: 'Active',
    },
  ],
  timesheets: [],
  expenses: [],
  resources: [
    {
      id: 'resource-1',
      project_id: 'project-1',
      user_id: 'user-3',
      name: 'Contributor User',
      role: 'Developer',
      sell_rate: 150,
      cost_rate: 100,
    },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseSupabaseQuery(url) {
  const urlObj = new URL(url);
  const params = {};
  
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

// ============================================
// SUPABASE REST API HANDLERS
// ============================================

export const handlers = [
  // ============================================
  // PROFILES / USERS
  // ============================================
  
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, ({ request }) => {
    const params = parseSupabaseQuery(request.url);
    let data = [...mockData.users];
    
    // Handle filtering (e.g., id=eq.user-1)
    if (params.id) {
      const match = params.id.match(/eq\.(.+)/);
      if (match) {
        data = data.filter(u => u.id === match[1]);
      }
    }
    
    return HttpResponse.json(data);
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/profiles`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json([{ ...body, updated_at: new Date().toISOString() }]);
  }),

  // ============================================
  // PROJECTS
  // ============================================
  
  http.get(`${SUPABASE_URL}/rest/v1/projects`, () => {
    return HttpResponse.json(mockData.projects);
  }),

  // ============================================
  // USER_PROJECTS (Project Membership & Roles)
  // ============================================
  
  http.get(`${SUPABASE_URL}/rest/v1/user_projects`, ({ request }) => {
    // Return mock user-project relationships
    return HttpResponse.json([
      {
        id: 'up-1',
        user_id: 'user-3',
        project_id: 'project-1',
        role: 'contributor',
      },
    ]);
  }),

  // ============================================
  // TIMESHEETS
  // ============================================
  
  http.get(`${SUPABASE_URL}/rest/v1/timesheets`, () => {
    return HttpResponse.json(mockData.timesheets);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/timesheets`, async ({ request }) => {
    const body = await request.json();
    const newTimesheet = {
      id: `timesheet-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
    };
    mockData.timesheets.push(newTimesheet);
    return HttpResponse.json([newTimesheet], { status: 201 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/timesheets`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json([{ ...body, updated_at: new Date().toISOString() }]);
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/timesheets`, () => {
    return HttpResponse.json(null, { status: 204 });
  }),

  // ============================================
  // EXPENSES
  // ============================================
  
  http.get(`${SUPABASE_URL}/rest/v1/expenses`, () => {
    return HttpResponse.json(mockData.expenses);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/expenses`, async ({ request }) => {
    const body = await request.json();
    const newExpense = {
      id: `expense-${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
    };
    mockData.expenses.push(newExpense);
    return HttpResponse.json([newExpense], { status: 201 });
  }),

  // ============================================
  // RESOURCES
  // ============================================
  
  http.get(`${SUPABASE_URL}/rest/v1/resources`, () => {
    return HttpResponse.json(mockData.resources);
  }),

  // ============================================
  // MILESTONES
  // ============================================
  
  http.get(`${SUPABASE_URL}/rest/v1/milestones`, () => {
    return HttpResponse.json([]);
  }),

  // ============================================
  // DELIVERABLES
  // ============================================
  
  http.get(`${SUPABASE_URL}/rest/v1/deliverables`, () => {
    return HttpResponse.json([]);
  }),

  // ============================================
  // RPC FUNCTIONS (Supabase functions)
  // ============================================
  
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_my_project_ids`, () => {
    return HttpResponse.json(['project-1']);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/rpc/can_manage_project`, () => {
    return HttpResponse.json(true);
  }),

  // ============================================
  // AUTH ENDPOINTS
  // ============================================
  
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: mockData.users[0],
    });
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json(mockData.users[0]);
  }),

  http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
    return HttpResponse.json({});
  }),
];

// ============================================
// UTILITY TO RESET MOCK DATA
// ============================================

export function resetMockData() {
  mockData.timesheets = [];
  mockData.expenses = [];
}

// ============================================
// UTILITY TO ADD TEST DATA
// ============================================

export function addMockTimesheet(timesheet) {
  mockData.timesheets.push(timesheet);
}

export function addMockExpense(expense) {
  mockData.expenses.push(expense);
}
