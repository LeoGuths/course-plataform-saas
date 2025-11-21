import { getCourse, getPurchasedCourses } from '@/actions/courses';
import { notFound, redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getCourseProgress } from '@/actions/course-progress';

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;

  const { course } = await getCourse(slug);

  if (!course) return notFound();

  const purchasedCourses = await getPurchasedCourses();
  const isPurchased = purchasedCourses.some(
    purchasedCourse => purchasedCourse.id === course.id
  );

  if (!isPurchased) return redirect(`/courses/details/${slug}`);

  const { completedLessons } = await getCourseProgress(slug);

  const allLessons = course.modules.flatMap(mod => mod.lessons);

  let lessonToRedirect = allLessons[0];

  const firstUncompletedLesson = allLessons.find(lesson => {
    const completed = completedLessons.some(
      completedLesson => completedLesson.lessonId === lesson.id
    );

    return !completed;
  });

  if (firstUncompletedLesson) lessonToRedirect = firstUncompletedLesson;

  if (lessonToRedirect) {
    redirect(
      `/courses/${slug}/${lessonToRedirect.moduleId}/lesson/${lessonToRedirect.id}`
    );
  }

  return <Skeleton className="flex-1" />;
}
