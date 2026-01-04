/**
 * RequirementComments Component
 * 
 * Comment thread for requirements. Supports threaded discussions
 * between clients and evaluators.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 9 - Portal Refinement (Task 9.3)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Reply,
  Edit2,
  Trash2,
  Clock,
  User,
  Lock,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { commentsService, COMMENT_USER_TYPE, USER_TYPE_CONFIG } from '../../../services/evaluator';
import './RequirementComments.css';

/**
 * Single Comment Component
 */
function Comment({ 
  comment, 
  currentUserId,
  clientInfo,
  isEvaluator = false,
  onReply, 
  onEdit, 
  onDelete,
  depth = 0 
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment_text);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwn = comment.user_id === currentUserId || 
    (clientInfo && comment.author_email === clientInfo.email);
  const canEdit = isOwn;
  const canDelete = isOwn || isEvaluator;
  const userTypeConfig = USER_TYPE_CONFIG[comment.user_type] || USER_TYPE_CONFIG.evaluator;

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;

    try {
      setIsSubmitting(true);
      await onReply(replyText, comment.id);
      setReplyText('');
      setIsReplying(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!editText.trim()) return;

    try {
      setIsSubmitting(true);
      await onEdit(comment.id, editText);
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const authorName = comment.user?.full_name || comment.author_name || 'Unknown';

  return (
    <div className={`comment ${depth > 0 ? 'reply' : ''} ${comment.is_internal ? 'internal' : ''}`}>
      <div className="comment-header">
        <div className="comment-author">
          <div className="author-avatar">
            {comment.user?.avatar_url ? (
              <img src={comment.user.avatar_url} alt={authorName} />
            ) : (
              <User size={16} />
            )}
          </div>
          <span className="author-name">{authorName}</span>
          <span 
            className="author-type"
            style={{ 
              color: userTypeConfig.color,
              backgroundColor: userTypeConfig.bgColor
            }}
          >
            {userTypeConfig.label}
          </span>
          {comment.is_internal && (
            <span className="internal-badge">
              <Lock size={12} />
              Internal
            </span>
          )}
        </div>
        <div className="comment-meta">
          <span className="comment-time">
            <Clock size={12} />
            {formatDate(comment.created_at)}
            {comment.edited_at && ' (edited)'}
          </span>
        </div>
      </div>

      <div className="comment-body">
        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="edit-actions">
              <button 
                className="btn-cancel"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.comment_text);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-save"
                onClick={handleSubmitEdit}
                disabled={isSubmitting || !editText.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-text">{comment.comment_text}</p>
        )}
      </div>

      {!isEditing && (
        <div className="comment-actions">
          <button 
            className="action-btn reply-btn"
            onClick={() => setIsReplying(!isReplying)}
          >
            <Reply size={14} />
            Reply
          </button>
          {canEdit && (
            <button 
              className="action-btn edit-btn"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={14} />
              Edit
            </button>
          )}
          {canDelete && (
            <button 
              className="action-btn delete-btn"
              onClick={() => onDelete(comment.id)}
            >
              <Trash2 size={14} />
              Delete
            </button>
          )}
        </div>
      )}

      {/* Reply Form */}
      {isReplying && (
        <div className="comment-reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            autoFocus
          />
          <div className="reply-actions">
            <button 
              className="btn-cancel"
              onClick={() => {
                setIsReplying(false);
                setReplyText('');
              }}
            >
              Cancel
            </button>
            <button 
              className="btn-send"
              onClick={handleSubmitReply}
              disabled={isSubmitting || !replyText.trim()}
            >
              <Send size={14} />
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              clientInfo={clientInfo}
              isEvaluator={isEvaluator}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * RequirementComments - Main comments panel
 */
function RequirementComments({ 
  requirementId, 
  currentUserId,
  clientInfo,
  isEvaluator = false,
  isExpanded = true,
  onToggleExpand
}) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await commentsService.getByRequirement(requirementId, {
        threaded: true,
        excludeInternal: !isEvaluator
      });
      setComments(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [requirementId, isEvaluator]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);

      if (clientInfo) {
        // Client portal user
        await commentsService.addClientComment(requirementId, {
          authorName: clientInfo.name,
          authorEmail: clientInfo.email,
          text: newComment
        });
      } else {
        // Regular authenticated user
        await commentsService.addComment(requirementId, {
          userId: currentUserId,
          userType: isEvaluator ? COMMENT_USER_TYPE.EVALUATOR : COMMENT_USER_TYPE.CLIENT,
          text: newComment,
          isInternal
        });
      }

      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (text, parentId) => {
    try {
      if (clientInfo) {
        await commentsService.addClientComment(requirementId, {
          authorName: clientInfo.name,
          authorEmail: clientInfo.email,
          text,
          parentId
        });
      } else {
        await commentsService.addComment(requirementId, {
          userId: currentUserId,
          userType: isEvaluator ? COMMENT_USER_TYPE.EVALUATOR : COMMENT_USER_TYPE.CLIENT,
          text,
          isInternal: false,
          parentId
        });
      }
      fetchComments();
    } catch (err) {
      console.error('Failed to add reply:', err);
      setError('Failed to add reply');
    }
  };

  const handleEdit = async (commentId, newText) => {
    try {
      await commentsService.updateComment(commentId, newText);
      fetchComments();
    } catch (err) {
      console.error('Failed to edit comment:', err);
      setError('Failed to edit comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await commentsService.deleteComment(commentId);
      fetchComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Failed to delete comment');
    }
  };

  return (
    <div className="requirement-comments">
      {/* Header */}
      <div 
        className="comments-header"
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
      >
        <div className="header-title">
          <MessageSquare size={18} />
          <span>Comments</span>
          <span className="comment-count">{comments.length}</span>
        </div>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isExpanded && (
        <div className="comments-content">
          {/* Error */}
          {error && (
            <div className="comments-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Comments List */}
          {isLoading ? (
            <div className="comments-loading">
              <div className="spinner-small" />
              <span>Loading comments...</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="comments-empty">
              <MessageSquare size={32} />
              <p>No comments yet</p>
              <span>Be the first to comment on this requirement</span>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map(comment => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  clientInfo={clientInfo}
                  isEvaluator={isEvaluator}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {/* New Comment Form */}
          <div className="new-comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <div className="new-comment-actions">
              {isEvaluator && (
                <label className="internal-toggle">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                  />
                  <Lock size={14} />
                  Internal only
                </label>
              )}
              <button
                className="btn-submit"
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
              >
                <Send size={16} />
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequirementComments;
