/**
 * Standards Service
 * 
 * Handles network standards data operations.
 * Standards are the 32 technical network standards being documented.
 * 
 * @version 1.0
 * @created 1 December 2025
 * @phase Service Layer Migration - Phase 1 Completion
 */

import { BaseService } from './base.service';

export class StandardsService extends BaseService {
  constructor() {
    super('standards', {
      supportsSoftDelete: false,
      sanitizeConfig: 'standard'
    });
  }

  /**
   * Get all standards ordered by reference
   */
  async getAll(projectId) {
    return super.getAll(projectId, {
      orderBy: { column: 'standard_ref', ascending: true }
    });
  }

  /**
   * Get standards by status
   */
  async getByStatus(projectId, status) {
    return super.getAll(projectId, {
      filters: [{ column: 'status', operator: 'eq', value: status }],
      orderBy: { column: 'standard_ref', ascending: true }
    });
  }

  /**
   * Get standards by category
   */
  async getByCategory(projectId, category) {
    return super.getAll(projectId, {
      filters: [{ column: 'category', operator: 'eq', value: category }],
      orderBy: { column: 'standard_ref', ascending: true }
    });
  }

  /**
   * Get completion summary
   */
  async getSummary(projectId) {
    try {
      const standards = await this.getAll(projectId);
      
      return {
        total: standards.length,
        completed: standards.filter(s => s.status === 'Completed').length,
        inProgress: standards.filter(s => s.status === 'In Progress').length,
        notStarted: standards.filter(s => !s.status || s.status === 'Not Started').length
      };
    } catch (error) {
      console.error('StandardsService getSummary error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const standardsService = new StandardsService();
export default standardsService;
