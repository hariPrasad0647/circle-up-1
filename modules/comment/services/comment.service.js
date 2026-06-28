const Comment = require('../models/comment.model');
const CommentLike = require('../models/comment_like.model');
const User = require('../../user/models/user.model');
const Post = require('../../post/models/post.model');
const Reel = require('../../reel/models/reel.model');

const findContent = async (contentType, contentId) => {
  const model = contentType === 'post' ? Post : Reel;
  const content = await model.findByPk(contentId);
  if (!content) {
    const err = new Error(`${contentType === 'post' ? 'Post' : 'Reel'} not found`);
    err.status = 404;
    throw err;
  }
  return content;
};

const getCommentStats = async (commentId, viewerId) => {
  const [likeCount, likeRow, replyCount] = await Promise.all([
    CommentLike.count({ where: { commentId } }),
    viewerId ? CommentLike.findOne({ where: { userId: viewerId, commentId } }) : null,
    Comment.count({ where: { parentId: commentId, isDeleted: false } }),
  ]);
  return { likeCount, hasLiked: !!likeRow, replyCount };
};

const formatComment = (comment, stats = {}) => {
  if (comment.isDeleted) {
    return {
      id: comment.id,
      text: null,
      isDeleted: true,
      createdAt: comment.createdAt,
      parentId: comment.parentId || null,
      author: null,
      likeCount: 0,
      hasLiked: false,
      replyCount: stats.replyCount ?? 0,
    };
  }
  return {
    id: comment.id,
    text: comment.text,
    isDeleted: false,
    createdAt: comment.createdAt,
    parentId: comment.parentId || null,
    author: {
      id: comment.author.id,
      username: comment.author.username,
      profileImage: comment.author.profileImage || null,
    },
    likeCount: stats.likeCount ?? 0,
    hasLiked: stats.hasLiked ?? false,
    replyCount: stats.replyCount ?? 0,
  };
};

const addComment = async (userId, contentType, contentId, text, parentId = null) => {
  await findContent(contentType, contentId);

  if (parentId) {
    const parent = await Comment.findOne({ where: { id: parentId, contentType, contentId } });
    if (!parent) {
      const err = new Error('Parent comment not found');
      err.status = 404;
      throw err;
    }
    if (parent.parentId) {
      const err = new Error('Cannot reply to a reply');
      err.status = 400;
      throw err;
    }
  }

  const comment = await Comment.create({ userId, contentType, contentId, text, parentId });
  const full = await Comment.findByPk(comment.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profileImage'] }],
  });
  return formatComment(full, { likeCount: 0, hasLiked: false, replyCount: 0 });
};

const getComments = async (contentType, contentId, viewerId, { page = 1, limit = 20 } = {}) => {
  const offset = (Number(page) - 1) * Number(limit);
  const { count, rows } = await Comment.findAndCountAll({
    where: { contentType, contentId, parentId: null },
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profileImage'] }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  });

  const comments = await Promise.all(
    rows.map(async (c) => {
      const stats = await getCommentStats(c.id, viewerId);
      return formatComment(c, stats);
    })
  );

  return { comments, total: count, page: Number(page), limit: Number(limit) };
};

const getReplies = async (commentId, viewerId, { page = 1, limit = 20 } = {}) => {
  const parent = await Comment.findByPk(commentId);
  if (!parent) {
    const err = new Error('Comment not found');
    err.status = 404;
    throw err;
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { count, rows } = await Comment.findAndCountAll({
    where: { parentId: commentId },
    include: [{ model: User, as: 'author', attributes: ['id', 'username', 'profileImage'] }],
    order: [['createdAt', 'ASC']],
    limit: Number(limit),
    offset,
  });

  const replies = await Promise.all(
    rows.map(async (c) => {
      const stats = await getCommentStats(c.id, viewerId);
      return formatComment(c, stats);
    })
  );

  return { replies, total: count, page: Number(page), limit: Number(limit) };
};

const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findByPk(commentId);
  if (!comment) return { notFound: true };
  if (comment.userId !== userId) return { forbidden: true };
  await comment.update({ isDeleted: true });
  return { deleted: true };
};

const toggleCommentLike = async (userId, commentId) => {
  const comment = await Comment.findByPk(commentId);
  if (!comment || comment.isDeleted) {
    const err = new Error('Comment not found');
    err.status = 404;
    throw err;
  }
  const existing = await CommentLike.findOne({ where: { userId, commentId } });
  if (existing) {
    await existing.destroy();
  } else {
    await CommentLike.create({ userId, commentId });
  }
  const likeCount = await CommentLike.count({ where: { commentId } });
  return { liked: !existing, likeCount };
};

const getCommentCount = async (contentType, contentId) =>
  Comment.count({ where: { contentType, contentId, parentId: null, isDeleted: false } });

module.exports = {
  addComment,
  getComments,
  getReplies,
  deleteComment,
  toggleCommentLike,
  getCommentCount,
};
