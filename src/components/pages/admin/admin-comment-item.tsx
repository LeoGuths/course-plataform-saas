import Link from 'next/link';
import { cn, formatName } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

type AdminCommentItemProps = {
  comment: AdminComment;
};

export const AdminCommentItem = ({ comment }: AdminCommentItemProps) => {
  const { lesson, user, repliesCount } = comment;

  const course = lesson.module.course;
  const lessonModule = lesson.module;

  return (
    <Link
      href={`/courses/${course.slug}/${lessonModule.id}/lesson/${lesson.id}`}
      className={cn(
        'flex items-start justify-between gap-4 p-3 bg-muted rounded-lg border',
        'border-muted transition-all hover:border-primary flex-col md:flex-row'
      )}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <Avatar src={user.imageUrl} className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <p>{formatName(user.firstName, user.lastName)}</p>
            <span>•</span>
            <p>{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</p>
            <span>•</span>
            <Badge
              className="text-xs cursor-pointer"
              variant={repliesCount === 0 ? 'destructive' : 'outline'}
            >
              {repliesCount === 0
                ? 'Sem resposta'
                : `${repliesCount} resposta${repliesCount === 1 ? '' : 's'}`}
            </Badge>
          </div>
          <p className="text-sm mt-1 break-words">{comment.content}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0 w-full md:w-auto">
        <div className="text-right flex-1 md:flex-initial min-w-0">
          <p className="text-xs text-muted-foreground truncate">
            {course.title}
          </p>
          <p className="text-sm truncate">{lesson.title}</p>
        </div>

        <div className="relative w-24 h-14 md:w-28 md:h-16 flex-shrink-0">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 96px, 112px"
            quality={90}
            className="rounded-md border border-muted-foreground object-cover"
          />
        </div>
      </div>
    </Link>
  );
};
