'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui';

interface ImportSummary {
  totalRows: number;
  parsed: number;
  imported: number;
  duplicates: number;
  skipped: number;
  errors: string[];
}

interface FileUploadProps {
  onImportComplete?: (summary: ImportSummary) => void;
}

export function FileUpload({ onImportComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    summary?: ImportSummary;
    error?: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setUploadResult({
        success: false,
        error: 'יש להעלות קובץ Excel (.xlsx או .xls)',
      });
      return;
    }
    
    setFile(file);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult({
          success: true,
          summary: result.summary,
        });
        setFile(null);
        onImportComplete?.(result.summary);
      } else {
        setUploadResult({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: 'שגיאה בהעלאת הקובץ. נסה שוב.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-2">
          <div className="text-4xl">📂</div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            גרור קובץ אקסל לכאן
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            או לחץ לבחירת קובץ
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            תומך בקבצי .xlsx ו-.xls ממיטב טרייד
          </p>
        </div>
      </div>

      {/* Selected File */}
      {file && (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
            >
              הסר
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
              isLoading={isUploading}
            >
              ייבא עסקאות
            </Button>
          </div>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <div
          className={`p-4 rounded-lg ${
            uploadResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}
        >
          {uploadResult.success && uploadResult.summary ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <span>✅</span>
                <span className="font-medium">הייבוא הושלם בהצלחה!</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {uploadResult.summary.totalRows}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">שורות בקובץ</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {uploadResult.summary.imported}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">יובאו</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {uploadResult.summary.duplicates}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">כפילויות</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-500">
                    {uploadResult.summary.skipped}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">דולגו</p>
                </div>
              </div>
              {uploadResult.summary.errors.length > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">שגיאות:</p>
                  <ul className="list-disc list-inside text-yellow-600 dark:text-yellow-500">
                    {uploadResult.summary.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <span>❌</span>
              <span>{uploadResult.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
