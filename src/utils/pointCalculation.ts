import prisma from './prisma';

// Type assertion to fix Prisma TypeScript issues
const db = prisma as any;

export const TARGET_POINTS = 36;

export interface StudentProgress {
  totalPoints: number;
  targetPoints: number;
  completionPercentage: number;
  remainingPoints: number;
  isCompleted: boolean;
}

export interface ActivitySummary {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// Calculate student progress based on approved activities
export const calculateStudentProgress = async (userId: string): Promise<StudentProgress> => {
  const approvedActivities = await db.activity.findMany({
    where: {
      userId,
      status: 'APPROVED'
    },
    select: { point: true }
  });

  const totalPoints = approvedActivities.reduce((sum: number, activity: any) => {
    return sum + (activity.point || 0);
  }, 0);

  const completionPercentage = Math.min((totalPoints / TARGET_POINTS) * 100, 100);

  return {
    totalPoints,
    targetPoints: TARGET_POINTS,
    completionPercentage: Math.round(completionPercentage * 100) / 100,
    remainingPoints: Math.max(TARGET_POINTS - totalPoints, 0),
    isCompleted: totalPoints >= TARGET_POINTS
  };
};

// Get activity summary for a user
export const getActivitySummary = async (userId: string): Promise<ActivitySummary> => {
  const [pending, approved, rejected, total] = await Promise.all([
    db.activity.count({ where: { userId, status: 'PENDING' } }),
    db.activity.count({ where: { userId, status: 'APPROVED' } }),
    db.activity.count({ where: { userId, status: 'REJECTED' } }),
    db.activity.count({ where: { userId } })
  ]);

  return { pending, approved, rejected, total };
};

// Calculate points by competency for a user
export const getPointsByCompetency = async (userId: string) => {
  const pointsByCompetency = await db.activity.groupBy({
    by: ['competencyId'],
    where: {
      userId,
      status: 'APPROVED'
    },
    _sum: {
      point: true
    }
  });

  const competencyDetails = await Promise.all(
    pointsByCompetency.map(async (item: any) => {
      const competency = await db.competency.findUnique({
        where: { id: item.competencyId }
      });
      return {
        competency: competency?.name || 'Unknown',
        competencyId: item.competencyId,
        points: item._sum.point || 0
      };
    })
  );

  return competencyDetails;
};

// Get all students with their progress
export const getAllStudentsProgress = async () => {
  const students = await db.user.findMany({
    where: { role: 'MAHASISWA' },
    include: {
      activities: {
        where: { status: 'APPROVED' },
        select: { point: true }
      }
    },
    select: {
      id: true,
      name: true,
      nim: true,
      email: true,
      activities: true
    }
  });

  return students.map((student: any) => {
    const totalPoints = student.activities.reduce((sum: number, activity: any) => {
      return sum + (activity.point || 0);
    }, 0);

    const completionPercentage = Math.min((totalPoints / TARGET_POINTS) * 100, 100);

    return {
      id: student.id,
      name: student.name,
      nim: student.nim,
      email: student.email,
      totalPoints,
      completionPercentage: Math.round(completionPercentage * 100) / 100,
      remainingPoints: Math.max(TARGET_POINTS - totalPoints, 0),
      isCompleted: totalPoints >= TARGET_POINTS
    };
  });
};

// Validate point assignment based on activity type and competency
export const validatePointAssignment = async (
  activityTypeId: string,
  competencyId: string,
  proposedPoints: number
): Promise<{ isValid: boolean; message?: string; suggestedPoints?: number }> => {
  // Get activity type and competency details
  const [activityType, competency] = await Promise.all([
    db.activityType.findUnique({ where: { id: activityTypeId } }),
    db.competency.findUnique({ where: { id: competencyId } })
  ]);

  if (!activityType || !competency) {
    return {
      isValid: false,
      message: 'Invalid activity type or competency'
    };
  }

  // Define point ranges based on activity type
  const pointRanges: Record<string, { min: number; max: number }> = {
    'Seminar': { min: 1, max: 3 },
    'Course': { min: 2, max: 8 },
    'Program': { min: 3, max: 10 },
    'Research': { min: 5, max: 15 },
    'Achievement': { min: 2, max: 20 }
  };

  const range = pointRanges[activityType.name];
  if (!range) {
    // If no specific range, allow 1-10 points
    if (proposedPoints < 1 || proposedPoints > 10) {
      return {
        isValid: false,
        message: 'Points should be between 1 and 10',
        suggestedPoints: Math.min(Math.max(proposedPoints, 1), 10)
      };
    }
    return { isValid: true };
  }

  if (proposedPoints < range.min || proposedPoints > range.max) {
    return {
      isValid: false,
      message: `Points for ${activityType.name} should be between ${range.min} and ${range.max}`,
      suggestedPoints: Math.min(Math.max(proposedPoints, range.min), range.max)
    };
  }

  return { isValid: true };
};

// Get recommended activities for a student based on their current progress
export const getRecommendedActivities = async (userId: string) => {
  const progress = await calculateStudentProgress(userId);
  const pointsByCompetency = await getPointsByCompetency(userId);

  // Find competencies with low points
  const allCompetencies = await db.competency.findMany();
  const competencyMap = new Map(pointsByCompetency.map((c: any) => [c.competencyId, c.points]));

  const recommendations = allCompetencies.map((competency: any) => {
    const currentPoints = competencyMap.get(competency.id) || 0;
    const targetPerCompetency = TARGET_POINTS / allCompetencies.length; // Distribute evenly
    const needed = Math.max(targetPerCompetency - currentPoints, 0);

    return {
      competency: competency.name,
      competencyId: competency.id,
      currentPoints,
      recommendedAdditionalPoints: Math.ceil(needed),
      priority: needed > targetPerCompetency * 0.5 ? 'High' : needed > 0 ? 'Medium' : 'Low'
    };
  });

  // Get available courses and events
  const [recognizedCourses, upcomingEvents] = await Promise.all([
    db.recognizedCourse.findMany({
      orderBy: { pointValue: 'desc' },
      take: 5
    }),
    db.event.findMany({
      where: {
        date: {
          gte: new Date()
        }
      },
      orderBy: { date: 'asc' },
      take: 5
    })
  ]);

  return {
    progress,
    competencyRecommendations: recommendations.sort((a: any, b: any) =>
      a.priority === 'High' ? -1 : b.priority === 'High' ? 1 : 0
    ),
    recommendedCourses: recognizedCourses,
    upcomingEvents: upcomingEvents
  };
};
