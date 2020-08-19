const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   POST api/posts
// @desc    Create a post
// @access  Private

router.post(
  '/',
  [auth, [check('text', 'Text is required.').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error!');
    }
  }
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error!');
  }
});

// @route   GET api/posts/:post_id
// @desc    Get post by id
// @access  Private

router.get('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).send({ msg: 'No post found!' });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).send({ msg: 'No post found!' });
    }
    res.status(500).send('Server error!');
  }
});

// @route   DELETE api/posts/:post_id
// @desc    DElete post by id
// @access  Private

router.delete('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: 'No post found!' });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).send({ msg: 'You are note authorized!' });
    }

    await post.remove();

    res.send({ msg: 'Post removed.' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).send({ msg: { msg: 'No post found!' } });
    }
    res.status(500).send('Server error!');
  }
});

// @route   PUT api/posts/like/:post_id
// @desc    Like a post
// @access  Private

router.put('/like/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    //check if user already liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'You already liked post' });
    }

    post.likes.unshift({ user: req.user.id }); // unshift permet d'ajouter au début.
    await post.save();

    res.json(post.likes); // dans le front end on ne se servira que de cela.
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error!');
  }
});

// @route   PUT api/posts/like/:post_id
// @desc    Unlike a post
// @access  Private

router.put('/unlike/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    //check if user already liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: "You dind't lik it before." });
    }

    removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes); // dans le front end on ne se servira que de cela.
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error!');
  }
});

// @route   POST api/posts/comment/:post_id
// @desc    Create a comment to the post
// @access  Private

router.put(
  '/comment/:post_id',
  [auth, [check('text', 'Text is required.').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.post_id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error!');
    }
  }
);

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Delete a comment of the post
// @access  Private

router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    // Pull out comment = retirer le commentaire
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist !' });
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'You are not authorized !' });
    }

    removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error!');
  }
});

module.exports = router;
