const express =  require ("express");
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors =  require('cors')

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// // Connect to MongoDB
mongoose.connect('mongodb+srv://faisaldeepto:6MW8GPqpbWnZoi37@part1.x3hquza.mongodb.net/task_manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Set up session middleware
app.use(session(
  {
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  }
));

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/login', (req, res) => {
  res.render('signin');
});

const userRegister = require("./models/userRegister")

app.post("/signup",async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    // Checking if the username is already taken
    const existingUser = await userRegister.findOne({ email });
    if (existingUser) {
      return res.status(409).send('Username already exists');
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user in the database
    await userRegister.create({
      email,
      password: hashedPassword,
    });

    res.redirect('/signin');
  } catch (error) {
    // Handle any errors that occurred during the registration process
    res.status(500).send('Internal Server Error');
  }
}
)

app.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    // Find the user in the database
    const user = await userRegister.findOne({ email });

    // If the user is not found, redirect to the login page
    if (!user) {
      return res.redirect('/sign');
    }

    // Compare the provided password with the hashed password stored in the database
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    // If the password is incorrect, redirect to the login page
    if (!isPasswordCorrect) {
      return res.redirect('/signin');
    }

    // Set up the session
    req.session.loggedIn = true;
    req.session.username = username;

    res.redirect('/task');
  } catch (error) {
    // Handle any errors that occurred during the login process
    res.status(500).send('Internal Server Error');
  }
});

const Task = require('./models/task');

app.get('/task', async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/signin');
  }

  // Fetch tasks from MongoDB
  const tasks = await Task.find({}).exec();
  res.render('task', { tasks });
});

app.post('/add-task', async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }

  const taskName = req.body.task;

  // Save the task to MongoDB
  const newTask = new Task({ name: taskName });
  await newTask.save();

  res.redirect('/task');
});

app.get('/mark-done/:id', async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }

  const taskId = req.params.id;

  // Update task status in MongoDB
  await Task.findByIdAndUpdate(taskId, { done: true });

  res.redirect('/task');
});

module.exports = app;