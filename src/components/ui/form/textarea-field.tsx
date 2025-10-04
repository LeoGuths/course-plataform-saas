import { ComponentProps } from 'react';
import { FormField } from '@/components/ui/form/field';
import { Textarea } from '@/components/ui/textarea';

type TextareaFieldProps = ComponentProps<typeof FormField> &
  ComponentProps<typeof Textarea>;

export const TextareaField = ({
  name,
  className,
  ...props
}: TextareaFieldProps) => {
  return (
    <FormField name={name} className={className} {...props}>
      {({ field }) => <Textarea {...field} {...props} />}
    </FormField>
  );
};
