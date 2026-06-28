const { Op } = require('sequelize');
const User = require('../models/user.model');
const Interest = require('../models/interest.model');
const Follow = require('../models/follow.model');
const { deleteFromBunny } = require('../../../config/bunny');

const FOLLOWER_ATTRS = ['id', 'username', 'fullName', 'profileImage'];

const updateProfile = async (userId, fields, imageFile) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (fields.username && fields.username !== user.username) {
    const taken = await User.findOne({
      where: { username: fields.username, id: { [Op.ne]: userId } },
    });
    if (taken) {
      const err = new Error('Username is already taken');
      err.status = 409;
      throw err;
    }
  }

  if (imageFile) {
    if (user.profileImage) {
      await deleteFromBunny(user.profileImage).catch(() => {});
    }
    fields.profileImage = imageFile.cdnUrl;
  }

  await user.update(fields);
  return user;
};

const saveInterests = async (userId, interests) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  await Interest.destroy({ where: { userId } });

  const rows = [...new Set(interests)].map((interest) => ({ userId, interest }));
  await Interest.bulkCreate(rows);

  return rows.map((r) => r.interest);
};

const getInterests = async (userId) => {
  const interests = await Interest.findAll({
    where: { userId },
    attributes: ['interest'],
    raw: true,
  });
  return interests.map((r) => r.interest);
};

// ── Follow / friend helpers ────────────────────────────────────────────────────

const throwErr = (status, message) => {
  const err = new Error(message);
  err.status = status;
  throw err;
};

const sendFollowRequest = async (requesterId, targetId) => {
  if (requesterId === targetId) throwErr(400, "You can't follow yourself");

  const target = await User.findByPk(targetId);
  if (!target) throwErr(404, 'User not found');

  const existing = await Follow.findOne({ where: { followerId: requesterId, followingId: targetId } });

  if (existing) {
    if (existing.status === 'accepted') throwErr(409, 'Already following this user');
    if (existing.status === 'pending') throwErr(409, 'Follow request already sent');
    // re-request after rejection
    await existing.update({ status: target.isPrivate ? 'pending' : 'accepted' });
    return existing;
  }

  return Follow.create({
    followerId: requesterId,
    followingId: targetId,
    status: target.isPrivate ? 'pending' : 'accepted',
  });
};

const acceptFollowRequest = async (userId, requesterId) => {
  const follow = await Follow.findOne({
    where: { followerId: requesterId, followingId: userId, status: 'pending' },
  });
  if (!follow) throwErr(404, 'Pending follow request not found');
  await follow.update({ status: 'accepted' });
};

const rejectFollowRequest = async (userId, requesterId) => {
  const deleted = await Follow.destroy({
    where: { followerId: requesterId, followingId: userId, status: 'pending' },
  });
  if (!deleted) throwErr(404, 'Pending follow request not found');
};

const unfollow = async (requesterId, targetId) => {
  const deleted = await Follow.destroy({ where: { followerId: requesterId, followingId: targetId } });
  if (!deleted) throwErr(404, 'You are not following this user');
};

const getFollowRequests = async (userId) => {
  const rows = await Follow.findAll({
    where: { followingId: userId, status: 'pending' },
    include: [{ model: User, as: 'follower', attributes: FOLLOWER_ATTRS }],
    order: [['createdAt', 'DESC']],
  });
  return rows.map((r) => r.follower);
};

const getFollowers = async (userId) => {
  const rows = await Follow.findAll({
    where: { followingId: userId, status: 'accepted' },
    include: [{ model: User, as: 'follower', attributes: FOLLOWER_ATTRS }],
  });
  return rows.map((r) => r.follower);
};

const getFollowing = async (userId) => {
  const rows = await Follow.findAll({
    where: { followerId: userId, status: 'accepted' },
    include: [{ model: User, as: 'following', attributes: FOLLOWER_ATTRS }],
  });
  return rows.map((r) => r.following);
};

const getFriends = async (userId) => {
  // Users I follow
  const myFollowing = await Follow.findAll({
    where: { followerId: userId, status: 'accepted' },
    attributes: ['followingId'],
    raw: true,
  });
  const followingIds = myFollowing.map((f) => f.followingId);
  if (!followingIds.length) return [];

  // Of those, who also follows me back
  const mutuals = await Follow.findAll({
    where: { followerId: { [Op.in]: followingIds }, followingId: userId, status: 'accepted' },
    include: [{ model: User, as: 'follower', attributes: FOLLOWER_ATTRS }],
  });
  return mutuals.map((f) => f.follower);
};

// ── Friend suggestions ─────────────────────────────────────────────────────────

// Guard against MySQL's rejection of NOT IN ([]) — use a sentinel UUID that never matches
const SENTINEL = '00000000-0000-0000-0000-000000000000';
const safeNotIn = (arr) => (arr.length ? arr : [SENTINEL]);

const getSuggestions = async (userId, limit = 20) => {
  // Who I follow (accepted)
  const iFollowRows = await Follow.findAll({
    where: { followerId: userId, status: 'accepted' },
    attributes: ['followingId'],
    raw: true,
  });
  const iFollowIds = iFollowRows.map((f) => f.followingId);
  const iFollowSet = new Set(iFollowIds);

  // Who follows me (accepted)
  const followMeRows = await Follow.findAll({
    where: { followingId: userId, status: 'accepted' },
    attributes: ['followerId'],
    raw: true,
  });
  const followMeIds = followMeRows.map((f) => f.followerId);

  // Mutual accepted follows = friends
  const myFriendIds = followMeIds.filter((id) => iFollowSet.has(id));

  // Every user ID I have ANY follow row with (any direction, any status)
  const anyRelationRows = await Follow.findAll({
    where: { [Op.or]: [{ followerId: userId }, { followingId: userId }] },
    attributes: ['followerId', 'followingId'],
    raw: true,
  });
  const allConnectedIds = new Set([userId]);
  anyRelationRows.forEach((f) => {
    allConnectedIds.add(f.followerId);
    allConnectedIds.add(f.followingId);
  });

  // ── 1st degree ─────────────────────────────────────────────────────────────
  // People who already follow me but I haven't followed back yet
  const firstDegreeIds = followMeIds.filter((id) => !iFollowSet.has(id));

  const firstDegree = firstDegreeIds.length
    ? (
        await User.findAll({
          where: { id: { [Op.in]: firstDegreeIds } },
          attributes: FOLLOWER_ATTRS,
          limit,
        })
      ).map((u) => u.toJSON())
    : [];

  // ── 2nd degree ─────────────────────────────────────────────────────────────
  // People my friends follow (accepted), not in any of my existing connections
  let secondDegree = [];
  if (myFriendIds.length) {
    const fofRows = await Follow.findAll({
      where: {
        followerId: { [Op.in]: myFriendIds },
        status: 'accepted',
        followingId: { [Op.notIn]: safeNotIn([...allConnectedIds]) },
      },
      attributes: ['followingId', 'followerId'],
      raw: true,
    });

    // Count mutual friends per candidate
    const mutualMap = {};
    fofRows.forEach(({ followingId, followerId }) => {
      if (!mutualMap[followingId]) mutualMap[followingId] = new Set();
      mutualMap[followingId].add(followerId);
    });

    const fofIds = Object.keys(mutualMap);
    if (fofIds.length) {
      const users = await User.findAll({
        where: { id: { [Op.in]: fofIds } },
        attributes: FOLLOWER_ATTRS,
        limit,
      });
      secondDegree = users
        .map((u) => ({ ...u.toJSON(), mutualFriendsCount: mutualMap[u.id]?.size || 0 }))
        .sort((a, b) => b.mutualFriendsCount - a.mutualFriendsCount);
    }
  }

  // ── 3rd degree ─────────────────────────────────────────────────────────────
  // People that 2nd-degree users follow, not already in my connections or 2nd degree
  const secondDegreeIds = secondDegree.map((u) => u.id);
  const thirdExcludeIds = new Set([...allConnectedIds, ...secondDegreeIds]);

  let thirdDegree = [];
  if (secondDegreeIds.length) {
    const tofRows = await Follow.findAll({
      where: {
        followerId: { [Op.in]: secondDegreeIds },
        status: 'accepted',
        followingId: { [Op.notIn]: safeNotIn([...thirdExcludeIds]) },
      },
      attributes: ['followingId', 'followerId'],
      raw: true,
    });

    // Count how many 2nd-degree connections follow each 3rd-degree candidate
    const tofMap = {};
    tofRows.forEach(({ followingId, followerId }) => {
      if (!tofMap[followingId]) tofMap[followingId] = new Set();
      tofMap[followingId].add(followerId);
    });

    const tofIds = Object.keys(tofMap);
    if (tofIds.length) {
      const users = await User.findAll({
        where: { id: { [Op.in]: tofIds } },
        attributes: FOLLOWER_ATTRS,
        limit,
      });
      thirdDegree = users
        .map((u) => ({ ...u.toJSON(), mutualConnectionsCount: tofMap[u.id]?.size || 0 }))
        .sort((a, b) => b.mutualConnectionsCount - a.mutualConnectionsCount);
    }
  }

  return { firstDegree, secondDegree, thirdDegree };
};

module.exports = {
  updateProfile,
  saveInterests,
  getInterests,
  sendFollowRequest,
  acceptFollowRequest,
  rejectFollowRequest,
  unfollow,
  getFollowRequests,
  getFollowers,
  getFollowing,
  getFriends,
  getSuggestions,
};
