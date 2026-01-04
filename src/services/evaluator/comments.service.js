/**
 * Comments Service
 * 
 * Handles requirement comments for the Evaluator tool.
 * Supports threaded discussions between clients and evaluators.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 9 - Portal Refinement (Task 9.3)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

/**
 * User type constants for comments
 */
export const COMMENT_USER_TYPE = {
  ADMIN: 'admin',
  EVALUATOR: 'evaluator',
  CLIENT: 'client',
  VENDOR: 'vendor'
};

/**
 * User type configuration for display
 */
export const USER_TYPE_CONFIG = {
  [COMMENT_USER_TYPE.ADMIN]: {
    label: 'Admin',
    color: '#8b5cf6',
    bgColor: '#f5f3ff'
  },
  [COMMENT_USER_TYPE.EVALUATOR]: {
    label: 'Evaluator',
    color: '#2563eb',
    bgColor: '#eff6ff'
  },
  [COMMENT_USER_TYPE.CLIENT]: {
    label: 'Client',
    color: '#059669',
    bgColor: '#ecfdf5'
  },
  [COMMENT_USER_TYPE.VENDOR]: {
    label: 'Vendor',
    color: '#d97706',
    bgColor: '#fffbeb'
  }
};

export class CommentsService extends EvaluatorBaseService {
  constructor() {
    super('requirement_comments', {
      supportsSoftDelete: false,
      sanitizeConfig: null
    });
  }

  /**
   * Get comments for a requirement
   * @param {string} requirementId - Requirement UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of comments
   */
  async getByRequirement(requirementId, options = {}) {
    try {
      let query = supabase
        .from('requirement_comments')
        .select(`
          *,
          user:profiles!user_id(id, full_name, email, avatar_url)
        `)
        .eq('requirement_id', requirementId)
        .order('created_at', { ascending: true });

      // Filter internal comments if user is not admin/evaluator
      if (options.excludeInternal) {
        query = query.eq('is_internal', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Organize into threads if needed
      if (options.threaded) {
        return this.organizeIntoThreads(data || []);
      }

      return data || [];
    } catch (error) {
      console.error('CommentsService getByRequirement failed:', error);
      throw error;
    }
  }

  /**
   * Organize comments into threaded structure
   * @param {Array} comments - Flat array of comments
   * @returns {Array} Threaded comments array
   */
  organizeIntoThreads(comments) {
    const rootComments = [];
    const commentMap = new Map();

    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into threads
    comments.forEach(comment => {
      const mappedComment = commentMap.get(comment.id);
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(mappedComment);
        } else {
          // Parent was deleted, treat as root
          rootComments.push(mappedComment);
        }
      } else {
        rootComments.push(mappedComment);
      }
    });

    return rootComments;
  }

  /**
   * Get comment count and unread count for a requirement
   * @param {string} requirementId - Requirement UUID
   * @param {string} userId - Current user UUID for unread calculation
   * @returns {Promise<Object>} Count statistics
   */
  async getCommentStats(requirementId, userId = null) {
    try {
      const { data, error } = await supabase
        .from('requirement_comments')
        .select('id, read_by, is_internal')
        .eq('requirement_id', requirementId);

      if (error) throw error;

      const comments = data || [];
      const total = comments.length;
      const publicComments = comments.filter(c => !c.is_internal).length;
      
      let unread = 0;
      if (userId) {
        unread = comments.filter(c => {
          const readBy = c.read_by || [];
          return !readBy.includes(userId);
        }).length;
      }

      return {
        total,
        public: publicComments,
        internal: total - publicComments,
        unread
      };
    } catch (error) {
      console.error('CommentsService getCommentStats failed:', error);
      throw error;
    }
  }

  /**
   * Get comment counts for multiple requirements
   * @param {Array<string>} requirementIds - Array of requirement UUIDs
   * @returns {Promise<Object>} Map of requirement ID to comment count
   */
  async getCommentCounts(requirementIds) {
    try {
      const { data, error } = await supabase
        .from('requirement_comments')
        .select('requirement_id')
        .in('requirement_id', requirementIds);

      if (error) throw error;

      const counts = {};
      requirementIds.forEach(id => { counts[id] = 0; });
      
      (data || []).forEach(comment => {
        counts[comment.requirement_id] = (counts[comment.requirement_id] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error('CommentsService getCommentCounts failed:', error);
      throw error;
    }
  }

  /**
   * Add a comment to a requirement
   * @param {string} requirementId - Requirement UUID
   * @param {Object} comment - Comment data
   * @returns {Promise<Object>} Created comment
   */
  async addComment(requirementId, comment) {
    try {
      const { data, error } = await supabase
        .from('requirement_comments')
        .insert({
          requirement_id: requirementId,
          user_id: comment.userId || null,
          user_type: comment.userType || COMMENT_USER_TYPE.EVALUATOR,
          author_name: comment.authorName || null,
          author_email: comment.authorEmail || null,
          comment_text: comment.text,
          is_internal: comment.isInternal || false,
          parent_comment_id: comment.parentId || null,
          read_by: comment.userId ? [comment.userId] : []
        })
        .select(`
          *,
          user:profiles!user_id(id, full_name, email, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('CommentsService addComment failed:', error);
      throw error;
    }
  }

  /**
   * Add a client comment (from portal without auth)
   * @param {string} requirementId - Requirement UUID
   * @param {Object} comment - Comment data with authorName and authorEmail
   * @returns {Promise<Object>} Created comment
   */
  async addClientComment(requirementId, comment) {
    return this.addComment(requirementId, {
      authorName: comment.authorName,
      authorEmail: comment.authorEmail,
      userType: COMMENT_USER_TYPE.CLIENT,
      text: comment.text,
      isInternal: false,
      parentId: comment.parentId
    });
  }

  /**
   * Update a comment
   * @param {string} commentId - Comment UUID
   * @param {string} newText - Updated comment text
   * @returns {Promise<Object>} Updated comment
   */
  async updateComment(commentId, newText) {
    try {
      const { data, error } = await supabase
        .from('requirement_comments')
        .update({
          comment_text: newText,
          edited_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('CommentsService updateComment failed:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment UUID
   * @returns {Promise<void>}
   */
  async deleteComment(commentId) {
    try {
      const { error } = await supabase
        .from('requirement_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    } catch (error) {
      console.error('CommentsService deleteComment failed:', error);
      throw error;
    }
  }

  /**
   * Mark comments as read by user
   * @param {Array<string>} commentIds - Array of comment UUIDs
   * @param {string} userId - User UUID
   * @returns {Promise<void>}
   */
  async markAsRead(commentIds, userId) {
    try {
      // Get current read_by for each comment
      const { data: comments, error: fetchError } = await supabase
        .from('requirement_comments')
        .select('id, read_by')
        .in('id', commentIds);

      if (fetchError) throw fetchError;

      // Update each comment's read_by array
      const updates = (comments || []).map(async (comment) => {
        const readBy = comment.read_by || [];
        if (!readBy.includes(userId)) {
          const { error } = await supabase
            .from('requirement_comments')
            .update({ read_by: [...readBy, userId] })
            .eq('id', comment.id);
          if (error) throw error;
        }
      });

      await Promise.all(updates);
    } catch (error) {
      console.error('CommentsService markAsRead failed:', error);
      throw error;
    }
  }

  /**
   * Get unread comment count for a user across all requirements in an evaluation
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Unread counts by requirement
   */
  async getUnreadCounts(evaluationProjectId, userId) {
    try {
      const { data, error } = await supabase
        .from('requirement_comments')
        .select(`
          id,
          requirement_id,
          read_by,
          requirement:requirements!requirement_id(evaluation_project_id)
        `)
        .eq('requirement.evaluation_project_id', evaluationProjectId);

      if (error) throw error;

      const unreadByRequirement = {};
      let totalUnread = 0;

      (data || []).forEach(comment => {
        const readBy = comment.read_by || [];
        if (!readBy.includes(userId)) {
          unreadByRequirement[comment.requirement_id] = (unreadByRequirement[comment.requirement_id] || 0) + 1;
          totalUnread++;
        }
      });

      return {
        total: totalUnread,
        byRequirement: unreadByRequirement
      };
    } catch (error) {
      console.error('CommentsService getUnreadCounts failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const commentsService = new CommentsService();
