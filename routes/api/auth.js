const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route   Get api/auth
// @desc    Test route
// @access  Public

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error({ msg: err.message });
    res.status(500).send('Server error');
  }
});

// @route   Post api/auth
// @desc    Test route
// @access  Public

router.post(
  '/',
  [
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'You must enter a password').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .send({ errors: [{ msg: 'Invalid credential' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        res.status(400).send({ errors: [{ msg: 'Invalid credential' }] });
      }

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 36000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
