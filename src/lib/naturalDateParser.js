/**
 * Natural Language Date Parser
 * 
 * Parses natural language date expressions into date ranges.
 * Examples: "last month", "Q3", "past 2 weeks", "this year"
 * 
 * @version 1.0
 * @created 6 December 2025
 */

/**
 * Parse a natural language date expression into a date range
 * @param {string} text - Natural language date expression
 * @returns {Object|null} { start: Date, end: Date, label: string } or null if not recognized
 */
export function parseNaturalDate(text) {
  if (!text) return null;
  
  const input = text.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Helper functions
  const startOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    d.setDate(diff);
    return d;
  };
  
  const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const startOfQuarter = (date) => {
    const q = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), q * 3, 1);
  };
  const endOfQuarter = (date) => {
    const q = Math.floor(date.getMonth() / 3);
    return new Date(date.getFullYear(), (q + 1) * 3, 0);
  };
  const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);
  const endOfYear = (date) => new Date(date.getFullYear(), 11, 31);
  
  // Today
  if (/^today$/i.test(input)) {
    return {
      start: today,
      end: today,
      label: 'Today'
    };
  }
  
  // Yesterday
  if (/^yesterday$/i.test(input)) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      start: yesterday,
      end: yesterday,
      label: 'Yesterday'
    };
  }
  
  // This week
  if (/^this week$/i.test(input)) {
    const start = startOfWeek(today);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end, label: 'This Week' };
  }
  
  // Last week
  if (/^last week$/i.test(input)) {
    const thisWeekStart = startOfWeek(today);
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end, label: 'Last Week' };
  }
  
  // This month
  if (/^this month$/i.test(input)) {
    return {
      start: startOfMonth(today),
      end: endOfMonth(today),
      label: 'This Month'
    };
  }
  
  // Last month
  if (/^last month$/i.test(input)) {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return {
      start: startOfMonth(lastMonth),
      end: endOfMonth(lastMonth),
      label: 'Last Month'
    };
  }
  
  // Past N days/weeks/months
  const pastMatch = input.match(/^(?:past|last)\s+(\d+)\s+(day|days|week|weeks|month|months)$/i);
  if (pastMatch) {
    const count = parseInt(pastMatch[1], 10);
    const unit = pastMatch[2].toLowerCase();
    const start = new Date(today);
    
    if (unit.startsWith('day')) {
      start.setDate(start.getDate() - count);
    } else if (unit.startsWith('week')) {
      start.setDate(start.getDate() - (count * 7));
    } else if (unit.startsWith('month')) {
      start.setMonth(start.getMonth() - count);
    }
    
    return {
      start,
      end: today,
      label: `Past ${count} ${unit}`
    };
  }
  
  // This quarter
  if (/^this quarter$/i.test(input)) {
    return {
      start: startOfQuarter(today),
      end: endOfQuarter(today),
      label: 'This Quarter'
    };
  }
  
  // Last quarter
  if (/^last quarter$/i.test(input)) {
    const lastQuarter = new Date(today);
    lastQuarter.setMonth(lastQuarter.getMonth() - 3);
    return {
      start: startOfQuarter(lastQuarter),
      end: endOfQuarter(lastQuarter),
      label: 'Last Quarter'
    };
  }
  
  // Q1, Q2, Q3, Q4 (current year)
  const quarterMatch = input.match(/^q([1-4])$/i);
  if (quarterMatch) {
    const q = parseInt(quarterMatch[1], 10) - 1;
    const year = today.getFullYear();
    const start = new Date(year, q * 3, 1);
    const end = new Date(year, (q + 1) * 3, 0);
    return {
      start,
      end,
      label: `Q${q + 1} ${year}`
    };
  }
  
  // Q1 2024, Q2 2025, etc.
  const quarterYearMatch = input.match(/^q([1-4])\s*(\d{4})$/i);
  if (quarterYearMatch) {
    const q = parseInt(quarterYearMatch[1], 10) - 1;
    const year = parseInt(quarterYearMatch[2], 10);
    const start = new Date(year, q * 3, 1);
    const end = new Date(year, (q + 1) * 3, 0);
    return {
      start,
      end,
      label: `Q${q + 1} ${year}`
    };
  }
  
  // This year
  if (/^this year$/i.test(input)) {
    return {
      start: startOfYear(today),
      end: endOfYear(today),
      label: 'This Year'
    };
  }
  
  // Last year
  if (/^last year$/i.test(input)) {
    const lastYear = new Date(today.getFullYear() - 1, 0, 1);
    return {
      start: startOfYear(lastYear),
      end: endOfYear(lastYear),
      label: 'Last Year'
    };
  }
  
  // Year to date / YTD
  if (/^(year to date|ytd)$/i.test(input)) {
    return {
      start: startOfYear(today),
      end: today,
      label: 'Year to Date'
    };
  }
  
  // Month name (e.g., "January", "Feb", "November 2024")
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const monthShort = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  // Check for month with optional year
  const monthYearMatch = input.match(/^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*(\d{4})?$/i);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1].toLowerCase();
    let monthIndex = monthNames.indexOf(monthName);
    if (monthIndex === -1) {
      monthIndex = monthShort.indexOf(monthName.substring(0, 3));
    }
    
    if (monthIndex !== -1) {
      const year = monthYearMatch[2] ? parseInt(monthYearMatch[2], 10) : today.getFullYear();
      const start = new Date(year, monthIndex, 1);
      const end = endOfMonth(start);
      const displayMonth = monthNames[monthIndex].charAt(0).toUpperCase() + monthNames[monthIndex].slice(1);
      return {
        start,
        end,
        label: monthYearMatch[2] ? `${displayMonth} ${year}` : displayMonth
      };
    }
  }
  
  // Specific year (e.g., "2024", "2023")
  const yearMatch = input.match(/^(20\d{2})$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31),
      label: String(year)
    };
  }
  
  return null;
}

/**
 * Format a date range for display
 * @param {Date} start 
 * @param {Date} end 
 * @returns {string}
 */
export function formatDateRange(start, end) {
  if (!start || !end) return '';
  
  const formatDate = (d) => d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  
  // Same day
  if (start.toDateString() === end.toDateString()) {
    return formatDate(start);
  }
  
  // Same month
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} - ${formatDate(end)}`;
  }
  
  return `${formatDate(start)} - ${formatDate(end)}`;
}

/**
 * Get suggested date expressions for autocomplete
 * @returns {Array<{text: string, description: string}>}
 */
export function getDateSuggestions() {
  const today = new Date();
  const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
  const currentMonth = today.toLocaleDateString('en-GB', { month: 'long' });
  
  return [
    { text: 'today', description: 'Just today' },
    { text: 'yesterday', description: 'Yesterday only' },
    { text: 'this week', description: 'Current week (Mon-Sun)' },
    { text: 'last week', description: 'Previous week' },
    { text: 'this month', description: currentMonth },
    { text: 'last month', description: 'Previous month' },
    { text: 'past 7 days', description: 'Last 7 days' },
    { text: 'past 30 days', description: 'Last 30 days' },
    { text: 'past 2 weeks', description: 'Last 14 days' },
    { text: 'this quarter', description: `Q${currentQuarter} ${today.getFullYear()}` },
    { text: 'last quarter', description: `Q${currentQuarter > 1 ? currentQuarter - 1 : 4}` },
    { text: 'year to date', description: 'Jan 1 to today' },
    { text: 'this year', description: `${today.getFullYear()}` },
    { text: 'last year', description: `${today.getFullYear() - 1}` }
  ];
}

/**
 * Check if text might be a date expression (for highlighting)
 * @param {string} text 
 * @returns {boolean}
 */
export function mightBeDateExpression(text) {
  if (!text) return false;
  const input = text.toLowerCase().trim();
  
  // Quick check patterns
  const quickPatterns = [
    /^(today|yesterday)$/,
    /^(this|last)\s+(week|month|quarter|year)$/,
    /^past\s+\d+\s+(day|week|month)/,
    /^q[1-4]/,
    /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    /^ytd$/,
    /^20\d{2}$/
  ];
  
  return quickPatterns.some(p => p.test(input));
}

export default {
  parseNaturalDate,
  formatDateRange,
  getDateSuggestions,
  mightBeDateExpression
};
