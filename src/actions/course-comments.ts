'use server';

import { getUser } from '@/actions/user';
import { prisma } from '@/lib/prisma';
import { checkRole } from '@/lib/clerk';
import { formatName } from '@/lib/utils';

export const getLessonComments = async (lessonId: string) => {
  await getUser();

  return prisma.lessonComment.findMany({
    where: { lessonId, parentId: null },
    include: {
      user: true,
      parent: true,
      replies: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
};

type CreateLessonCommentPayload = {
  courseSlug: string;
  lessonId: string;
  content: string;
  parentId?: string;
};

export const createLessonComment = async ({
  lessonId,
  courseSlug,
  parentId,
  content,
}: CreateLessonCommentPayload) => {
  const { userId, user } = await getUser();

  if (content.length > 500) {
    throw new Error('Comentário deve ter no máximo 500 caracteres');
  }

  const course = await prisma.course.findUnique({
    where: {
      slug: courseSlug,
    },
  });

  if (!course) {
    throw new Error('Course não encontrado');
  }

  const userHasCourse = await prisma.coursePurchase.findFirst({
    where: {
      courseId: course.id,
      userId,
    },
  });

  if (!userHasCourse) {
    throw new Error('Você não possui acesso a este curso');
  }

  const lesson = await prisma.courseLesson.findUnique({
    where: {
      id: lessonId,
    },
  });

  if (!lesson) {
    throw new Error('Aula não encontrada');
  }

  const comment = prisma.lessonComment.create({
    data: {
      lessonId,
      userId,
      content,
      parentId,
    },
  });

  if (parentId) {
    const parentComment = await prisma.lessonComment.findUnique({
      where: { id: parentId },
    });

    const parentUserId = parentComment?.userId;

    if (parentUserId && parentUserId !== userId) {
      await prisma.notification.create({
        data: {
          userId: parentUserId,
          title: 'Nova resposta ao seu comentário',
          content: `${formatName(user.firstName, user.lastName)} respondeu ao seu comentário no curso ${course.title}`,
          link: `/courses/${courseSlug}/${lesson.moduleId}/lesson/${lessonId}`,
        },
      });
    }
  }

  return comment;
};

export const deleteComment = async (commentId: string) => {
  const { userId } = await getUser();

  const isAdmin = await checkRole('admin');

  const comment = await prisma.lessonComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error('Comentário não encontrado');
  }

  if (!isAdmin && comment.userId !== userId) {
    throw new Error('Você não tem permissão para deletar este comentário');
  }

  await prisma.lessonComment.delete({
    where: { id: commentId },
  });
};

export const getAdminComments = async (): Promise<AdminComment[]> => {
  await throwErrorIfNotAdmin();

  const comments = await prisma.lessonComment.findMany({
    where: {
      parentId: null,
    },
    include: {
      user: true,
      lesson: {
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return comments.map(({ _count, ...comment }) => ({
    ...comment,
    repliesCount: _count.replies,
  }));
};

const throwErrorIfNotAdmin = async () => {
  const isAdmin = await checkRole('admin');
  if (!isAdmin) throw new Error('Unauthorized');
};
