'use client';

import { cn } from '@/lib/utils';
import * as Accordion from '@radix-ui/react-accordion';
import { ModuleItem } from '@/components/pages/courses/course-page/modules-list/module-item';
import { usePreferencesStore } from '@/stores/preferences';
import { Button } from '@/components/ui/button';
import { PanelRightOpen } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCourseProgress } from '@/actions/course-progress';
import { useParams } from 'next/navigation';
import { queryKeys } from '@/constants/query-keys';

type ModulesListProps = {
  modules: CourseModuleWithLessons[];
};

export const ModulesList = ({ modules }: ModulesListProps) => {
  const params = useParams();

  const courseSlug = params.slug as string;
  const moduleId = params.moduleId as string;

  const {
    expandedModule,
    setExpandedModule,
    modulesListCollapsed,
    setModulesListCollapsed,
  } = usePreferencesStore();

  const initialCollapsedIsSet = useRef(false);

  useEffect(() => {
    if (initialCollapsedIsSet.current) return;

    initialCollapsedIsSet.current = true;

    setModulesListCollapsed(window.innerWidth < 768);
  }, [setModulesListCollapsed]);

  const handleToggleCollapsed = () => {
    setModulesListCollapsed(!modulesListCollapsed);
  };

  const { data: courseProgress } = useQuery({
    queryKey: queryKeys.courseProgress(courseSlug),
    queryFn: () => getCourseProgress(courseSlug),
    enabled: !!courseSlug,
  });

  const completedLessons = courseProgress?.completedLessons ?? [];

  return (
    <aside
      className={cn(
        'h-full border-l border-border bg-sidebar p-4 overflow-y-auto overflow-x-hidden',
        'min-w-[380px] max-w-[380px] transition-all flex flex-col items-center relative',
        !modulesListCollapsed &&
          'fixed top-0 bottom-0 z-10 right-0 sm:relative',
        modulesListCollapsed && 'w-18 max-w-18 min-w-18 hidden sm:flex'
      )}
    >
      <div
        className={cn(
          'absolute z-10 left-0 top-0 bottom-0 w-4 flex justify-start group cursor-e-resize',
          modulesListCollapsed && 'cursor-w-resize'
        )}
        onClick={handleToggleCollapsed}
      >
        <div className="h-full w-0.5 group-hover:bg-sidebar-border transition-all"></div>
      </div>

      {modulesListCollapsed ? (
        <Button size="icon" variant="outline" onClick={handleToggleCollapsed}>
          <PanelRightOpen />
        </Button>
      ) : (
        <>
          <Button
            variant="outline"
            onClick={handleToggleCollapsed}
            className="w-full flex sm:hidden mb-4"
          >
            Fechar módulos
          </Button>

          <Accordion.Root
            type="single"
            className="w-full h-full flex flex-col gap-3"
            collapsible
            defaultValue={moduleId}
            value={expandedModule ?? undefined}
            onValueChange={setExpandedModule}
          >
            {modules.map(courseModule => (
              <ModuleItem
                key={courseModule.id}
                data={courseModule}
                completedLessons={completedLessons}
              />
            ))}
          </Accordion.Root>
        </>
      )}
    </aside>
  );
};
