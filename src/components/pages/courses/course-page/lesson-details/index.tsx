import { LessonPlayer } from '@/components/pages/courses/course-page/lesson-details/lesson-player';
import { LessonComments } from '@/components/pages/courses/course-page/lesson-details/comments';
import { EditorPreview } from '@/components/ui/editor';

type LessonDetailsProps = {
  lesson: CourseLesson;
  nextLesson?: CourseLesson;
};

export const LessonDetails = ({ lesson }: LessonDetailsProps) => {
  return (
    <>
      <LessonPlayer lesson={lesson} />

      <div className="p-6 flex flex-col gap-6">
        <EditorPreview
          className="text-muted-foreground"
          value={lesson.description}
        />

        <LessonComments />
      </div>
    </>
  );
};
