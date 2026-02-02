import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Video, FileText, Download } from 'lucide-react';
import Link from 'next/link';

const resources = [
  {
    id: 1,
    title: '파트너 온보딩 가이드',
    description: '새로운 파트너를 위한 필수 가이드북입니다. 시스템 사용법과 정책을 확인하세요.',
    type: 'PDF',
    icon: FileText,
    date: '2023-10-01',
  },
  {
    id: 2,
    title: '2023 Q4 제품 로드맵',
    description: '4분기 출시 예정인 신제품과 주요 업데이트 내용을 소개합니다.',
    type: 'VIDEO',
    icon: Video,
    date: '2023-09-15',
  },
  {
    id: 3,
    title: '영업 제안서 템플릿',
    description: '고객 제안 시 사용할 수 있는 표준 제안서 양식입니다.',
    type: 'PPT',
    icon: Download,
    date: '2023-08-20',
  },
  {
    id: 4,
    title: '기술 지원 매뉴얼',
    description: '자주 묻는 기술적 문제에 대한 해결 방법을 담고 있습니다.',
    type: 'DOC',
    icon: BookOpen,
    date: '2023-07-10',
  },
];

export default function PartnerEducationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">교육 및 자료실</h1>
        <p className="text-muted-foreground">
          파트너 역량 강화를 위한 교육 자료와 영업 지원 도구를 제공합니다.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <Card key={resource.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <span className="text-xs text-muted-foreground">{resource.type} • {resource.date}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <CardDescription>
                  {resource.description}
                </CardDescription>
                <Link 
                  href="#" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
