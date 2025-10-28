// server.js — hovedserver for LogisticsMono
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basis-endepunkt
app.get('/', (req, res) => {
  res.json({
    system: 'LogisticsMono API',
    version: '1.0.0',
    status: 'running',
    message: 'Backend for multimodal logistikk aktivert',
  });
});

// Ruter (placeholder)
app.use('/api', require('./routes/index'));

// Start server
app.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
});
