'use server';

import {
  createNotificationSchema,
  CreateNotificationSchema,
} from '@/server/schemas/notifications';
import { checkRole } from '@/lib/clerk';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/user';

export const sendNotifications = async (rawData: CreateNotificationSchema) => {
  await throwErrorIfNotAdmin();

  const data = createNotificationSchema.parse(rawData);

  const allUserIds = await prisma.user.findMany({
    select: {
      id: true,
    },
  });

  await prisma.notification.createMany({
    data: allUserIds.map(user => ({
      userId: user.id,
      title: data.title,
      content: data.content,
      link: data.link,
    })),
  });
};

export const getNotifications = async () => {
  const { userId } = await getUser();

  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

export const readAllNotifications = async () => {
  const { userId } = await getUser();

  await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
};

const throwErrorIfNotAdmin = async () => {
  const isAdmin = await checkRole('admin');
  if (!isAdmin) throw new Error('Unauthorized');
};
