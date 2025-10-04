import { getNewUsersStats, getPurchasedCoursesStats } from '@/actions/stats';
import { StatsCharts } from '@/components/pages/admin/stats-charts';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const newUserStats = await getNewUsersStats();
  const purchasedCoursesStats = await getPurchasedCoursesStats();

  return (
    <>
      <StatsCharts
        purchasedCoursesStats={purchasedCoursesStats}
        newUsersStats={newUserStats}
      />
    </>
  );
}
