const User = require('../../user/models/user.model');
const Post = require('../models/post.model');
const PostMedia = require('../models/post_media.model');
const Hashtag = require('../models/hashtag.model');
const PostHashtag = require('../models/post_hashtag.model');
const PostMention = require('../models/post_mention.model');

const extractHashtags = (text) => {
  const matches = text.match(/#([a-zA-Z0-9_]+)/g) || [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
};

const extractMentions = (text) => {
  const matches = text.match(/@([a-zA-Z0-9_.]+)/g) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
};

const formatPost = (post, stats = {}) => ({
  id: post.id,
  caption: post.caption,
  isPrivate: post.isPrivate,
  createdAt: post.createdAt,
  author: {
    id: post.author.id,
    username: post.author.username,
    fullName: post.author.fullName,
    profileImage: post.author.profileImage || null,
  },
  media: post.media.sort((a, b) => a.order - b.order).map((m) => m.mediaUrl),
  hashtags: post.hashtags.map((h) => h.name),
  mentions: post.mentions.map((m) => ({
    id: m.mentionedUser.id,
    username: m.mentionedUser.username,
    profileImage: m.mentionedUser.profileImage || null,
  })),
  likeCount: stats.likeCount ?? 0,
  saveCount: stats.saveCount ?? 0,
  shareCount: stats.shareCount ?? 0,
  hasLiked: stats.hasLiked ?? false,
  hasSaved: stats.hasSaved ?? false,
});

const getPostById = async (postId) => {
  const post = await Post.findByPk(postId, {
    include: [
      { model: User, as: 'author', attributes: ['id', 'username', 'fullName', 'profileImage'] },
      { model: PostMedia, as: 'media', attributes: ['mediaUrl', 'order'] },
      { model: Hashtag, as: 'hashtags', attributes: ['name'], through: { attributes: [] } },
      {
        model: PostMention,
        as: 'mentions',
        include: [
          { model: User, as: 'mentionedUser', attributes: ['id', 'username', 'profileImage'] },
        ],
      },
    ],
  });
  return post;
};

const createPost = async (userId, { caption, isPrivate = false }, cdnUrls) => {
  const post = await Post.create({ userId, caption: caption || null, isPrivate });

  // Store media in order
  await PostMedia.bulkCreate(
    cdnUrls.map((url, i) => ({ postId: post.id, mediaUrl: url, order: i }))
  );

  if (caption) {
    // Hashtags
    const tagNames = extractHashtags(caption);
    if (tagNames.length) {
      const tagRecords = await Promise.all(
        tagNames.map((name) => Hashtag.findOrCreate({ where: { name }, defaults: { name } }))
      );
      await PostHashtag.bulkCreate(
        tagRecords.map(([h]) => ({ postId: post.id, hashtagId: h.id }))
      );
    }

    // Mentions
    const usernames = extractMentions(caption);
    if (usernames.length) {
      const mentionedUsers = await User.findAll({ where: { username: usernames } });
      if (mentionedUsers.length) {
        await PostMention.bulkCreate(
          mentionedUsers.map((u) => ({ postId: post.id, mentionedUserId: u.id }))
        );
      }
    }
  }

  return formatPost(await getPostById(post.id));
};

module.exports = { createPost, getPostById, formatPost };
