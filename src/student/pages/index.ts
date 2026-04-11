/**
 * Student Pages Index — Strict Module Boundary
 *
 * TEAM RULES (NON-NEGOTIABLE):
 *   ❌ NEVER import from /admin/* in any file below
 *   ❌ NEVER expose admin components through this index
 *   ❌ NEVER show hostel-wide aggregate data to students
 *   ✅ All student pages only show data filtered by student_id / hostel_id (read-only)
 *   ✅ Any new student page MUST be added here and in App.tsx under /student/* route only
 */

export { StudentDashboard }   from '../../pages/student/StudentDashboard'
export { StudentFees }        from '../../pages/student/StudentFees'
export { StudentComplaints }  from '../../pages/student/StudentComplaints'
export { StudentAnnouncements } from '../../pages/student/StudentAnnouncements'
export { StudentFoodMenu }    from '../../pages/student/StudentFoodMenu'
export { StudentProfile }     from '../../pages/student/StudentProfile'
