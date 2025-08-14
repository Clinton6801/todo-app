// server.js - The complete backend server for the To-Do application

require('dotenv').config();

// Import required libraries
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
// This allows the server to parse JSON data from incoming requests
app.use(express.json());
// This enables Cross-Origin Resource Sharing, allowing your React frontend to communicate with this backend
app.use(cors({
  origin: 'https://todo-appp-2c6.pages.dev' // This is the most secure option
}));

// IMPORTANT: Replace this with your actual MongoDB connection string from Atlas.
// This is the bridge between your server and your database.
const MONGODB_URI = process.env.MONGODB_URI;

// IMPORTANT: This is a secret key used to sign and verify your JWTs.
// In a production environment, this must be a strong, random string stored in an environment variable.
const JWT_SECRET = process.env.JWT_SECRET;

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB Atlas successfully!');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

// --- Database Schemas and Models ---

// The schema for a user, containing all the new fields in the requested order
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  purpose: {
    type: String,
    required: true,
    trim: true,
  },
});

// The schema for a to-do task. Each task belongs to a specific user.
const TodoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  // The 'owner' field links a task to a user's ID
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // This tells Mongoose the ID refers to a document in the 'User' collection
  },
});

// Create the Mongoose models from the schemas
const User = mongoose.model('User', UserSchema);
const Todo = mongoose.model('Todo', TodoSchema);

// --- Middleware for JWT Authentication ---

// This function will be used to protect all To-Do list routes.
// It checks for a valid JWT in the request header and authenticates the user.
const authMiddleware = async (req, res, next) => {
  try {
    // Get the token from the Authorization header (e.g., "Bearer YOUR_TOKEN_HERE")
    const token = req.header('Authorization').replace('Bearer ', '');
    // Verify the token using the secret key
    const decoded = jwt.verify(token, JWT_SECRET);
    // Find the user by the ID stored in the token's payload
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      throw new Error();
    }

    // Attach the user and token to the request object for use in other routes
    req.token = token;
    req.user = user;
    next(); // Move on to the next function in the route handler
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// --- API Endpoints for Authentication ---

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, dob, gender, username, purpose } = req.body;
       console.log('Received registration data:', req.body);
    // Check if the email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ message: 'Email already in use.' });
      } else {
        return res.status(409).json({ message: 'Username already taken.' });
      }
    }

    // Add a simple GET route for the root URL
app.get('/', (req, res) => {
  res.send('Your backend server is running and ready!');
});

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    // ... all your registration logic ...
  } catch (error) {
    // ... error handling ...
  }
});

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user with all the new fields
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      dob,
      gender,
      username,
      purpose,
    });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by their email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // If passwords match, create a JSON Web Token (JWT)
    const token = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // Send the token, user ID, and username back to the client
    res.json({ token, userId: user._id, username: user.username, message: 'Login successful.' });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// --- Protected API Endpoints for To-Do Items ---
// The `authMiddleware` is applied here to protect all these routes.

// Fetch all To-Do items for the authenticated user
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    // Find all tasks that belong to the logged-in user
    const tasks = await Todo.find({ owner: req.user._id });
    res.status(200).send(tasks);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch tasks.' });
  }
});

// Create a new To-Do item for the authenticated user
app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const todo = new Todo({
      ...req.body, // The text of the task
      owner: req.user._id, // Assign the logged-in user as the owner
    });
    await todo.save();
    res.status(201).send(todo);
  } catch (error) {
    res.status(400).send({ error: 'Failed to create task.' });
  }
});

// Update a To-Do item for the authenticated user
app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, owner: req.user._id });

    if (!todo) {
      return res.status(404).send({ error: 'Task not found.' });
    }

    // Update the task properties
    Object.assign(todo, req.body);
    await todo.save();

    res.send(todo);
  } catch (error) {
    res.status(400).send({ error: 'Failed to update task.' });
  }
});

// Delete a To-Do item for the authenticated user
app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

    if (!todo) {
      return res.status(404).send({ error: 'Task not found.' });
    }

    res.send(todo);
  } catch (error) {
    res.status(500).send({ error: 'Failed to delete task.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
