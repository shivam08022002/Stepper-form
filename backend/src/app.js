import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';

import { connectDB } from './config/db.js';
import { seedWellnessIntake } from './seeds/wellnessIntake.js';

import formConfigsRouter from './routes/formConfigs.js';
import submissionsRouter from './routes/submissions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/form-configs', formConfigsRouter);
app.use('/api/submissions', submissionsRouter);

app.get('/', (req, res) => {
  res.type('text/plain').send('Stepper Form API Server is running successfully');
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Stepper Form API is healthy' });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({ error: 'Resource not found. Invalid ID format.' });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error'
  });
});

const startServer = async () => {
  try {
    await connectDB();
    await seedWellnessIntake();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
