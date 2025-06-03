import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@tifpoint.com' },
      update: {},
      create: {
        email: 'admin@tifpoint.com',
        username: 'admin',
        name: 'Admin TIFPoint',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    console.log('Admin user created:', admin);

    // Create competencies
    const competencies = [
      {
        name: 'Software Developer',
        description: 'Competency in software development',
      },
      {
        name: 'Network Technology',
        description: 'Competency in network technology',
      },
      {
        name: 'Artificial Intelligence',
        description: 'Competency in artificial intelligence',
      },
      {
        name: 'Soft Skills',
        description: 'Competency in soft skills',
      },
    ];

    for (const competency of competencies) {
      await prisma.competency.create({
        data: competency,
      });
    }

    console.log('Competencies created');

    // Create activity types
    const activityTypes = [
      {
        name: 'Seminar',
        description: 'Participation in seminars',
      },
      {
        name: 'Course',
        description: 'Completion of courses',
      },
      {
        name: 'Program',
        description: 'Participation in programs',
      },
      {
        name: 'Research',
        description: 'Involvement in research',
      },
      {
        name: 'Achievement',
        description: 'Awards and achievements',
      },
    ];

    for (const activityType of activityTypes) {
      await prisma.activityType.create({
        data: activityType,
      });
    }

    console.log('Activity types created');

    // Create some sample recognized courses
    const courses = [
      {
        name: 'Intro to Web Development',
        provider: 'Codecademy',
        duration: 40,
        pointValue: 4,
        url: 'https://www.codecademy.com/learn/introduction-to-web-development',
      },
      {
        name: 'Python Programming',
        provider: 'Coursera',
        duration: 60,
        pointValue: 6,
        url: 'https://www.coursera.org/learn/python',
      },
      {
        name: 'Machine Learning Fundamentals',
        provider: 'edX',
        duration: 80,
        pointValue: 8,
        url: 'https://www.edx.org/learn/machine-learning',
      },
    ];

    for (const course of courses) {
      await prisma.recognizedCourse.create({
        data: course,
      });
    }

    console.log('Sample courses created');

    // Create some sample events
    const events = [
      {
        title: 'Seminar Keamanan Jaringan',
        description: 'Seminar tentang keamanan jaringan dan cybersecurity',
        date: new Date(2025, 5, 15), // June 15, 2025
        location: 'Auditorium Kampus',
        pointValue: 2,
      },
      {
        title: 'Workshop Machine Learning',
        description: 'Workshop praktis tentang machine learning dengan TensorFlow',
        date: new Date(2025, 6, 20), // July 20, 2025
        location: 'Lab Komputer 2',
        pointValue: 4,
      },
      {
        title: 'Hackathon TIF 2025',
        description: 'Kompetisi pengembangan aplikasi selama 24 jam',
        date: new Date(2025, 8, 10), // September 10, 2025
        location: 'Gedung Informatika',
        pointValue: 10,
      },
    ];

    for (const event of events) {
      await prisma.event.create({
        data: event,
      });
    }

    console.log('Sample events created');
    
    console.log('Seed data created successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


