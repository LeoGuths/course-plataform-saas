'use client';

import { Avatar } from '@/components/ui/avatar';
import { useUser } from '@clerk/nextjs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLessonComment } from '@/actions/course-comments';
import { queryKeys } from '@/constants/query-keys';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'Comentário é obrigatório' })
    .max(500, { message: 'Comentário deve ter no máximo 500 caracteres' }),
});

type FormData = z.infer<typeof formSchema>;

type CommentInputProps = {
  parentCommentId?: string;
  autoFocus?: boolean;
  className?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const CommentInput = ({
  parentCommentId,
  autoFocus,
  className,
  onCancel,
  onSuccess,
}: CommentInputProps) => {
  const params = useParams();
  const queryClient = useQueryClient();

  const { user } = useUser();

  const courseSlug = params.slug as string;
  const lessonId = params.lessonId as string;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  });

  const { mutate: createComment, isPending } = useMutation({
    mutationFn: createLessonComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.lessonComments(lessonId),
      });

      reset();
      if (onSuccess) {
        onSuccess();
      }
      toast.success('Comentário criado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao criar comentário');
    },
  });

  const onSubmit = (data: FormData) => {
    createComment({
      courseSlug,
      lessonId,
      content: data.content,
      parentId: parentCommentId,
    });
  };

  return (
    <form
      className={cn('flex gap-4', className)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Avatar src={user?.imageUrl} fallback={user?.fullName} />

      <div className="flex-1 space-y-2">
        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <Textarea
              {...field}
              placeholder="Deixe seu comentário"
              className={cn(
                'min-h-[100px]',
                errors.content &&
                  'border-destructive focus-visible:ring-destructive'
              )}
              autoFocus={autoFocus}
            />
          )}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} type="button">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          Comentar
        </Button>
      </div>
    </form>
  );
};
