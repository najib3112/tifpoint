import { Request, Response } from 'express';
import { RequestWithUser } from '../types';
import { getRecommendedActivities, TARGET_POINTS } from '../utils/pointCalculation';
import prisma from '../utils/prisma';

// Type assertion to fix Prisma TypeScript issues
const db = prisma as any;

// Dashboard Mahasiswa
export const getStudentDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get user activities with points
    const activities = await db.activity.findMany({
      where: { 
        userId,
        status: 'APPROVED' // Only count approved activities
      },
      include: {
        competency: true,
        activityType: true,
        recognizedCourse: true,
        event: true
      },
      orderBy: {
        verifiedAt: 'desc'
      }
    });

    // Calculate total points
    const totalPoints = activities.reduce((sum: number, activity: any) => {
      return sum + (activity.point || 0);
    }, 0);

    // Calculate percentage completion
    const completionPercentage = Math.min((totalPoints / TARGET_POINTS) * 100, 100);

    // Get activity history (all activities including pending/rejected)
    const activityHistory = await db.activity.findMany({
      where: { userId },
      include: {
        competency: {
          select: { name: true }
        },
        activityType: {
          select: { name: true }
        },
        verifier: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Last 10 activities
    });

    // Get points by competency
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

    // Get competency details
    const competencyDetails = await Promise.all(
      pointsByCompetency.map(async (item: any) => {
        const competency = await db.competency.findUnique({
          where: { id: item.competencyId }
        });
        return {
          competency: competency?.name || 'Unknown',
          points: item._sum.point || 0
        };
      })
    );

    // Get pending activities count
    const pendingActivitiesCount = await db.activity.count({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    res.json({
      totalPoints,
      targetPoints: TARGET_POINTS,
      completionPercentage: Math.round(completionPercentage * 100) / 100,
      remainingPoints: Math.max(TARGET_POINTS - totalPoints, 0),
      isCompleted: totalPoints >= TARGET_POINTS,
      pendingActivitiesCount,
      approvedActivitiesCount: activities.length,
      activityHistory,
      pointsByCompetency: competencyDetails,
      recentApprovedActivities: activities.slice(0, 5)
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Dashboard Admin
export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const { nim } = req.query;

    // Total statistics
    const totalStudents = await db.user.count({
      where: { role: 'MAHASISWA' }
    });

    const totalActivities = await db.activity.count();

    const pendingActivities = await db.activity.count({
      where: { status: 'PENDING' }
    });

    const approvedActivities = await db.activity.count({
      where: { status: 'APPROVED' }
    });

    const rejectedActivities = await db.activity.count({
      where: { status: 'REJECTED' }
    });

    // Student progress statistics
    const studentsWithPoints = await db.user.findMany({
      where: { role: 'MAHASISWA' },
      include: {
        activities: {
          where: { status: 'APPROVED' },
          select: { point: true }
        }
      }
    });

    const studentProgress = studentsWithPoints.map((student: any) => {
      const totalPoints = student.activities.reduce((sum: number, activity: any) => {
        return sum + (activity.point || 0);
      }, 0);

      return {
        id: student.id,
        name: student.name,
        nim: student.nim,
        email: student.email,
        totalPoints,
        completionPercentage: Math.min((totalPoints / TARGET_POINTS) * 100, 100),
        isCompleted: totalPoints >= TARGET_POINTS
      };
    });

    // Filter by NIM if provided
    let filteredProgress = studentProgress;
    if (nim) {
      filteredProgress = studentProgress.filter((student: any) =>
        student.nim?.toLowerCase().includes((nim as string).toLowerCase())
      );
    }

    // Sort by completion percentage (highest first)
    filteredProgress.sort((a: any, b: any) => b.completionPercentage - a.completionPercentage);

    // Completion statistics
    const completedStudents = studentProgress.filter((s: any) => s.isCompleted).length;
    const inProgressStudents = studentProgress.filter((s: any) => !s.isCompleted && s.totalPoints > 0).length;
    const notStartedStudents = studentProgress.filter((s: any) => s.totalPoints === 0).length;

    // Recent activities needing verification
    const recentPendingActivities = await db.activity.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            name: true,
            nim: true,
            email: true
          }
        },
        competency: {
          select: { name: true }
        },
        activityType: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Points distribution by competency
    const pointsByCompetency = await db.activity.groupBy({
      by: ['competencyId'],
      where: { status: 'APPROVED' },
      _sum: { point: true },
      _count: { id: true }
    });

    const competencyStats = await Promise.all(
      pointsByCompetency.map(async (item: any) => {
        const competency = await db.competency.findUnique({
          where: { id: item.competencyId }
        });
        return {
          competency: competency?.name || 'Unknown',
          totalPoints: item._sum.point || 0,
          activitiesCount: item._count.id
        };
      })
    );

    res.json({
      overview: {
        totalStudents,
        totalActivities,
        pendingActivities,
        approvedActivities,
        rejectedActivities,
        completedStudents,
        inProgressStudents,
        notStartedStudents
      },
      studentProgress: filteredProgress,
      recentPendingActivities,
      competencyStats,
      targetPoints: TARGET_POINTS
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get detailed student statistics (for admin)
export const getStudentStatistics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nim: true,
        email: true,
        createdAt: true
      }
    });

    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    // Get all activities for this student
    const activities = await db.activity.findMany({
      where: { userId: id },
      include: {
        competency: true,
        activityType: true,
        recognizedCourse: true,
        event: true,
        verifier: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate statistics
    const approvedActivities = activities.filter((a: any) => a.status === 'APPROVED');
    const totalPoints = approvedActivities.reduce((sum: number, activity: any) => {
      return sum + (activity.point || 0);
    }, 0);

    const completionPercentage = Math.min((totalPoints / TARGET_POINTS) * 100, 100);

    // Points by competency
    const pointsByCompetency = approvedActivities.reduce((acc: any, activity: any) => {
      const competencyName = activity.competency.name;
      if (!acc[competencyName]) {
        acc[competencyName] = 0;
      }
      acc[competencyName] += activity.point || 0;
      return acc;
    }, {} as Record<string, number>);

    // Activities by status
    const activitiesByStatus = {
      pending: activities.filter((a: any) => a.status === 'PENDING').length,
      approved: activities.filter((a: any) => a.status === 'APPROVED').length,
      rejected: activities.filter((a: any) => a.status === 'REJECTED').length
    };

    res.json({
      student,
      statistics: {
        totalPoints,
        targetPoints: TARGET_POINTS,
        completionPercentage: Math.round(completionPercentage * 100) / 100,
        remainingPoints: Math.max(TARGET_POINTS - totalPoints, 0),
        isCompleted: totalPoints >= TARGET_POINTS
      },
      activitiesByStatus,
      pointsByCompetency,
      activities
    });
  } catch (error) {
    console.error('Get student statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get leaderboard (top students by points)
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const limitNumber = parseInt(limit as string);

    // Get all students with their approved activities
    const studentsWithPoints = await db.user.findMany({
      where: { role: 'MAHASISWA' },
      include: {
        activities: {
          where: { status: 'APPROVED' },
          select: { point: true }
        }
      }
    });

    // Calculate total points for each student
    const leaderboard = studentsWithPoints
      .map((student: any) => {
        const totalPoints = student.activities.reduce((sum: number, activity: any) => {
          return sum + (activity.point || 0);
        }, 0);

        return {
          id: student.id,
          name: student.name,
          nim: student.nim,
          totalPoints,
          completionPercentage: Math.min((totalPoints / TARGET_POINTS) * 100, 100),
          isCompleted: totalPoints >= TARGET_POINTS
        };
      })
      .sort((a: any, b: any) => b.totalPoints - a.totalPoints) // Sort by points descending
      .slice(0, limitNumber); // Limit results

    res.json({
      leaderboard,
      targetPoints: TARGET_POINTS
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get activity statistics
export const getActivityStatistics = async (req: Request, res: Response) => {
  try {
    // Overall activity statistics
    const totalActivities = await db.activity.count();
    const pendingActivities = await db.activity.count({
      where: { status: 'PENDING' }
    });
    const approvedActivities = await db.activity.count({
      where: { status: 'APPROVED' }
    });
    const rejectedActivities = await db.activity.count({
      where: { status: 'REJECTED' }
    });

    // Activities by type
    const activitiesByType = await db.activity.groupBy({
      by: ['activityTypeId'],
      _count: { id: true },
      _sum: { point: true }
    });

    const typeStats = await Promise.all(
      activitiesByType.map(async (item: any) => {
        const activityType = await db.activityType.findUnique({
          where: { id: item.activityTypeId }
        });
        return {
          type: activityType?.name || 'Unknown',
          count: item._count.id,
          totalPoints: item._sum.point || 0
        };
      })
    );

    // Activities by competency
    const activitiesByCompetency = await db.activity.groupBy({
      by: ['competencyId'],
      where: { status: 'APPROVED' },
      _count: { id: true },
      _sum: { point: true }
    });

    const competencyStats = await Promise.all(
      activitiesByCompetency.map(async (item: any) => {
        const competency = await db.competency.findUnique({
          where: { id: item.competencyId }
        });
        return {
          competency: competency?.name || 'Unknown',
          count: item._count.id,
          totalPoints: item._sum.point || 0
        };
      })
    );

    // Monthly activity trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyActivities = await db.activity.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    // Group by month
    const monthlyStats = monthlyActivities.reduce((acc: any, activity: any) => {
      const month = activity.createdAt.toISOString().slice(0, 7); // YYYY-MM format
      if (!acc[month]) {
        acc[month] = { total: 0, approved: 0, pending: 0, rejected: 0 };
      }
      acc[month].total++;
      const status = activity.status.toLowerCase();
      if (acc[month][status] !== undefined) {
        acc[month][status]++;
      }
      return acc;
    }, {} as Record<string, { total: number; approved: number; pending: number; rejected: number }>);

    res.json({
      overview: {
        totalActivities,
        pendingActivities,
        approvedActivities,
        rejectedActivities
      },
      activitiesByType: typeStats,
      activitiesByCompetency: competencyStats,
      monthlyTrends: monthlyStats
    });
  } catch (error) {
    console.error('Get activity statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get recommendations for student
export const getStudentRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = (req as RequestWithUser).user?.id;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const recommendations = await getRecommendedActivities(userId);
    res.json(recommendations);
  } catch (error) {
    console.error('Get student recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
