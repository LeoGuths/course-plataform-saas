type Course = import('@/generated/prisma').Course;
type CourseTag = import('@/generated/prisma').CourseTag;
type CourseModule = import('@/generated/prisma').CourseModule;
type CourseLesson = import('@/generated/prisma').CourseLesson;
type CompletedLessons = import('@/generated/prisma').CompletedLesson;
type LessonComment = import('@/generated/prisma').LessonComment;
type User = import('@/generated/prisma').User;
type PlatformNotification = import('@/generated/prisma').Notification;

type CourseWithTagsAndModules = Course & {
  tags: CourseTag[];
  modules: CourseModule[];
};

type CourseModuleWithLessons = CourseModule & {
  lessons: CourseLesson[];
};

type CourseWithModulesAndLessons = Course & {
  modules: CourseModuleWithLessons[];
};

type LessonCommentWithUserAndReplies = LessonComment & {
  user: User;
  replies?: LessonCommentWithUserAndReplies[];
};

type StatsChartData = {
  date: Date;
  count: number;
};

type AdminUser = User & {
  purchasedCourses: number;
  completedLessons: number;
};

type AdminComment = LessonComment & {
  user: User;
  lesson: CourseLesson & {
    module: CourseModule & {
      course: Course;
    };
  };
  repliesCount: number;
};

type RankingUser = {
  position: number;
  id: string;
  name: string;
  imageUrl?: string | null;
  completedLessons: number;
};
