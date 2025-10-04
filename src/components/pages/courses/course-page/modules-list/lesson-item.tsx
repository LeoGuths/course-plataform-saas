import {
  markLessonAsCompleted,
  unmarkLessonAsCompleted,
} from '@/actions/course-progress';
import { Tooltip } from '@/components/ui/tooltip';
import { queryKeys } from '@/constants/query-keys';
import { cn, formatDuration } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleCheckBig, CircleX, Video } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type LessonItemProps = {
  lesson: CourseLesson & {
    completed: boolean;
  };
};

export const LessonItem = ({ lesson }: LessonItemProps) => {
  const params = useParams();
  const queryClient = useQueryClient();

  const courseSlug = params.slug as string;
  const currentLessonId = params.lessonId as string;

  const lessonId = lesson.id;
  const completed = lesson.completed;

  const PrimaryIcon = completed ? CircleCheckBig : Video;
  const SecondaryIcon = completed ? CircleX : CircleCheckBig;

  const { mutate: handleCompleteLesson, isPending: isCompletingLesson } =
    useMutation({
      mutationFn: () => markLessonAsCompleted({ lessonId, courseSlug }),
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.courseProgress(courseSlug),
        });
      },
    });

  const {
    mutate: handleUnmarkLessonAsCompleted,
    isPending: isUnmarkingLessonAsCompleted,
  } = useMutation({
    mutationFn: () => unmarkLessonAsCompleted(lessonId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.courseProgress(courseSlug),
      });
    },
  });

  const isLoading = isCompletingLesson || isUnmarkingLessonAsCompleted;

  return (
    <Link
      href={`/courses/${courseSlug}/${lesson.moduleId}/lesson/${lesson.id}`}
      className={cn(
        'flex i items-center gap-2 text-muted-foreground text-sm p-2 hover:bg-muted/50 transition-all rounded-md',
        lesson.id === currentLessonId && 'text-white',
        completed && 'text-primary'
      )}
    >
      <Tooltip
        content={
          completed ? 'Marcar como não assistido' : 'Marcar como assistido'
        }
      >
        <button
          type="button"
          disabled={isLoading}
          className="w-4 min-w-4 h-4 relative group/lesson-button disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();

            if (completed) {
              handleUnmarkLessonAsCompleted();
              return;
            }

            handleCompleteLesson();
          }}
        >
          <PrimaryIcon className="w-full h-full opacity-100 transition-all group-hover/lesson-button:opacity-0" />
          <SecondaryIcon className="absolute inset-0 w-full h-full opacity-0 transition-all group-hover/lesson-button:opacity-100" />
        </button>
      </Tooltip>

      <p className="line-clamp-1">{lesson.title}</p>

      <p className="text-xs text-muted-foreground ml-auto">
        {formatDuration(lesson.durationInMs, true)}
      </p>
    </Link>
  );
};
