"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import {
  exportToExcel,
  importFromExcel,
  downloadTemplate,
  ExcelColumn,
  ImportResult,
} from "@/lib/excel-utils";

// ============================================================================
// Excel 내보내기 버튼
// ============================================================================

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ExcelColumn[];
  filename: string;
  sheetName?: string;
  disabled?: boolean;
}

export function ExcelExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  sheetName = "Data",
  disabled = false,
}: ExportButtonProps<T>) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      exportToExcel(data, columns, filename, sheetName);
    } catch (error) {
      console.error("Excel 내보내기 오류:", error);
      alert("Excel 파일 생성 중 오류가 발생했습니다.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || exporting || data.length === 0}
    >
      {exporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          내보내기 중...
        </>
      ) : (
        <>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel 내보내기
        </>
      )}
    </Button>
  );
}

// ============================================================================
// Excel 가져오기 다이얼로그
// ============================================================================

interface ImportDialogProps<T> {
  columns: ExcelColumn[];
  onImport: (data: T[]) => Promise<{ success: boolean; message: string }>;
  entityName: string;
  validateRow?: (row: Record<string, unknown>) => { valid: boolean; error?: string };
  sampleData?: Record<string, unknown>[];
  buttonText?: string;
}

export function ExcelImportDialog<T>({
  columns,
  onImport,
  entityName,
  validateRow,
  sampleData,
  buttonText,
}: ImportDialogProps<T>) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult<T> | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setImportStatus(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const importResult = await importFromExcel<T>(file, columns, validateRow);
      setResult(importResult);
    } catch (error) {
      console.error("파일 읽기 오류:", error);
      setResult({
        success: false,
        data: [],
        errors: ["파일을 읽는 중 오류가 발생했습니다."],
        totalRows: 0,
        validRows: 0,
      });
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    if (!result || result.data.length === 0) return;
    setImporting(true);
    try {
      const status = await onImport(result.data);
      setImportStatus(status);
      if (status.success) {
        setTimeout(() => {
          setOpen(false);
          resetState();
        }, 2000);
      }
    } catch (error) {
      setImportStatus({
        success: false,
        message: "데이터 저장 중 오류가 발생했습니다.",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(columns, entityName, sampleData);
  };

  const resetState = () => {
    setFile(null);
    setResult(null);
    setImportStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <Upload className="h-4 w-4 mr-2" />
          {buttonText || "Excel 가져오기"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {entityName} Excel 가져오기
          </DialogTitle>
          <DialogDescription>
            Excel 파일을 업로드하여 {entityName} 데이터를 일괄 등록할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 템플릿 다운로드 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">템플릿 다운로드</p>
              <p className="text-xs text-muted-foreground">
                올바른 형식의 Excel 파일을 다운로드하여 데이터를 입력하세요.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
              <FileDown className="h-4 w-4 mr-2" />
              템플릿
            </Button>
          </div>

          {/* 파일 업로드 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">파일 선택</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {file && (
                <Button variant="ghost" size="sm" onClick={resetState}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {file && (
              <p className="text-xs text-muted-foreground">
                선택된 파일: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* 미리보기 버튼 */}
          {file && !result && (
            <Button onClick={handlePreview} disabled={importing} className="w-full">
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  파일 분석 중...
                </>
              ) : (
                "파일 분석 및 미리보기"
              )}
            </Button>
          )}

          {/* 분석 결과 */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">분석 결과</p>
                  <p className="text-xs text-muted-foreground">
                    총 {result.totalRows}행 중 {result.validRows}행 유효
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={result.validRows > 0 ? "default" : "destructive"}>
                    {result.validRows}건 준비됨
                  </Badge>
                  {result.errors.length > 0 && (
                    <Badge variant="destructive">{result.errors.length}건 오류</Badge>
                  )}
                </div>
              </div>

              {/* 진행률 */}
              <Progress value={(result.validRows / result.totalRows) * 100} className="h-2" />

              {/* 오류 목록 */}
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-1">다음 오류가 발견되었습니다:</p>
                    <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
                      {result.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>• {err}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>... 외 {result.errors.length - 5}건</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* 가져오기 상태 */}
          {importStatus && (
            <Alert variant={importStatus.success ? "default" : "destructive"}>
              {importStatus.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{importStatus.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleImport}
            disabled={!result || result.validRows === 0 || importing || importStatus?.success}
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {result?.validRows || 0}건 가져오기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 통합 Excel 툴바 컴포넌트
// ============================================================================

interface ExcelToolbarProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ExcelColumn[];
  entityName: string;
  onImport?: (data: T[]) => Promise<{ success: boolean; message: string }>;
  validateRow?: (row: Record<string, unknown>) => { valid: boolean; error?: string };
  sampleData?: Record<string, unknown>[];
  showImport?: boolean;
  buttonText?: string;
}

export function ExcelToolbar<T extends Record<string, unknown>>({
  data,
  columns,
  entityName,
  onImport,
  validateRow,
  sampleData,
  showImport = true,
  buttonText,
}: ExcelToolbarProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <ExcelExportButton
        data={data}
        columns={columns}
        filename={entityName}
        sheetName={entityName}
      />
      {showImport && onImport && (
        <ExcelImportDialog
          columns={columns}
          onImport={onImport}
          entityName={entityName}
          validateRow={validateRow}
          sampleData={sampleData}
          buttonText={buttonText}
        />
      )}
    </div>
  );
}
