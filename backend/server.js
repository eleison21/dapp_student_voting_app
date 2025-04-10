const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Define paths to JSON files
const STUDENTS_FILE = path.join(__dirname, 'students.json');
const ADMINS_FILE = path.join(__dirname, 'admins.json');

// Student Login Endpoint
app.post('/login/student', (req, res) => {
  const { name, studentNumber } = req.body;
  if (!name || !studentNumber) {
    return res.status(400).json({ error: 'Name and student number required.' });
  }
  fs.readFile(STUDENTS_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
    let students;
    try {
      students = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Error parsing student data.' });
    }
    // Validate student credentials
    const found = students.find(
      (student) => student.name === name && student.studentNumber === studentNumber
    );
    if (found) {
      return res.json({ success: true, message: 'Student login successful.' });
    } else {
      return res.status(401).json({ error: 'Invalid student credentials.' });
    }
  });
});

// Admin Login Endpoint
app.post('/login/admin', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  fs.readFile(ADMINS_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
    let admins;
    try {
      admins = JSON.parse(data);
    } catch (e) {
      return res.status(500).json({ error: 'Error parsing admin data.' });
    }
    // Validate admin credentials
    const found = admins.find(
      (admin) => admin.username === username && admin.password === password
    );
    if (found) {
      return res.json({ success: true, message: 'Admin login successful.' });
    } else {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }
  });
});

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '../public')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
