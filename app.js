const express = require('express');
const cors = require('cors');
const uploadRoutes = require('./routes/upload');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());

// Secure CORS config from env
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  methods: ['POST'],
  credentials: true,
}));


app.get('/test', (req, res) => {
  res.json({ message: 'Dummy endpoint is working!' });
});


// Routes
app.use('/upload', uploadRoutes);

// Boot server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
