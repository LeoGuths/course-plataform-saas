import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { CoursesTable } from '@/components/pages/admin/courses-table';
import { getAdminCourses } from '@/actions/courses';

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cursos</h1>

        <Link passHref href="/admin/courses/create">
          <Button>
            Adicionar curso
            <Plus />
          </Button>
        </Link>
      </div>

      <CoursesTable courses={courses} />
    </>
  );
}
