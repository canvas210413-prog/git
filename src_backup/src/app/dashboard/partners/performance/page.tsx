import { getPartnerPerformanceData } from '@/app/actions/partners';
import { PerformanceCharts } from '@/components/partners/performance-charts';

export default async function PartnerPerformancePage() {
  const performanceData = await getPartnerPerformanceData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">성과 분석</h1>
        <p className="text-muted-foreground">
          전체 파트너의 매출, 수수료 및 영업 성과를 분석합니다.
        </p>
      </div>

      <PerformanceCharts data={performanceData} />
    </div>
  );
}
