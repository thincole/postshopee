const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const VideoTask = require('../models/video.model');
const Thread = require('../models/thread.model');

router.get('/', async (req, res) => {
  try {
    const [users, threads, videoStats] = await Promise.all([
      User.getAll(),
      Thread.getAll(),
      VideoTask.getStats()
    ]);
    const usersWithThread = (users || []).map(user => ({
      ...user,
      has_thread: (threads || []).some(t => t.user_id === user.id)
    }));
    res.render('index', {
      users: usersWithThread,
      videoIndex: videoStats?.current || 0,
      totalVideos: videoStats?.total || 0
    });
  } catch (err) {
    console.error('Error rendering index view:', err);
    res.status(500).send(err.message);
  }
});

module.exports = router;