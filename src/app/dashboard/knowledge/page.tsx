import { getArticles, getArticleStats } from "@/app/actions/knowledge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen, FileText, HelpCircle } from "lucide-react";
import { AddArticleDialog } from "@/components/knowledge/add-article-dialog";
import { ArticleViewDialog } from "@/components/knowledge/article-view-dialog";
import { AIKnowledgeSearch } from "@/components/knowledge/ai-knowledge-search";

export default async function KnowledgePage() {
  let articles: any[] = [];
  let stats = { total: 0, faq: 0, manual: 0, guide: 0 };

  try {
    articles = await getArticles();
    stats = await getArticleStats();
  } catch (error) {
    console.error("Error loading knowledge base:", error);
  }

  // 카테고리별 색상 매핑
  const getCategoryBadge = (category: string) => {
    const variants: Record<string, any> = {
      FAQ: "default",
      "제품 매뉴얼": "secondary",
      "사용 가이드": "outline",
      "문제 해결": "destructive",
    };
    return variants[category] || "outline";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">지식 기반 (Knowledge Base)</h2>
          <p className="text-muted-foreground">
            FAQ, 제품 매뉴얼, 사용 가이드 등 고객 지원 자료를 통합 관리합니다.
          </p>
        </div>
        <AddArticleDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 문서</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FAQ</CardTitle>
            <HelpCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.faq}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">제품 매뉴얼</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.manual}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">사용 가이드</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.guide}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI 검색 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>AI 지식 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <AIKnowledgeSearch />
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>태그</TableHead>
              <TableHead>작성일</TableHead>
              <TableHead>최종 수정</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  등록된 문서가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium max-w-md">
                    <div className="truncate">{article.title}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCategoryBadge(article.category)}>
                      {article.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-xs">
                      {article.tags?.split(",").slice(0, 3).map((tag: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(article.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(article.updatedAt).toLocaleDateString("ko-KR")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <ArticleViewDialog article={article} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
