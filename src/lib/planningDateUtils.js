/**
 * Planning Date Utilities
 *
 * Handles automatic date synchronization when start_date, end_date, or duration_days change.
 * Used by PlannerGrid.jsx to keep date fields consistent.
 *
 * @version 1.0
 * @created 15 January 2026
 */

import { differenceInDays, addDays, parseISO, format, isValid } from 'date-fns';

/**
 * Calculate synchronized date updates when a date field changes.
 *
 * Logic:
 * - start_date changes:
 *   - If end_date is null or before start_date: set end_date = start_date, duration = 1
 *   - If end_date exists and is after start_date: calculate duration_days
 * - end_date changes:
 *   - Calculate duration_days from start_date to end_date
 * - duration_days changes:
 *   - Calculate end_date from start_date + duration
 *
 * @param {string} field - The field that was changed ('start_date', 'end_date', 'duration_days')
 * @param {any} newValue - The new value for the field
 * @param {Object} currentItem - The current item data
 * @returns {Object} - Object containing all fields that should be updated
 */
export function getDateSyncUpdates(field, newValue, currentItem) {
  const updates = { [field]: newValue };

  // Handle start_date changes
  if (field === 'start_date') {
    if (!newValue) {
      // Clearing start_date - also clear duration (end_date can stay)
      updates.duration_days = null;
      return updates;
    }

    const startDate = parseISO(newValue);
    if (!isValid(startDate)) {
      return updates;
    }

    const endDate = currentItem.end_date ? parseISO(currentItem.end_date) : null;

    if (!endDate || !isValid(endDate) || endDate < startDate) {
      // No end_date or end_date is before new start_date
      // Set end_date = start_date (minimum), duration = 1
      updates.end_date = newValue;
      updates.duration_days = 1;
    } else {
      // end_date exists and is after start_date
      // Calculate duration from the date range
      updates.duration_days = differenceInDays(endDate, startDate) + 1;
    }
  }

  // Handle end_date changes
  if (field === 'end_date') {
    if (!newValue) {
      // Clearing end_date - also clear duration
      updates.duration_days = null;
      return updates;
    }

    if (!currentItem.start_date) {
      // No start_date to calculate from
      return updates;
    }

    const startDate = parseISO(currentItem.start_date);
    const endDate = parseISO(newValue);

    if (!isValid(startDate) || !isValid(endDate)) {
      return updates;
    }

    // Ensure end_date is not before start_date
    if (endDate < startDate) {
      // End date before start - adjust to match start
      updates.end_date = currentItem.start_date;
      updates.duration_days = 1;
    } else {
      // Calculate duration
      updates.duration_days = differenceInDays(endDate, startDate) + 1;
    }
  }

  // Handle duration_days changes
  if (field === 'duration_days') {
    if (!newValue || newValue < 1) {
      // Invalid duration - set minimum of 1
      updates.duration_days = 1;
      newValue = 1;
    }

    if (!currentItem.start_date) {
      // No start_date to calculate from
      return updates;
    }

    const startDate = parseISO(currentItem.start_date);

    if (!isValid(startDate)) {
      return updates;
    }

    // Calculate end_date from start_date + duration
    // Duration of 1 means same day, so subtract 1 from duration for addDays
    const endDate = addDays(startDate, Math.max(0, newValue - 1));
    updates.end_date = format(endDate, 'yyyy-MM-dd');
  }

  return updates;
}

/**
 * Calculate duration in days between two dates (inclusive).
 *
 * @param {string} startDate - Start date string (YYYY-MM-DD)
 * @param {string} endDate - End date string (YYYY-MM-DD)
 * @returns {number|null} - Duration in days, or null if dates are invalid
 */
export function calculateDuration(startDate, endDate) {
  if (!startDate || !endDate) return null;

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (!isValid(start) || !isValid(end)) return null;
  if (end < start) return null;

  return differenceInDays(end, start) + 1;
}

/**
 * Calculate end date from start date and duration.
 *
 * @param {string} startDate - Start date string (YYYY-MM-DD)
 * @param {number} durationDays - Duration in days
 * @returns {string|null} - End date string (YYYY-MM-DD), or null if inputs are invalid
 */
export function calculateEndDate(startDate, durationDays) {
  if (!startDate || !durationDays || durationDays < 1) return null;

  const start = parseISO(startDate);
  if (!isValid(start)) return null;

  const end = addDays(start, durationDays - 1);
  return format(end, 'yyyy-MM-dd');
}

/**
 * Validate that end_date is not before start_date.
 *
 * @param {string} startDate - Start date string (YYYY-MM-DD)
 * @param {string} endDate - End date string (YYYY-MM-DD)
 * @returns {boolean} - True if dates are valid (end >= start or either is null)
 */
export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return true;

  const start = parseISO(startDate);
  const end = parseISO(endDate);

  if (!isValid(start) || !isValid(end)) return true;

  return end >= start;
}
