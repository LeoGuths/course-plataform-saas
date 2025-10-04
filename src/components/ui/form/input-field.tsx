import { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form/field';
import { InputMask } from '@react-input/mask';

type InputFieldProps = ComponentProps<typeof FormField> &
  ComponentProps<typeof Input> & {
    mask?: string;
  };

export const InputField = ({
  name,
  className,
  mask,
  ...props
}: InputFieldProps) => {
  return (
    <FormField name={name} className={className} {...props}>
      {({ field }) =>
        mask ? (
          <InputMask
            mask={mask}
            component={Input}
            replacement={{ _: /\d/ }}
            {...field}
            {...props}
          />
        ) : (
          <Input {...field} {...props} />
        )
      }
    </FormField>
  );
};
