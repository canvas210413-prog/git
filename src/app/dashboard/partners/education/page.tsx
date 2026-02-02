"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  BookOpen,
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Upload,
  Download,
  Eye,
  Video,
  Image as ImageIcon,
  FileText,
  File,
  Pin,
  RefreshCw,
  Play,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/common";
import { formatNumber } from "@/lib/utils";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  getEducationMaterials,
  createEducationMaterial,
  updateEducationMaterial,
  deleteEducationMaterial,
  incrementViews,
  incrementDownloads,
  type EducationMaterial,
  type CreateMaterialInput,
} from "@/app/actions/education";

// ============================================================================
// Constants
// ============================================================================

const CATEGORIES = [
  "제품교육",
  "영업가이드",
  "시스템사용법",
  "정책안내",
  "마케팅자료",
  "기술지원",
];

const FILE_TYPES = [
  { value: "비디오", label: "비디오", icon: Video },
  { value: "이미지", label: "이미지", icon: ImageIcon },
  { value: "문서", label: "문서", icon: FileText },
  { value: "PDF", label: "PDF", icon: File },
  { value: "기타", label: "기타", icon: File },
];

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "제품교육": "bg-blue-100 text-blue-800",
    "영업가이드": "bg-green-100 text-green-800",
    "시스템사용법": "bg-purple-100 text-purple-800",
    "정책안내": "bg-yellow-100 text-yellow-800",
    "마케팅자료": "bg-pink-100 text-pink-800",
    "기술지원": "bg-orange-100 text-orange-800",
  };
  return colors[category] || "bg-gray-100 text-gray-800";
};

const getTypeIcon = (type: string) => {
  const icons: Record<string, any> = {
    "비디오": Video,
    "이미지": ImageIcon,
    "문서": FileText,
    "PDF": File,
  };
  const Icon = icons[type] || File;
  return <Icon className="h-4 w-4" />;
};

// ============================================================================
// Main Component
// ============================================================================

export default function PartnerEducationPage() {
  const [materials, setMaterials] = useState<EducationMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<EducationMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  
  // 다이얼로그 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<EducationMaterial | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<EducationMaterial | null>(null);
  
  // 폼 데이터
  const [formData, setFormData] = useState<CreateMaterialInput>({
    title: "",
    description: "",
    category: "",
    type: "",
    fileUrl: "",
    fileName: "",
    thumbnailUrl: "",
    isPublished: true,
    isPinned: false,
  });

  // 데이터 로드
  const loadMaterials = async () => {
    setLoading(true);
    try {
      const result = await getEducationMaterials();
      if (result.success && result.data) {
        setMaterials(result.data);
        setFilteredMaterials(result.data);
      }
    } catch (error) {
      console.error("자료 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // 필터링
  useEffect(() => {
    let filtered = materials;
    
    // 검색
    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 카테고리 필터
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }
    
    // 타입 필터
    if (selectedType && selectedType !== "all") {
      filtered = filtered.filter(m => m.type === selectedType);
    }
    
    setFilteredMaterials(filtered);
  }, [searchQuery, selectedCategory, selectedType, materials]);

  // 다이얼로그 열기/닫기
  const openDialog = (material?: EducationMaterial) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        title: material.title,
        description: material.description || "",
        category: material.category,
        type: material.type,
        fileUrl: material.fileUrl || "",
        fileName: material.fileName || "",
        thumbnailUrl: material.thumbnailUrl || "",
        isPublished: material.isPublished,
        isPinned: material.isPinned,
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        title: "",
        description: "",
        category: "",
        type: "",
        fileUrl: "",
        fileName: "",
        thumbnailUrl: "",
        isPublished: true,
        isPinned: false,
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingMaterial(null);
  };

  // 저장
  const handleSave = async () => {
    try {
      if (editingMaterial) {
        await updateEducationMaterial(editingMaterial.id, formData);
        alert("✅ 수정되었습니다.");
      } else {
        await createEducationMaterial(formData);
        alert("✅ 등록되었습니다.");
      }
      closeDialog();
      loadMaterials();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("❌ 저장에 실패했습니다.");
    }
  };

  // 삭제
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    
    try {
      await deleteEducationMaterial(id);
      alert("✅ 삭제되었습니다.");
      loadMaterials();
    } catch (error) {
      console.error("삭제 실패:", error);
      alert("❌ 삭제에 실패했습니다.");
    }
  };

  // 상세보기
  const handleView = async (material: EducationMaterial) => {
    setViewingMaterial(material);
    setIsViewDialogOpen(true);
    await incrementViews(material.id);
  };

  // 다운로드
  const handleDownload = async (material: EducationMaterial) => {
    if (!material.fileUrl) return;
    
    await incrementDownloads(material.id);
    window.open(material.fileUrl, "_blank");
  };

  // 통계
  const stats = {
    total: materials.length,
    videos: materials.filter(m => m.type === "비디오").length,
    documents: materials.filter(m => m.type === "문서" || m.type === "PDF").length,
    images: materials.filter(m => m.type === "이미지").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="교육 및 가이드"
        description="제품 교육, 영업 가이드, 시스템 사용법 등 다양한 교육 자료를 확인하세요."
      >
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          자료 등록
        </Button>
      </PageHeader>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 자료</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
            <p className="text-xs text-muted-foreground">등록된 자료 수</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">비디오</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.videos)}</div>
            <p className="text-xs text-muted-foreground">동영상 자료</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">문서</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNumber(stats.documents)}</div>
            <p className="text-xs text-muted-foreground">문서/PDF 자료</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이미지</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatNumber(stats.images)}</div>
            <p className="text-xs text-muted-foreground">이미지 자료</p>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">자료 목록</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-[250px]">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="제목 또는 내용 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="타입" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 타입</SelectItem>
                  {FILE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={loadMaterials}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">로딩 중...</span>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4 opacity-50" />
              <p>등록된 자료가 없습니다.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* 썸네일 */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {material.thumbnailUrl ? (
                      <img
                        src={material.thumbnailUrl}
                        alt={material.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-400">
                          {getTypeIcon(material.type)}
                        </div>
                      </div>
                    )}
                    
                    {/* 배지 */}
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge className={getCategoryColor(material.category)}>
                        {material.category}
                      </Badge>
                      {material.isPinned && (
                        <Badge variant="destructive">
                          <Pin className="h-3 w-3 mr-1" />
                          고정
                        </Badge>
                      )}
                    </div>
                    
                    {/* 타입 아이콘 */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-white/90">
                        {getTypeIcon(material.type)}
                        <span className="ml-1">{material.type}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  {/* 내용 */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {material.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {material.description || "설명이 없습니다."}
                    </p>
                    
                    {/* 메타 정보 */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(material.views)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {formatNumber(material.downloads)}
                        </div>
                      </div>
                      <div>
                        {format(new Date(material.createdAt), "yyyy.MM.dd", { locale: ko })}
                      </div>
                    </div>
                    
                    {/* 버튼 */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleView(material)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        보기
                      </Button>
                      {material.fileUrl && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(material)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDialog(material)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 등록/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? "자료 수정" : "자료 등록"}
            </DialogTitle>
            <DialogDescription>
              교육 자료를 {editingMaterial ? "수정" : "등록"}합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>제목 *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="자료 제목을 입력하세요"
              />
            </div>
            
            <div>
              <Label>설명</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="자료에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>카테고리 *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>타입 *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>파일 URL</Label>
              <Input
                value={formData.fileUrl}
                onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                placeholder="https://... (구글 드라이브, 유튜브 등)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                비디오는 유튜브 링크, 문서는 구글 드라이브 공유 링크 등을 입력하세요
              </p>
            </div>
            
            <div>
              <Label>썸네일 URL (선택)</Label>
              <Input
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">공개</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">상단 고정</span>
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              취소
            </Button>
            <Button onClick={handleSave}>
              <Upload className="h-4 w-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상세보기 다이얼로그 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewingMaterial?.title}</span>
              <div className="flex gap-2">
                <Badge className={getCategoryColor(viewingMaterial?.category || "")}>
                  {viewingMaterial?.category}
                </Badge>
                <Badge variant="secondary">
                  {getTypeIcon(viewingMaterial?.type || "")}
                  <span className="ml-1">{viewingMaterial?.type}</span>
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {viewingMaterial && (
            <div className="space-y-4">
              {/* 썸네일 또는 미리보기 */}
              {viewingMaterial.thumbnailUrl && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={viewingMaterial.thumbnailUrl}
                    alt={viewingMaterial.title}
                    className="w-full h-auto"
                  />
                </div>
              )}
              
              {/* 설명 */}
              <div>
                <h4 className="font-semibold mb-2">설명</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {viewingMaterial.description || "설명이 없습니다."}
                </p>
              </div>
              
              {/* 메타 정보 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">조회수</p>
                  <p className="font-semibold">{formatNumber(viewingMaterial.views)}회</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">다운로드</p>
                  <p className="font-semibold">{formatNumber(viewingMaterial.downloads)}회</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">등록일</p>
                  <p className="font-semibold">
                    {format(new Date(viewingMaterial.createdAt), "yyyy.MM.dd HH:mm", { locale: ko })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">작성자</p>
                  <p className="font-semibold">{viewingMaterial.createdByName || "-"}</p>
                </div>
              </div>
              
              {/* 파일 링크 */}
              {viewingMaterial.fileUrl && (
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => handleDownload(viewingMaterial)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    다운로드 / 열기
                  </Button>
                  {viewingMaterial.type === "비디오" && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(viewingMaterial.fileUrl!, "_blank")}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      재생
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
              <Button onClick={handleSave}>
                {editingFaq ? "수정" : "추가"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faqs.length}개</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              활성화
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {faqs.filter((f) => f.isActive).length}개
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              비활성화
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {faqs.filter((f) => !f.isActive).length}개
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              카테고리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(categoryStats).length}개
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="질문 또는 답변 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="카테고리 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat} ({categoryStats[cat]?.active || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* FAQ 목록 */}
      {loading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            로딩 중...
          </CardContent>
        </Card>
      ) : filteredFaqs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <MessageCircleQuestion className="mx-auto h-12 w-12 mb-4 opacity-50" />
            {searchQuery || selectedCategory !== "all"
              ? "검색 결과가 없습니다."
              : "등록된 FAQ가 없습니다. 새 FAQ를 추가해보세요!"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Badge className={categoryColors[category] || "bg-gray-100"}>
                    {category}
                  </Badge>
                  <span className="text-sm font-normal text-muted-foreground">
                    {categoryFaqs.length}개의 FAQ
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {categoryFaqs.map((faq, index) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <span
                            className={`text-sm font-medium ${
                              faq.isActive ? "" : "text-muted-foreground line-through"
                            }`}
                          >
                            Q{index + 1}. {faq.question}
                          </span>
                          {!faq.isActive && (
                            <Badge variant="outline" className="text-xs">
                              비활성
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm whitespace-pre-wrap">
                              {faq.answer}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(faq.id)}
                            >
                              {faq.isActive ? (
                                <>
                                  <ToggleRight className="mr-1 h-4 w-4 text-green-600" />
                                  활성
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="mr-1 h-4 w-4" />
                                  비활성
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(faq)}
                            >
                              <Edit className="mr-1 h-4 w-4" />
                              수정
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(faq.id)}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              삭제
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
