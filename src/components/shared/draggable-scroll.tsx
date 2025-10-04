'use client';

import React, { ComponentProps, useRef } from 'react';
import { useDraggable } from 'react-use-draggable-scroll';

type DraggableScrollProps = ComponentProps<'div'>;

export const DraggableScroll = ({ ...props }: DraggableScrollProps) => {
  const ref = useRef<HTMLDivElement>(
    null
  ) as React.MutableRefObject<HTMLDivElement>;
  const { events } = useDraggable(ref);

  return <div {...props} {...events} ref={ref} />;
};
