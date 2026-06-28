const path = require('path');
const { createUpload } = require('../config/multer');
const { uploadToBunny } = require('../config/bunny');
const { error } = require('../utils/response');

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

const imageUpload = createUpload(IMAGE_EXTS, parseInt(process.env.MAX_FILE_SIZE) || 5242880);
const reelUpload = createUpload(
  [...VIDEO_EXTS, ...IMAGE_EXTS],
  parseInt(process.env.MAX_VIDEO_SIZE) || 104857600
);
const chatUpload = createUpload(
  [...IMAGE_EXTS, ...VIDEO_EXTS],
  parseInt(process.env.MAX_VIDEO_SIZE) || 104857600
);

const handleMulterError = (err, res, videoMode = false) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    const limit = videoMode ? '100MB' : '5MB';
    return error(res, 413, `File too large. Maximum allowed size is ${limit}`);
  }
  return error(res, 400, err.message);
};

// ── Profile image ─────────────────────────────────────────────────────────────

const uploadProfileImage = (req, res, next) => {
  imageUpload.single('profileImage')(req, res, async (err) => {
    if (err) return handleMulterError(err, res);
    if (!req.file) return next();
    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const filename = `${req.user.id}_${Date.now()}${ext}`;
      req.file.cdnUrl = await uploadToBunny(req.file.buffer, `profile-images/${filename}`);
      next();
    } catch {
      return error(res, 500, 'Failed to upload image. Please try again.');
    }
  });
};

// ── Post images (up to 10) ────────────────────────────────────────────────────

const uploadPostImages = (req, res, next) => {
  imageUpload.array('images', 10)(req, res, async (err) => {
    if (err) return handleMulterError(err, res);
    if (!req.files || req.files.length === 0) return next();
    try {
      const timestamp = Date.now();
      req.cdnUrls = await Promise.all(
        req.files.map((file, i) => {
          const ext = path.extname(file.originalname).toLowerCase();
          return uploadToBunny(file.buffer, `posts/${req.user.id}_${timestamp}_${i}${ext}`);
        })
      );
      next();
    } catch {
      return error(res, 500, 'Failed to upload images. Please try again.');
    }
  });
};

// ── Reel (video + optional thumbnail) ────────────────────────────────────────

const uploadReel = (req, res, next) => {
  reelUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ])(req, res, async (err) => {
    if (err) return handleMulterError(err, res, true);
    if (!req.files || !req.files.video) return next();

    try {
      const timestamp = Date.now();
      const videoFile = req.files.video[0];
      const videoExt = path.extname(videoFile.originalname).toLowerCase();
      const videoPath = `reels/videos/${req.user.id}_${timestamp}${videoExt}`;

      const thumbFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
      const thumbPath = thumbFile
        ? `reels/thumbnails/${req.user.id}_${timestamp}${path.extname(thumbFile.originalname).toLowerCase()}`
        : null;

      const [videoUrl, thumbnailUrl] = await Promise.all([
        uploadToBunny(videoFile.buffer, videoPath),
        thumbFile ? uploadToBunny(thumbFile.buffer, thumbPath) : Promise.resolve(null),
      ]);

      req.reelUpload = { videoUrl, thumbnailUrl };
      next();
    } catch {
      return error(res, 500, 'Failed to upload reel. Please try again.');
    }
  });
};

// ── Chat media (single image or video) ───────────────────────────────────────

const uploadChatMedia = (req, res, next) => {
  chatUpload.single('file')(req, res, async (err) => {
    if (err) return handleMulterError(err, res, true);
    if (!req.file) return next();
    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const isVideo = VIDEO_EXTS.includes(ext);
      const folder = isVideo ? 'chat/videos' : 'chat/images';
      const filename = `${req.user.id}_${Date.now()}${ext}`;
      const mediaUrl = await uploadToBunny(req.file.buffer, `${folder}/${filename}`);
      req.chatUpload = { mediaUrl, mediaType: isVideo ? 'video' : 'image' };
      next();
    } catch {
      return error(res, 500, 'Failed to upload file. Please try again.');
    }
  });
};

// ── Story (single image or video, 24-hour lifespan) ───────────────────────────

const uploadStory = (req, res, next) => {
  chatUpload.single('file')(req, res, async (err) => {
    if (err) return handleMulterError(err, res, true);
    if (!req.file) return next();
    try {
      const ext = path.extname(req.file.originalname).toLowerCase();
      const isVideo = VIDEO_EXTS.includes(ext);
      const folder = isVideo ? 'stories/videos' : 'stories/images';
      const filename = `${req.user.id}_${Date.now()}${ext}`;
      const mediaUrl = await uploadToBunny(req.file.buffer, `${folder}/${filename}`);
      req.storyUpload = { mediaUrl, mediaType: isVideo ? 'video' : 'image' };
      next();
    } catch {
      return error(res, 500, 'Failed to upload story. Please try again.');
    }
  });
};

module.exports = { uploadProfileImage, uploadPostImages, uploadReel, uploadChatMedia, uploadStory };
