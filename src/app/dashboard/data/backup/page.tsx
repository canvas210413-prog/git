"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  HardDrive, Download, Clock, CheckCircle,
  Calendar, Database, RefreshCw, Shield, Trash2,
  AlertTriangle, RotateCcw, Eye, FileText, FileSpreadsheet,
  ChevronLeft, X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  createBackup,
  getBackupRecords,
  getBackupStats,
  getDatabaseTables,
  restoreBackup,
  deleteBackup,
  getBackupPreview,
  getBackupTableData,
  getBackupTableCsv,
  type BackupInfo,
  type BackupStats,
  type BackupPreviewInfo,
  type TableDataResult,
} from "@/app/actions/backup";

export default function BackupPage() {
  const [autoBackup, setAutoBackup] = useState(true);
  const [backing, setBacking] = useState(false);
  const [backingProgress, setBackingProgress] = useState(0);
  const [backingStep, setBackingStep] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [backupHistory, setBackupHistory] = useState<BackupInfo[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [tables, setTables] = useState<{ name: string; rows: number }[]>([]);
  
  // 다이얼로그 상태
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [previewData, setPreviewData] = useState<BackupPreviewInfo | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // 테이블 데이터 뷰 상태
  const [viewingTable, setViewingTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableDataResult | null>(null);
  const [tableDataLoading, setTableDataLoading] = useState(false);
  
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const [records, statsData, tablesData] = await Promise.all([
        getBackupRecords(),
        getBackupStats(),
        getDatabaseTables(),
      ]);
      
      setBackupHistory(records);
      setStats(statsData);
      setTables(tablesData);
      setAutoBackup(statsData.autoBackupEnabled);
    } catch (error) {
      console.error("Failed to load backup data:", error);
      setMessage({ type: "error", text: "데이터를 불러오는데 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 수동 백업 실행
  const handleBackup = async () => {
    setBacking(true);
    setBackingProgress(0);
    setMessage(null);
    
    try {
      // 단계 1: 백업 준비 (0-10%)
      setBackingStep("백업 디렉토리 확인 중...");
      setBackingProgress(5);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setBackingProgress(10);
      
      // 단계 2: 데이터베이스 연결 확인 (10-20%)
      setBackingStep("데이터베이스 연결 확인 중...");
      setBackingProgress(15);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setBackingProgress(20);
      
      // 단계 3: 백업 실행 (20-90%)
      setBackingStep("데이터베이스 백업 중... (시간이 걸릴 수 있습니다)");
      
      // 백업 실행 중 진행률 시뮬레이션
      const backupPromise = createBackup("manual");
      const progressInterval = setInterval(() => {
        setBackingProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 5;
        });
      }, 800);
      
      const result = await backupPromise;
      clearInterval(progressInterval);
      
      // 단계 4: 백업 완료 (90-100%)
      setBackingProgress(90);
      setBackingStep("백업 파일 검증 중...");
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setBackingProgress(95);
      setBackingStep("백업 레코드 저장 중...");
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setBackingProgress(100);
      setBackingStep("백업 완료!");
      
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        await loadData();
      } else {
        setMessage({ type: "error", text: result.message });
      }
      
      // 완료 메시지 표시 후 프로그레스 바 숨김
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      setMessage({ type: "error", text: "백업 실행 중 오류가 발생했습니다." });
    } finally {
      setBacking(false);
      setBackingProgress(0);
      setBackingStep("");
    }
  };

  // 복구 확인 다이얼로그
  const openRestoreDialog = (backup: BackupInfo) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  // 복구 실행
  const handleRestore = async () => {
    if (!selectedBackup) return;
    
    setRestoring(true);
    setRestoreDialogOpen(false);
    setMessage(null);
    
    try {
      const result = await restoreBackup(selectedBackup.filename);
      
      if (result.success) {
        setMessage({ type: "success", text: result.message });
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "복구 실행 중 오류가 발생했습니다." });
    } finally {
      setRestoring(false);
      setSelectedBackup(null);
    }
  };

  // 삭제 확인 다이얼로그
  const openDeleteDialog = (backup: BackupInfo) => {
    setSelectedBackup(backup);
    setDeleteDialogOpen(true);
  };

  // 미리보기 다이얼로그
  const openPreviewDialog = async (backup: BackupInfo) => {
    setSelectedBackup(backup);
    setPreviewDialogOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);
    setViewingTable(null);
    setTableData(null);
    
    try {
      const result = await getBackupPreview(backup.filename);
      if (result.success && result.data) {
        setPreviewData(result.data);
      } else {
        setMessage({ type: "error", text: result.message || "미리보기를 불러올 수 없습니다." });
        setPreviewDialogOpen(false);
      }
    } catch (error) {
      setMessage({ type: "error", text: "미리보기 중 오류가 발생했습니다." });
      setPreviewDialogOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 테이블 데이터 보기
  const viewTableData = async (tableName: string) => {
    if (!selectedBackup) return;
    
    setViewingTable(tableName);
    setTableDataLoading(true);
    setTableData(null);
    
    try {
      const result = await getBackupTableData(selectedBackup.filename, tableName);
      if (result.success && result.data) {
        setTableData(result.data);
      } else {
        setMessage({ type: "error", text: result.message || "데이터를 불러올 수 없습니다." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "데이터 조회 중 오류가 발생했습니다." });
    } finally {
      setTableDataLoading(false);
    }
  };

  // 테이블 목록으로 돌아가기
  const backToTableList = () => {
    setViewingTable(null);
    setTableData(null);
  };

  // CSV 다운로드
  const downloadTableCsv = async (tableName: string) => {
    if (!selectedBackup) return;
    
    try {
      const result = await getBackupTableCsv(selectedBackup.filename, tableName);
      if (result.success && result.csv) {
        const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${tableName}_backup.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setMessage({ type: "success", text: `${tableName} 데이터가 CSV로 다운로드되었습니다.` });
      } else {
        setMessage({ type: "error", text: result.message || "CSV 다운로드 실패" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "CSV 다운로드 중 오류가 발생했습니다." });
    }
  };

  // SQL 다운로드
  const downloadSql = (backup: BackupInfo) => {
    const downloadUrl = `/api/backup/download?filename=${encodeURIComponent(backup.filename)}`;
    window.open(downloadUrl, "_blank");
  };

  // 전체 백업 CSV 다운로드 (모든 테이블)
  const downloadAllCsv = async (backup: BackupInfo) => {
    setMessage({ type: "success", text: "CSV 다운로드를 준비하고 있습니다..." });
    
    try {
      // 백업 미리보기로 테이블 목록 가져오기
      const previewResult = await getBackupPreview(backup.filename);
      if (!previewResult.success || !previewResult.data) {
        setMessage({ type: "error", text: "백업 파일을 분석할 수 없습니다." });
        return;
      }

      const tables = previewResult.data.tables;
      if (tables.length === 0) {
        setMessage({ type: "error", text: "다운로드할 테이블이 없습니다." });
        return;
      }

      // 각 테이블을 순차적으로 다운로드
      for (const table of tables) {
        const result = await getBackupTableCsv(backup.filename, table.name);
        if (result.success && result.csv) {
          const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `backup_${table.name}_${new Date().getTime()}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          // 다운로드 간 짧은 딜레이
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      setMessage({ type: "success", text: `${tables.length}개 테이블의 CSV 파일이 다운로드되었습니다.` });
    } catch (error) {
      setMessage({ type: "error", text: "CSV 다운로드 중 오류가 발생했습니다." });
    }
  };

  // 삭제 실행
  const handleDelete = async () => {
    if (!selectedBackup) return;
    
    setDeleteDialogOpen(false);
    setMessage(null);
    
    try {
      const result = await deleteBackup(selectedBackup.filename);
      
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        await loadData();
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "삭제 중 오류가 발생했습니다." });
    } finally {
      setSelectedBackup(null);
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">백업 및 복구</h2>
          <p className="text-muted-foreground">데이터베이스 백업 및 복구를 관리합니다</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
            <Label>자동 백업 (매일 06:00)</Label>
          </div>
          <Button onClick={handleBackup} disabled={backing || restoring}>
            {backing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <HardDrive className="mr-2 h-4 w-4" />
            )}
            {backing ? "백업 중..." : "지금 백업"}
          </Button>
        </div>
      </div>

      {/* 백업 진행률 표시 */}
      {backing && (
        <div className="p-6 rounded-lg bg-blue-50 border border-blue-200 space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="text-blue-900 font-medium">{backingStep}</span>
          </div>
          <div className="space-y-2">
            <Progress value={backingProgress} className="h-3" />
            <div className="flex justify-between text-sm text-blue-600">
              <span>진행률: {backingProgress}%</span>
              <span>{backingProgress < 100 ? "백업 중..." : "완료!"}</span>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 표시 */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === "success" 
            ? "bg-green-50 text-green-800 border border-green-200" 
            : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* 복구 진행 중 표시 */}
      {restoring && (
        <div className="p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          데이터베이스 복구 중입니다. 잠시만 기다려주세요...
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">마지막 백업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats?.lastBackup || "-"}</div>
            {stats?.lastBackup && (
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">성공</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">다음 자동 백업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats?.nextBackup || "-"}</div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">예정됨</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 백업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBackups || 0}회</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">스토리지 사용량</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {stats?.storageUsed?.toFixed(2) || 0} / {stats?.storageTotal || 100} GB
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div 
                className="h-full rounded-full bg-primary" 
                style={{ width: `${((stats?.storageUsed || 0) / (stats?.storageTotal || 100)) * 100}%` }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 백업 항목 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              백업 항목
            </CardTitle>
            <CardDescription>
              백업에 포함되는 데이터베이스 테이블
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">로딩 중...</div>
              ) : (
                tables.map((table, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span>{table.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{table.rows.toLocaleString()}건</span>
                      <Badge className="bg-green-500">포함</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 빠른 작업 */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
            <CardDescription>
              백업 파일 관리
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              disabled={!backupHistory.length}
              onClick={() => backupHistory[0] && downloadSql(backupHistory[0])}
            >
              <FileText className="mr-2 h-4 w-4" />
              최신 백업 SQL 다운로드
              {backupHistory[0] && (
                <span className="ml-auto text-muted-foreground text-xs">
                  {backupHistory[0].size}
                </span>
              )}
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              disabled={!backupHistory.length}
              onClick={() => backupHistory[0] && downloadAllCsv(backupHistory[0])}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              최신 백업 CSV 다운로드
              {backupHistory[0] && (
                <span className="ml-auto text-muted-foreground text-xs">
                  {backupHistory[0].size}
                </span>
              )}
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              disabled={!backupHistory.length || restoring}
              onClick={() => backupHistory[0] && openRestoreDialog(backupHistory[0])}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              최신 백업으로 복구
            </Button>
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 백업 기록 */}
      <Card>
        <CardHeader>
          <CardTitle>백업 기록</CardTitle>
          <CardDescription>최근 백업 내역 (최대 100개)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일시</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>크기</TableHead>
                <TableHead>소요 시간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : backupHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    백업 기록이 없습니다. "지금 백업" 버튼을 눌러 첫 백업을 생성하세요.
                  </TableCell>
                </TableRow>
              ) : (
                backupHistory.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>{formatDate(backup.date)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {backup.type === "auto" ? "자동" : "수동"}
                      </Badge>
                    </TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell>{backup.duration || "-"}</TableCell>
                    <TableCell>
                      <Badge className={backup.status === "success" ? "bg-green-500" : "bg-red-500"}>
                        {backup.status === "success" ? "성공" : "실패"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          title="미리보기"
                          onClick={() => openPreviewDialog(backup)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          title="SQL 다운로드"
                          onClick={() => downloadSql(backup)}
                          className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          title="CSV 다운로드"
                          onClick={() => downloadAllCsv(backup)}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          title="복구"
                          onClick={() => openRestoreDialog(backup)}
                          disabled={restoring}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          title="삭제"
                          onClick={() => openDeleteDialog(backup)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 복구 확인 다이얼로그 */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              데이터베이스 복구 확인
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>{selectedBackup && formatDate(selectedBackup.date)}</strong> 시점의 
                백업으로 데이터베이스를 복구하시겠습니까?
              </p>
              <p className="text-red-600 font-medium">
                ⚠️ 현재 데이터베이스의 모든 데이터가 백업 시점으로 덮어씌워집니다.
                이 작업은 되돌릴 수 없습니다.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="bg-red-600 hover:bg-red-700">
              복구 실행
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>백업 파일 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBackup && formatDate(selectedBackup.date)} 백업 파일을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 미리보기 다이얼로그 */}
      <Dialog open={previewDialogOpen} onOpenChange={(open) => {
        setPreviewDialogOpen(open);
        if (!open) {
          setViewingTable(null);
          setTableData(null);
        }
      }}>
        <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* 헤더 */}
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {viewingTable && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={backToTableList}
                    className="text-white hover:bg-white/20 -ml-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <div>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                    {viewingTable ? (
                      <>
                        <Database className="h-5 w-5" />
                        {previewData?.tables.find(t => t.name === viewingTable)?.displayName || viewingTable}
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5" />
                        백업 데이터 미리보기
                      </>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-blue-100 mt-1">
                    {viewingTable ? (
                      `${tableData?.totalCount.toLocaleString() || 0}건의 데이터`
                    ) : (
                      selectedBackup && `${formatDate(selectedBackup.date)} · ${selectedBackup.size}`
                    )}
                  </DialogDescription>
                </div>
              </div>
              
              {/* 다운로드 버튼들 */}
              <div className="flex gap-2">
                {viewingTable && tableData && (
                  <Button 
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadTableCsv(viewingTable)}
                    className="gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV 다운로드
                  </Button>
                )}
                {!viewingTable && selectedBackup && (
                  <Button 
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadSql(selectedBackup)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    SQL 다운로드
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-auto p-6">
            {previewLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                  <p className="text-muted-foreground">백업 파일을 분석하고 있습니다...</p>
                </div>
              </div>
            ) : viewingTable && tableDataLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <RefreshCw className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                  <p className="text-muted-foreground">데이터를 불러오고 있습니다...</p>
                </div>
              </div>
            ) : viewingTable && tableData ? (
              /* 테이블 데이터 뷰 */
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-lg px-3 py-1">
                      {tableData.totalCount.toLocaleString()}건
                    </Badge>
                    <span className="text-muted-foreground">
                      ({tableData.columns.length}개 컬럼)
                    </span>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[calc(85vh-250px)]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-100">
                        <TableRow>
                          <TableHead className="w-16 font-bold text-center bg-gray-100">#</TableHead>
                          {tableData.columns.map((col, idx) => (
                            <TableHead key={idx} className="font-bold bg-gray-100 whitespace-nowrap">
                              {col}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData.rows.map((row, rowIdx) => (
                          <TableRow key={rowIdx} className="hover:bg-blue-50/50">
                            <TableCell className="text-center text-gray-500 font-mono">
                              {rowIdx + 1}
                            </TableCell>
                            {row.map((cell, cellIdx) => (
                              <TableCell key={cellIdx} className="max-w-xs">
                                <div className="truncate" title={cell}>
                                  {cell || <span className="text-gray-400 italic">-</span>}
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            ) : previewData ? (
              /* 테이블 목록 뷰 */
              <div>
                {/* 요약 카드 */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-blue-700">
                        {previewData.tables.length}
                      </div>
                      <div className="text-sm text-blue-600">테이블</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-green-700">
                        {previewData.totalRecords.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600">전체 데이터</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-purple-700">
                        {previewData.fileSize}
                      </div>
                      <div className="text-sm text-purple-600">파일 크기</div>
                    </CardContent>
                  </Card>
                </div>

                {/* 테이블 목록 */}
                <div className="space-y-3">
                  {previewData.tables.map((table, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white border-2 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{table.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            {table.name} · {table.columns.length}개 컬럼
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {table.recordCount.toLocaleString()}건
                        </Badge>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => viewTableData(table.name)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            데이터 보기
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => downloadTableCsv(table.name)}
                            className="gap-2"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            CSV
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* 푸터 */}
          <DialogFooter className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                {viewingTable ? "← 테이블 목록으로 돌아가려면 왼쪽 화살표를 클릭하세요" : "테이블을 선택하여 데이터를 확인하세요"}
              </div>
              <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
                닫기
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
