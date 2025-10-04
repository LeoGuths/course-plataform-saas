import { Form } from '@/components/ui/form/primitives';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { creditCardCheckoutFormSchema } from '@/server/schemas/payment';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputField } from '@/components/ui/form/input-field';
import { FormField } from '@/components/ui/form/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select } from '@/components/ui/select';
import Cards from 'react-credit-cards-2';
import {
  calculateInstallmentOptions,
  formatPrice,
  unmaskValue,
} from '@/lib/utils';
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createCreditCardCheckout } from '@/actions/payment';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type FormData = z.infer<typeof creditCardCheckoutFormSchema>;

type CreditCardFormProps = {
  onBack: () => void;
  onClose: () => void;
  course: Course;
};

export const CreditCardForm = ({
  onBack,
  onClose,
  course,
}: CreditCardFormProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(creditCardCheckoutFormSchema),
    defaultValues: {
      installments: 1,
      cardCvv: '',
      cardNumber: '',
      cardValidThru: '',
      name: '',
      addressNumber: '',
      cpf: '',
      phone: '',
      postalCode: '',
    },
  });

  const { handleSubmit, watch, setError } = form;

  const router = useRouter();
  const formVales = watch();
  const rawCep = watch('postalCode');

  const installmentsOptions = useMemo(() => {
    return calculateInstallmentOptions(
      course.discountPrice ?? course.price
    ).map(option => ({
      value: String(option.installments),
      label: `${option.installments}x ${formatPrice(option.installmentValue)}${option.hasInterest ? '' : ' (sem juros)'}`,
    }));
  }, [course?.discountPrice, course.price]);

  const { mutateAsync: validateCep, isPending: isValidatingCep } = useMutation({
    mutationFn: async () => {
      try {
        const cep = unmaskValue(rawCep);

        const response = await axios.get(
          `https://viacep.com.br/ws/${cep}/json/`
        );

        if (response.data.error) {
          setError('postalCode', { type: 'manual', message: 'CEP inválido' });
          return false;
        }

        return true;
      } catch {
        setError('postalCode', {
          type: 'manual',
          message: 'Erro ao validar o CEP',
        });

        return false;
      }
    },
  });

  const { mutateAsync: handleCheckout, isPending: isLoading } = useMutation({
    mutationFn: createCreditCardCheckout,
    onSuccess: async () => {
      toast.success('Pagamento efetuado com sucesso!');

      onClose();

      toast.success(
        'Agradecemos por sua compra! Você será redirecionado para o curso em instantes.'
      );

      await new Promise(resolve => setTimeout(resolve, 4000));

      router.push(`/courses/${course.slug}`);
    },
    onError: error => {
      if (error?.name === 'NOT_AUTHORIZED') {
        toast.error(error.message);
        return;
      }

      if (error?.name === 'CONFLICT') {
        toast.error('Você já possui acesso a este curso!');
        onClose();
        return;
      }

      toast.error(
        'Ocorreu um erro ao processar o pagamento. Tente novamente ou entre em contato com o suporte.'
      );
    },
  });

  const onSubmit = async (data: FormData) => {
    const isValidCep = await validateCep();

    if (!isValidCep) return;

    toast.promise(
      handleCheckout({
        ...data,
        courseId: course.id,
      }),
      {
        loading: 'Processando pagamento...',
      }
    );
  };

  return (
    <Form {...form}>
      <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center gap-4 flex-col">
          <div>
            <Cards
              cvc={formVales.cardCvv}
              expiry={formVales.cardValidThru}
              name={formVales.name}
              number={formVales.cardNumber}
              placeholders={{ name: 'NOME COMPLETO' }}
              locale={{ valid: 'Válido até' }}
            />
          </div>

          <div className="w-full grid sm:grid-cols-2 gap-2 flex-1">
            <InputField
              name="name"
              placeholder="Nome impresso no cartão"
              className="col-span-full"
            />
            <InputField
              name="cpf"
              placeholder="CPF do titular"
              mask="___.___.___-__"
            />
            <FormField name="phone">
              {({ field }) => (
                <Input
                  {...field}
                  onChange={({ target }) => {
                    const value = target.value.replace(/\D/g, '');
                    field.onChange(value);
                  }}
                  placeholder="Telefone do titular com DDD"
                />
              )}
            </FormField>

            <Separator className="col-span-full my-1 sm:my-2" />

            <InputField
              name="cardNumber"
              placeholder="Número do cartão"
              mask="____ ____ ____ ____"
            />
            <InputField
              name="cardValidThru"
              placeholder="Validade"
              mask="__/__"
            />
            <InputField name="cardCvv" placeholder="CVV" mask="___" />
            <FormField name="installments">
              {({ field }) => (
                <Select
                  value={String(field.value)}
                  onChange={value => field.onChange(Number(value))}
                  options={installmentsOptions}
                  placeholder="Parcelas"
                />
              )}
            </FormField>

            <Separator className="col-span-full my-1 sm:my-2" />

            <div className="col-span-full grid sm:grid-cols-[1.4fr_1fr_1fr] gap-2">
              <InputField name="address" placeholder="Endereço (Opcional)" />
              <InputField name="addressNumber" placeholder="Número" />
              <InputField
                name="postalCode"
                placeholder="CEP"
                mask="_____-___"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" type="button" onClick={onBack}>
            <ArrowLeft />
            Voltar
          </Button>

          <Button type="submit" disabled={isLoading || isValidatingCep}>
            <ArrowRight />
            Confirmar
          </Button>
        </div>
      </form>
    </Form>
  );
};
