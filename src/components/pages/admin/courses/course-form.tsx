'use client';

import { useForm } from 'react-hook-form';
import {
  CreateCourseFormData,
  createCourseSchema,
} from '@/server/schemas/course';
import { zodResolver } from '@hookform/resolvers/zod';
import { BackButton } from '@/components/ui/back-button';
import { Separator } from '@/components/ui/separator';
import { Form } from '@/components/ui/form/primitives';
import { InputField } from '@/components/ui/form/input-field';
import { FormField } from '@/components/ui/form/field';
import MultipleSelector, { Option } from '@/components/ui/multiple-selector';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/query-keys';
import {
  createCourse,
  createCourseModules,
  createCourseTag,
  deleteCourseLessons,
  deleteModulesLessons,
  getCourseTags,
  revalidateCourseDetails,
  updateCourse,
  updateCourseModules,
} from '@/actions/courses';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SelectField } from '@/components/ui/form/select-field';
import { formatDifficulty, urlToFile } from '@/lib/utils';
import { $Enums } from '@/generated/prisma';
import CourseDifficulty = $Enums.CourseDifficulty;
import { Dropzone } from '@/components/ui/dropzone';
import { Editor } from '@/components/ui/editor';
import { ModulesList } from '@/components/pages/admin/courses/modules-list';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { dequal } from 'dequal';

type CourseFormInitialData = Omit<CreateCourseFormData, 'thumbnail'> & {
  thumbnailUrl: string;
};

type CourseFormProps = {
  initialData?: CourseFormInitialData;
};

export const CourseForm = ({ initialData }: CourseFormProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();

  const courseId = params.courseId as string;

  const isEditing = !!initialData;
  const [initialDataIsSet, setInitialDataIsSet] = useState(false);

  const form = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: '',
      shortDescription: '',
      price: undefined,
      discountPrice: undefined,
      description: '',
      difficulty: 'EASY',
      thumbnail: undefined,
      tagIds: [],
      modules: [],
    },
  });

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { dirtyFields },
  } = form;

  const setInitialData = useCallback(
    async (data: CourseFormInitialData) => {
      const thumbnailFile = await urlToFile(data.thumbnailUrl);

      reset({ ...data, thumbnail: thumbnailFile });

      setInitialDataIsSet(true);
    },
    [reset]
  );

  useEffect(() => {
    if (initialData) setInitialData(initialData);
  }, [initialData, setInitialData]);

  const { data: tagsData } = useQuery({
    queryKey: queryKeys.courseTags,
    queryFn: getCourseTags,
  });

  const tagIds = watch('tagIds');

  const { mutate: handleCreateTag, isPending: isAddingTag } = useMutation({
    mutationFn: createCourseTag,
    onSuccess: async newTag => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.courseTags });

      setValue('tagIds', [...tagIds, newTag.id], { shouldValidate: true });
    },
  });

  const { mutate: handleCreateCourse, isPending: isCreatingCourse } =
    useMutation({
      mutationFn: createCourse,
      onSuccess: () => {
        toast.success('Curso criado com sucesso!');
        router.push('/admin/courses');
      },
      onError: () => {
        toast.error(
          'Ocorreu um erro ao criar o curso. Tente novamente mais tarde.'
        );
      },
    });

  const { mutate: handleUpdateCourse, isPending: isUpdatingCourse } =
    useMutation({
      mutationFn: async (data: CreateCourseFormData) => {
        if (!initialData) return;

        await updateCourse({
          id: courseId,
          ...data,
          thumbnail: dirtyFields.thumbnail ? data.thumbnail : undefined,
        });

        const isModulesUpdated = !dequal(initialData.modules, data.modules);

        if (!isModulesUpdated) {
          await revalidateCourseDetails(courseId);
          return;
        }

        const removedModules = initialData.modules.filter(
          mod => !data.modules.find(m => m.id === mod.id)
        );
        const allLessons = data.modules.flatMap(mod => mod.lessons);
        const allInitialLessons = initialData.modules.flatMap(
          mod => mod.lessons
        );
        const removedLessons = allInitialLessons.filter(
          lesson => !allLessons.find(l => l.id === lesson.id)
        );
        const modulesToCreate = data.modules.filter(
          mod => !initialData.modules.find(m => m.id === mod.id)
        );
        const modulesToUpdate = data.modules.filter(
          mod =>
            !removedModules.find(m => m.id === mod.id) &&
            !modulesToCreate.find(m => m.id === mod.id)
        );

        if (!!removedLessons.length) {
          await deleteCourseLessons(removedLessons.map(lesson => lesson.id));
        }
        if (!!removedModules.length) {
          await deleteModulesLessons(removedModules.map(mod => mod.id));
        }
        if (!!modulesToCreate.length) {
          await createCourseModules(courseId, modulesToCreate);
        }
        if (!!modulesToUpdate.length) {
          await updateCourseModules(modulesToUpdate);
        }

        await revalidateCourseDetails(courseId);
      },
      onSuccess: () => {
        toast.success('Curso atualizado com sucesso!');
        router.push('/admin/courses');
      },
      onError: () => {
        toast.error(
          'Ocorreu um erro ao atualizar o curso. Tente novamente mais tarde.'
        );
      },
    });

  const tagsOptions = useMemo(() => {
    return (tagsData ?? []).map(tag => ({
      label: tag.name,
      value: tag.id,
    }));
  }, [tagsData]);

  const difficultyOptions = [
    {
      label: formatDifficulty(CourseDifficulty.EASY),
      value: CourseDifficulty.EASY,
    },
    {
      label: formatDifficulty(CourseDifficulty.MEDIUM),
      value: CourseDifficulty.MEDIUM,
    },
    {
      label: formatDifficulty(CourseDifficulty.HARD),
      value: CourseDifficulty.HARD,
    },
  ];

  const selectedTags = useMemo(() => {
    return tagsOptions.filter(tag => tagIds.includes(tag.value));
  }, [tagIds, tagsOptions]);

  const handleChangeTags = (value: Option[]) => {
    const tagToCreate = value.find(
      tag => !tagsOptions.find(t => t.value === tag.value)
    );

    if (tagToCreate) {
      handleCreateTag(tagToCreate.value);
      return;
    }

    setValue(
      'tagIds',
      value.map(option => option.value),
      { shouldValidate: true }
    );
  };

  const onSubmit = (data: CreateCourseFormData) => {
    const dataWithOrder: CreateCourseFormData = {
      ...data,
      modules: data.modules.map((mod, index) => ({
        ...mod,
        order: index + 1,
        lessons: mod.lessons.map((lesson, index) => ({
          ...lesson,
          order: index + 1,
        })),
      })),
    };

    if (isEditing) {
      handleUpdateCourse(dataWithOrder);
      return;
    }

    handleCreateCourse(dataWithOrder);
  };

  return (
    <>
      <BackButton />

      <div>
        <h1>{isEditing ? 'Editar curso' : 'Criar curso'}</h1>
        <p className="text-muted-foreground mt-2">
          {isEditing
            ? 'Edite o curso com as informações desejadas.'
            : 'Preencha o formulário abaixo para adicionar um novo curso.'}
        </p>
      </div>

      <Separator className="my-2" />

      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid md:grid-cols-2 gap-6"
        >
          <InputField
            name="title"
            label="Título"
            placeholder="Curso de React"
          />
          <InputField
            name="shortDescription"
            label="Descrição curta (opcional)"
            placeholder="Aprenda a criar uma aplicação de gerenciamento de tarefas."
          />
          <InputField name="price" label="Preço" placeholder="100" />
          <InputField
            name="discountPrice"
            label="Preço promocional (Opcional)"
            placeholder="89.99"
          />
          <FormField name="tagIds" label="Tags">
            {() => (
              <MultipleSelector
                options={tagsOptions}
                placeholder="Selecione as tags"
                creatable
                onChange={value => handleChangeTags(value)}
                value={selectedTags}
                disabled={isAddingTag}
              />
            )}
          </FormField>
          <SelectField
            name="difficulty"
            label="Dificuldade"
            options={difficultyOptions}
          />
          <FormField
            name="thumbnail"
            label="Thumbnail"
            className="col-span-full"
          >
            {({ field }) => (
              <Dropzone file={field.value} setFile={field.onChange} />
            )}
          </FormField>
          <FormField
            name="description"
            label="Descrição"
            className="col-span-full"
          >
            {({ field }) => (
              <Editor
                key={`editor-field-${initialDataIsSet}`}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          </FormField>

          <Separator className="my-2 col-span-full" />

          <ModulesList />

          <div className="col-span-full flex justify-end">
            <Button
              type="submit"
              disabled={isCreatingCourse || isUpdatingCourse}
            >
              {isEditing ? 'Salvar alterações' : 'Criar curso'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
