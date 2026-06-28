const commentService = require('../services/comment.service');
const { success, error } = require('../../../utils/response');

const addCommentController = async (req, res, next) => {
  try {
    const comment = await commentService.addComment(
      req.user.id,
      req.contentType,
      req.params.id,
      req.body.text
    );
    return success(res, 201, 'Comment added', comment);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const getCommentsController = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await commentService.getComments(
      req.contentType,
      req.params.id,
      req.user.id,
      { page, limit }
    );
    return success(res, 200, 'Comments fetched', result);
  } catch (err) {
    next(err);
  }
};

const addReplyController = async (req, res, next) => {
  try {
    const reply = await commentService.addComment(
      req.user.id,
      req.contentType,
      req.params.id,
      req.body.text,
      req.params.commentId
    );
    return success(res, 201, 'Reply added', reply);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const getRepliesController = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await commentService.getReplies(
      req.params.commentId,
      req.user.id,
      { page, limit }
    );
    return success(res, 200, 'Replies fetched', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

const deleteCommentController = async (req, res, next) => {
  try {
    const result = await commentService.deleteComment(req.params.commentId, req.user.id);
    if (result.notFound) return error(res, 404, 'Comment not found');
    if (result.forbidden) return error(res, 403, 'You can only delete your own comments');
    return success(res, 200, 'Comment deleted');
  } catch (err) {
    next(err);
  }
};

const likeCommentController = async (req, res, next) => {
  try {
    const result = await commentService.toggleCommentLike(req.user.id, req.params.commentId);
    return success(res, 200, result.liked ? 'Comment liked' : 'Comment unliked', result);
  } catch (err) {
    if (err.status) return error(res, err.status, err.message);
    next(err);
  }
};

module.exports = {
  addCommentController,
  getCommentsController,
  addReplyController,
  getRepliesController,
  deleteCommentController,
  likeCommentController,
};
