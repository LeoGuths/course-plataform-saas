'use server';

import { prisma } from '@/lib/prisma';
import { getUser } from '@/actions/user';
import { checkRole } from '@/lib/clerk';
import {
  courseModuleSchema,
  CreateCourseFormData,
  CreateCourseModulePayload,
  createCourseSchema,
  UpdateCourseFormData,
  updateCourseSchema,
} from '@/server/schemas/course';
import slugify from 'slugify';
import { revalidatePath } from 'next/cache';
import { deleteFile, uploadFile } from '@/actions/upload';
import { z } from 'zod';
import { $Enums } from '@/generated/prisma';
import CourseStatus = $Enums.CourseStatus;

type GetCoursesPayload = {
  query?: string;
  tags?: string | string[];
};

export const getCourses = async ({
  query,
  tags: rawTags,
}: GetCoursesPayload) => {
  const tags = !rawTags ? [] : Array.isArray(rawTags) ? rawTags : [rawTags];

  const hasTags = !!tags.length;
  const hasQuery = !!query?.trim();

  return prisma.course.findMany({
    where: {
      status: 'PUBLISHED',
      tags: hasTags ? { some: { id: { in: tags } } } : undefined,
      OR: hasQuery
        ? [{ title: { search: query } }, { description: { search: query } }]
        : undefined,
    },
    include: {
      tags: true,
      modules: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const getCourse = async (
  query: string,
  queryType: 'slug' | 'id' = 'slug'
) => {
  const course = await prisma.course.findUnique({
    where: {
      slug: queryType === 'slug' ? query : undefined,
      id: queryType === 'id' ? query : undefined,
    },
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      },
      tags: true,
    },
  });
  return { course };
};

export const getPurchasedCourses = async (detailed = false) => {
  const { userId } = await getUser(false);

  if (!userId) return [];

  const purchasedCourses = await prisma.coursePurchase.findMany({
    where: {
      userId,
    },
    include: {
      course: detailed
        ? {
            include: {
              tags: true,
              modules: true,
            },
          }
        : true,
    },
  });

  return purchasedCourses.map(purchase => purchase.course);
};

export const getPurchasedCoursesWithDetails = async () => {
  const purchasedCourses = await getPurchasedCourses(true);

  return purchasedCourses as CourseWithTagsAndModules[];
};

export const getAdminCourses = async () => {
  await throwErrorIfNotAdmin();

  return prisma.course.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      tags: true,
      modules: true,
    },
  });
};

export const getCourseTags = async () => {
  return prisma.courseTag.findMany({
    orderBy: {
      name: 'asc',
    },
  });
};

export const createCourseTag = async (name: string) => {
  await throwErrorIfNotAdmin();

  return prisma.courseTag.create({
    data: {
      name,
    },
  });
};

export const createCourse = async (rawData: CreateCourseFormData) => {
  await throwErrorIfNotAdmin();

  const data = createCourseSchema.parse(rawData);

  const rawSlug = slugify(data.title, {
    lower: true,
    strict: true,
  });

  const slugCount = await prisma.course.count({
    where: {
      slug: {
        startsWith: rawSlug,
      },
    },
  });

  const slug = slugCount > 0 ? `${rawSlug}-${slugCount + 1}` : rawSlug;

  const { url: thumbnailUrl } = await uploadFile({
    file: data.thumbnail,
    path: 'courses-thumbnails',
  });

  const course = await prisma.course.create({
    data: {
      title: data.title,
      shortDescription: data.shortDescription,
      description: data.description,
      price: data.price,
      discountPrice: data.discountPrice,
      difficulty: data.difficulty,
      slug,
      status: 'DRAFT',
      thumbnail: thumbnailUrl,
      tags: {
        connect: data.tagIds.map(id => ({ id })),
      },
      modules: {
        create: data.modules.map(mod => ({
          title: mod.title,
          description: mod.description,
          order: mod.order,
          lessons: {
            create: mod.lessons.map(lesson => ({
              title: lesson.title,
              description: lesson.description,
              videoId: lesson.videoId,
              durationInMs: lesson.durationInMs,
              order: lesson.order,
            })),
          },
        })),
      },
    },
  });

  revalidatePath('/admin/courses');

  return course;
};

export const updateCourse = async (rawData: UpdateCourseFormData) => {
  await throwErrorIfNotAdmin();

  const data = updateCourseSchema.parse(rawData);

  const course = await prisma.course.findUnique({
    where: {
      id: data.id,
    },
    include: {
      tags: true,
    },
  });

  if (!course) throw new Error('Course not found');

  let slug = course.slug;
  let thumbnailUrl = course.thumbnail;

  if (data.title !== course.title) {
    const rawSlug = slugify(data.title, {
      lower: true,
      strict: true,
    });

    const slugCount = await prisma.course.count({
      where: {
        slug: {
          startsWith: rawSlug,
        },
      },
    });

    slug = slugCount > 0 ? `${rawSlug}-${slugCount + 1}` : rawSlug;
  }

  if (data.thumbnail) {
    const { url: newThumbnailUrl } = await uploadFile({
      file: data.thumbnail,
      path: 'courses-thumbnails',
    });

    thumbnailUrl = newThumbnailUrl;

    await deleteFile(course.thumbnail);
  }

  const updatedCourse = await prisma.course.update({
    where: { id: data.id },
    data: {
      title: data.title,
      shortDescription: data.shortDescription,
      description: data.description,
      price: data.price,
      discountPrice: data.discountPrice,
      difficulty: data.difficulty,
      slug,
      thumbnail: thumbnailUrl,
      tags: {
        set: data.tagIds.map(id => ({ id })),
      },
    },
  });

  revalidatePath('/');
  revalidatePath('/admin/courses');

  return updatedCourse;
};

export const deleteCourseLessons = async (lessonIds: string[]) => {
  await throwErrorIfNotAdmin();

  await prisma.courseLesson.deleteMany({
    where: {
      id: {
        in: lessonIds,
      },
    },
  });
};

export const deleteModulesLessons = async (moduleIds: string[]) => {
  await throwErrorIfNotAdmin();

  await prisma.courseModule.deleteMany({
    where: {
      id: {
        in: moduleIds,
      },
    },
  });
};

export const createCourseModules = async (
  courseId: string,
  modules: CreateCourseModulePayload[]
) => {
  await throwErrorIfNotAdmin();

  const schema = z.array(courseModuleSchema);

  const data = schema.parse(modules);
  await Promise.all(
    data.map(mod =>
      prisma.courseModule.create({
        data: {
          title: mod.title,
          description: mod.description,
          order: mod.order,
          courseId,
          lessons: {
            createMany: {
              data: mod.lessons.map(lesson => ({
                title: lesson.title,
                description: lesson.description,
                durationInMs: lesson.durationInMs,
                order: lesson.order,
                videoId: lesson.videoId,
              })),
            },
          },
        },
      })
    )
  );
};

export const updateCourseModules = async (
  modules: CreateCourseModulePayload[]
) => {
  await throwErrorIfNotAdmin();

  const schema = z.array(courseModuleSchema);
  const data = schema.parse(modules);

  await Promise.all(
    data.map(async mod => {
      await prisma.courseModule.update({
        where: { id: mod.id },
        data: {
          title: mod.title,
          description: mod.description,
          order: mod.order,
        },
      });

      await Promise.all(
        mod.lessons.map(lesson =>
          prisma.courseLesson.upsert({
            where: { id: lesson.id },
            update: {
              order: lesson.order,
              title: lesson.title,
              description: lesson.description,
              videoId: lesson.videoId,
              durationInMs: lesson.durationInMs,
            },
            create: {
              order: lesson.order,
              title: lesson.title,
              description: lesson.description,
              videoId: lesson.videoId,
              durationInMs: lesson.durationInMs,
              moduleId: mod.id,
            },
          })
        )
      );
    })
  );
};

export const revalidateCourseDetails = async (courseId: string) => {
  await throwErrorIfNotAdmin();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  revalidatePath(`/courses/details/${course.slug}`);
};

type UpdateCourseStatusPayload = {
  courseId: string;
  status: CourseStatus;
};

export const updateCourseStatus = async ({
  courseId,
  status,
}: UpdateCourseStatusPayload) => {
  await throwErrorIfNotAdmin();

  const course = await prisma.course.update({
    where: { id: courseId },
    data: { status },
  });

  revalidatePath('/');
  revalidatePath('/admin/courses');

  return course;
};

export const deleteCourse = async (courseId: string) => {
  await throwErrorIfNotAdmin();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) throw new Error('Course not found');

  await prisma.course.delete({
    where: { id: courseId },
  });

  await deleteFile(course.thumbnail);

  revalidatePath('/');
  revalidatePath('/admin/courses');
};

const throwErrorIfNotAdmin = async () => {
  const isAdmin = await checkRole('admin');
  if (!isAdmin) throw new Error('Unauthorized');
};
