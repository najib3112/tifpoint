import cors from 'cors';
import express from 'express';
import config from './config';

// Import routes
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import recognizedCourseRoutes from './routes/recognizedCourse.routes';
import submissionRoutes from './routes/submission.routes';
import uploadRoutes from './routes/upload.routes';
import userRoutes from './routes/user.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/recognized-courses', recognizedCourseRoutes);
app.use('/api/events', eventRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TIFPoint API' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});