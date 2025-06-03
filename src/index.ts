import cors from 'cors';
import express from 'express';
import config from './config';

// Import routes
import activityRoutes from './routes/activity.routes';
import activityTypeRoutes from './routes/activityType.routes';
import authRoutes from './routes/auth.routes';
import competencyRoutes from './routes/competency.routes';
import dashboardRoutes from './routes/dashboard.routes';
import eventRoutes from './routes/event.routes';
import recognizedCourseRoutes from './routes/recognizedCourse.routes';
import uploadRoutes from './routes/upload.routes';
import userRoutes from './routes/user.routes';
// Hapus import submissionRoutes jika ada

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/activity-types', activityTypeRoutes);
app.use('/api/competencies', competencyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/recognized-courses', recognizedCourseRoutes);
app.use('/api/events', eventRoutes);
// Hapus app.use untuk submissionRoutes jika ada

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TIFPoint API' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

