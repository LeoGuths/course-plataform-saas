import { ComponentProps } from 'react';
import { FormField } from '@/components/ui/form/field';
import { Select } from '@/components/ui/select';

type SelectFieldProps = ComponentProps<typeof FormField> &
  Omit<ComponentProps<typeof Select>, 'onChange'>;

export const SelectField = ({
  name,
  className,
  ...props
}: SelectFieldProps) => {
  return (
    <FormField name={name} className={className} {...props}>
      {({ field }) => <Select {...field} {...props} />}
    </FormField>
  );
};
