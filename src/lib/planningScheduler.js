/**
 * Planning Scheduler - Calculates dates based on dependencies
 * 
 * Dependency Types:
 * - FS (Finish-to-Start): Successor starts after predecessor finishes
 * - SS (Start-to-Start): Successor starts when predecessor starts
 * - FF (Finish-to-Finish): Successor finishes when predecessor finishes
 * - SF (Start-to-Finish): Successor finishes when predecessor starts
 * 
 * Lag: Days to add (positive) or subtract (negative) from the calculated date
 */

/**
 * Add days to a date (skipping weekends if specified)
 */
function addDays(date, days, skipWeekends = false) {
  if (!date) return null;
  const result = new Date(date);
  
  if (!skipWeekends) {
    result.setDate(result.getDate() + days);
    return result;
  }
  
  // Skip weekends
  let remaining = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;
  
  while (remaining > 0) {
    result.setDate(result.getDate() + direction);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining--;
    }
  }
  
  return result;
}

/**
 * Calculate the duration in days between two dates
 */
function getDuration(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end - start;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDateStr(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr);
}

/**
 * Calculate the earliest start date for an item based on its predecessors
 */
function calculateEarliestStart(item, itemsMap, skipWeekends = false) {
  const predecessors = item.predecessors || [];
  
  if (predecessors.length === 0) {
    // No predecessors - keep existing start date or return null
    return item.start_date ? parseDate(item.start_date) : null;
  }
  
  let earliestStart = null;
  
  for (const pred of predecessors) {
    const predItem = itemsMap.get(pred.id);
    if (!predItem) continue;
    
    const predStart = parseDate(predItem.start_date);
    const predEnd = parseDate(predItem.end_date);
    const lag = pred.lag || 0;
    const type = pred.type || 'FS';
    
    let calculatedDate = null;
    
    switch (type) {
      case 'FS': // Finish-to-Start: Start after predecessor finishes
        if (predEnd) {
          calculatedDate = addDays(predEnd, 1 + lag, skipWeekends);
        }
        break;
        
      case 'SS': // Start-to-Start: Start when predecessor starts
        if (predStart) {
          calculatedDate = addDays(predStart, lag, skipWeekends);
        }
        break;
        
      case 'FF': // Finish-to-Finish: Calculate start based on duration
        if (predEnd) {
          const duration = getDuration(item.start_date, item.end_date) || 1;
          calculatedDate = addDays(predEnd, lag - duration + 1, skipWeekends);
        }
        break;
        
      case 'SF': // Start-to-Finish: Calculate start based on duration  
        if (predStart) {
          const duration = getDuration(item.start_date, item.end_date) || 1;
          calculatedDate = addDays(predStart, lag - duration + 1, skipWeekends);
        }
        break;
    }
    
    if (calculatedDate) {
      if (!earliestStart || calculatedDate > earliestStart) {
        earliestStart = calculatedDate;
      }
    }
  }
  
  return earliestStart;
}

/**
 * Calculate the end date based on start date and original duration
 */
function calculateEndDate(startDate, originalStartDate, originalEndDate, skipWeekends = false) {
  if (!startDate) return null;
  
  const duration = getDuration(originalStartDate, originalEndDate);
  if (duration <= 0) return startDate;
  
  return addDays(startDate, duration, skipWeekends);
}

/**
 * Topological sort of items based on dependencies
 * Returns items in order that respects dependencies (predecessors before successors)
 */
function topologicalSort(items) {
  const itemsMap = new Map(items.map(i => [i.id, i]));
  const visited = new Set();
  const result = [];
  
  // Build reverse dependency map (which items depend on each item)
  const dependents = new Map();
  items.forEach(item => {
    (item.predecessors || []).forEach(pred => {
      if (!dependents.has(pred.id)) {
        dependents.set(pred.id, []);
      }
      dependents.get(pred.id).push(item.id);
    });
  });
  
  // DFS to get topological order
  function visit(itemId) {
    if (visited.has(itemId)) return;
    visited.add(itemId);
    
    const item = itemsMap.get(itemId);
    if (!item) return;
    
    // First visit all predecessors
    (item.predecessors || []).forEach(pred => {
      visit(pred.id);
    });
    
    result.push(item);
  }
  
  items.forEach(item => visit(item.id));
  
  return result;
}

/**
 * Auto-schedule all items based on their dependencies
 * Returns array of items with updated start_date and end_date
 */
export function autoScheduleItems(items, options = {}) {
  const { skipWeekends = false, projectStartDate = null } = options;
  
  // Create a map for quick lookup
  const itemsMap = new Map(items.map(i => [i.id, { ...i }]));
  
  // Get items in topological order (predecessors first)
  const sortedItems = topologicalSort(items);
  
  // Track which items were updated
  const updates = [];
  
  // Process each item
  for (const originalItem of sortedItems) {
    const item = itemsMap.get(originalItem.id);
    if (!item) continue;
    
    // Skip items without predecessors if they already have dates
    if ((!item.predecessors || item.predecessors.length === 0) && item.start_date) {
      continue;
    }
    
    // Calculate earliest start based on predecessors
    let newStartDate = calculateEarliestStart(item, itemsMap, skipWeekends);
    
    // If no predecessors and no start date, use project start date
    if (!newStartDate && projectStartDate) {
      newStartDate = parseDate(projectStartDate);
    }
    
    if (!newStartDate) continue;
    
    // Calculate end date based on original duration
    const newEndDate = calculateEndDate(
      newStartDate,
      item.start_date,
      item.end_date,
      skipWeekends
    );
    
    // Check if dates changed
    const newStartStr = formatDateStr(newStartDate);
    const newEndStr = formatDateStr(newEndDate);
    
    if (newStartStr !== item.start_date || newEndStr !== item.end_date) {
      // Update the item in our map (for subsequent calculations)
      item.start_date = newStartStr;
      item.end_date = newEndStr;
      itemsMap.set(item.id, item);
      
      updates.push({
        id: item.id,
        start_date: newStartStr,
        end_date: newEndStr
      });
    }
  }
  
  return updates;
}

/**
 * Calculate schedule for a single item (preview mode)
 * Returns the calculated dates without modifying anything
 */
export function previewSchedule(item, items, options = {}) {
  const { skipWeekends = false } = options;
  
  const itemsMap = new Map(items.map(i => [i.id, i]));
  
  const earliestStart = calculateEarliestStart(item, itemsMap, skipWeekends);
  if (!earliestStart) return null;
  
  const endDate = calculateEndDate(
    earliestStart,
    item.start_date,
    item.end_date,
    skipWeekends
  );
  
  return {
    start_date: formatDateStr(earliestStart),
    end_date: formatDateStr(endDate)
  };
}

/**
 * Validate that all predecessors exist and have valid dates
 */
export function validatePredecessors(item, items) {
  const errors = [];
  const predecessors = item.predecessors || [];
  
  const itemsMap = new Map(items.map(i => [i.id, i]));
  
  for (const pred of predecessors) {
    const predItem = itemsMap.get(pred.id);
    
    if (!predItem) {
      errors.push(`Predecessor ${pred.id} not found`);
      continue;
    }
    
    const type = pred.type || 'FS';
    
    // Check if predecessor has required dates
    if ((type === 'FS' || type === 'FF') && !predItem.end_date) {
      errors.push(`Predecessor "${predItem.name}" needs an end date for ${type} dependency`);
    }
    
    if ((type === 'SS' || type === 'SF') && !predItem.start_date) {
      errors.push(`Predecessor "${predItem.name}" needs a start date for ${type} dependency`);
    }
  }
  
  return errors;
}

export default {
  autoScheduleItems,
  previewSchedule,
  validatePredecessors
};
