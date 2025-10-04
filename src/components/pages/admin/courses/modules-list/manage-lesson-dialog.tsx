import { Dialog } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form/primitives';
import { useForm, useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputField } from '@/components/ui/form/input-field';
import { Button } from '@/components/ui/button';
import { CreateCourseFormData } from '@/server/schemas/course';
import { FormField } from '@/components/ui/form/field';
import { Editor } from '@/components/ui/editor';
import { ulid } from 'ulid';
import { useEffect } from 'react';

const formSchema = z.object({
  title: z.string().nonempty('Campo obrigatório'),
  description: z.string().nonempty('Campo obrigatório'),
  videoId: z.string().nonempty('Campo obrigatório'),
  durationInMs: z.coerce.number().min(1, { message: 'Campo obrigatório' }),
  // durationInMs: z.any().transform(val => {
  //   const num = Number(val);
  //   if (isNaN(num) || num < 1) {
  //     throw new Error('Campo obrigatório');
  //   }
  //   return num;
  // }),
});

type LessonFormData = z.infer<typeof formSchema>;

export type LessonFormItem = LessonFormData & { id: string };

type ManageLessonDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  moduleIndex: number;
  initialData?: LessonFormItem | null;
  setInitialData: (data: LessonFormItem | null) => void;
};

export const ManageLessonDialog = ({
  open,
  setOpen,
  moduleIndex,
  initialData,
  setInitialData,
}: ManageLessonDialogProps) => {
  const {
    getValues,
    setValue,
    reset: resetForm,
  } = useFormContext<CreateCourseFormData>();

  const form = useForm<LessonFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      videoId: '',
      durationInMs: 0,
    },
  });

  const { handleSubmit, reset } = form;

  const isEditing = !!initialData;

  useEffect(() => {
    if (open && initialData) {
      reset(initialData);
    }
  }, [initialData, open, reset]);

  useEffect(() => {
    if (!open) {
      reset({ title: '', description: '', videoId: '', durationInMs: 0 });
      setInitialData(null);
    }
  }, [open, reset, setInitialData]);

  const onSubmit = (data: LessonFormData) => {
    const modules = getValues('modules');

    if (isEditing) {
      modules[moduleIndex].lessons = modules[moduleIndex].lessons.map(
        lesson => {
          if (lesson.id === initialData.id) {
            return { ...lesson, ...data };
          }

          return lesson;
        }
      );
    } else {
      modules[moduleIndex].lessons.push({
        ...data,
        id: ulid(),
        order: 1,
      });
    }

    setValue('modules', modules, { shouldValidate: true });
    resetForm(getValues());
    setOpen(false);
  };

  return (
    <div>
      <Dialog
        title={isEditing ? 'Editar Aula' : 'Adicionar Aula'}
        open={open}
        setOpen={setOpen}
        width="500px"
        content={
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <InputField name="title" label="Título" />
              <FormField name="description" label="Descrição">
                {({ field }) => (
                  <Editor value={field.value} onChange={field.onChange} />
                )}
              </FormField>
              <div className="grid md:grid-cols-2 gap-6">
                <InputField name="videoId" label="ID do vídeo" />
                <InputField
                  name="durationInMs"
                  label="Duração em milissegundos"
                  type="number"
                />
              </div>
              <Button
                className="max-w-max ml-auto"
                onClick={() => handleSubmit(onSubmit)()}
              >
                {isEditing ? 'Salvar' : 'Adicionar'}
              </Button>
            </form>
          </Form>
        }
      ></Dialog>
    </div>
  );
};
