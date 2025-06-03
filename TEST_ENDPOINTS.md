# Testing Guide for TIFPoint Backend

## Prerequisites
1. Pastikan server berjalan: `npm run dev`
2. Database sudah di-seed: `npm run seed`
3. Gunakan tool seperti Postman, Insomnia, atau curl

## Authentication
Pertama, login untuk mendapatkan token:

```bash
# Login sebagai admin
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@tifpoint.com",
  "password": "admin123"
}
```

Simpan token dari response untuk digunakan di header:
```
Authorization: Bearer <your-token>
```

## Testing New Dashboard Endpoints

### 1. Test Student Dashboard
```bash
GET http://localhost:3000/api/dashboard/student
Authorization: Bearer <student-token>
```

### 2. Test Admin Dashboard
```bash
# Without filter
GET http://localhost:3000/api/dashboard/admin
Authorization: Bearer <admin-token>

# With NIM filter
GET http://localhost:3000/api/dashboard/admin?nim=123456
Authorization: Bearer <admin-token>
```

### 3. Test Student Statistics (Admin Only)
```bash
GET http://localhost:3000/api/dashboard/student/{student-id}/statistics
Authorization: Bearer <admin-token>
```

### 4. Test Leaderboard
```bash
# Default (top 10)
GET http://localhost:3000/api/dashboard/leaderboard
Authorization: Bearer <token>

# Custom limit
GET http://localhost:3000/api/dashboard/leaderboard?limit=5
Authorization: Bearer <token>
```

### 5. Test Activity Statistics
```bash
GET http://localhost:3000/api/dashboard/statistics
Authorization: Bearer <admin-token>
```

### 6. Test Student Recommendations
```bash
GET http://localhost:3000/api/dashboard/recommendations
Authorization: Bearer <student-token>
```

## Testing Enhanced Endpoints

### 1. Test Enhanced Profile
```bash
GET http://localhost:3000/api/auth/profile
Authorization: Bearer <student-token>
```

### 2. Test User Filtering
```bash
# Filter by NIM
GET http://localhost:3000/api/users?nim=123456
Authorization: Bearer <admin-token>

# Filter by role
GET http://localhost:3000/api/users?role=MAHASISWA
Authorization: Bearer <admin-token>

# Search by name
GET http://localhost:3000/api/users?search=john
Authorization: Bearer <admin-token>
```

### 3. Test Activity Filtering
```bash
# Filter by status
GET http://localhost:3000/api/activities/filter?status=PENDING
Authorization: Bearer <token>

# Filter with pagination
GET http://localhost:3000/api/activities/filter?page=1&limit=5
Authorization: Bearer <token>

# Multiple filters
GET http://localhost:3000/api/activities/filter?status=APPROVED&page=1&limit=10
Authorization: Bearer <token>
```

### 4. Test Point Validation
```bash
POST http://localhost:3000/api/activities/validate-points
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "activityTypeId": "activity-type-id",
  "competencyId": "competency-id",
  "points": 5
}
```

## Sample Test Data Creation

### 1. Create Test Student
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "test_student",
  "email": "student@test.com",
  "password": "password123",
  "name": "Test Student",
  "nim": "123456789"
}
```

### 2. Create Test Activity
```bash
POST http://localhost:3000/api/activities
Authorization: Bearer <student-token>
Content-Type: application/json

{
  "title": "Test Seminar AI",
  "description": "Mengikuti seminar tentang AI",
  "competencyId": "competency-id",
  "activityTypeId": "activity-type-id",
  "documentUrl": "https://example.com/certificate.pdf"
}
```

### 3. Verify Activity (Admin)
```bash
PATCH http://localhost:3000/api/activities/{activity-id}/verify
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "APPROVED",
  "point": 3,
  "comment": "Sertifikat valid dan sesuai"
}
```

## Expected Results

### Student Dashboard Response:
```json
{
  "totalPoints": 0,
  "targetPoints": 36,
  "completionPercentage": 0,
  "remainingPoints": 36,
  "isCompleted": false,
  "pendingActivitiesCount": 0,
  "approvedActivitiesCount": 0,
  "activityHistory": [],
  "pointsByCompetency": [],
  "recentApprovedActivities": []
}
```

### Admin Dashboard Response:
```json
{
  "overview": {
    "totalStudents": 1,
    "totalActivities": 0,
    "pendingActivities": 0,
    "approvedActivities": 0,
    "rejectedActivities": 0,
    "completedStudents": 0,
    "inProgressStudents": 0,
    "notStartedStudents": 1
  },
  "studentProgress": [...],
  "recentPendingActivities": [],
  "competencyStats": [],
  "targetPoints": 36
}
```

## Testing Workflow

1. **Setup**: Register student, login admin
2. **Create Data**: Student creates activities
3. **Verify**: Admin verifies activities with points
4. **Check Dashboard**: Test student dashboard shows updated points
5. **Check Admin**: Test admin dashboard shows student progress
6. **Test Filters**: Try various filter combinations
7. **Test Recommendations**: Check if recommendations work
8. **Test Leaderboard**: Verify ranking system

## Common Issues & Solutions

### Issue: "User not authenticated"
**Solution**: Make sure to include valid JWT token in Authorization header

### Issue: "Property 'activity' does not exist"
**Solution**: This is a TypeScript issue with Prisma. The code will still work at runtime.

### Issue: Empty dashboard data
**Solution**: Make sure to create and verify some activities first

### Issue: 404 on dashboard routes
**Solution**: Ensure dashboard routes are properly imported in index.ts

## Performance Testing

Test with multiple students and activities:
```bash
# Create multiple students
# Create multiple activities per student
# Verify activities with different points
# Test dashboard performance with large datasets
```

This will help ensure the dashboard performs well with real-world data volumes.
