const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'jwt_secret_default_key', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please add all required fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please add all required fields');
    }

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

// @desc    Google Single Sign-On / Authentication
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    if (!googleId || !email || !name) {
      res.status(400);
      throw new Error('Missing required Google user fields');
    }

    // Find user by googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // Find user by email (in case they signed up via email first)
      user = await User.findOne({ email });

      if (user) {
        // Link Google Account to existing user
        user.googleId = googleId;
        if (avatar) user.avatar = avatar;
        await user.save();
      } else {
        // Create new user with Google Auth details
        user = await User.create({
          name,
          email,
          googleId,
          avatar: avatar || '',
        });
      }
    }

    res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
};
