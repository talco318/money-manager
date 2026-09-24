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
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    fileName: string;
    success: boolean;
    summary?: ImportSummary;
    error?: string;
  }[]>([]);
  
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
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndSetFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    validateAndSetFiles(selectedFiles);
  }, []);

  const validateAndSetFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    for (const file of newFiles) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Check if file already added
        if (!files.some(f => f.name === file.name && f.size === file.size)) {
          validFiles.push(file);
        }
      } else {
        errors.push(`${file.name} - יש להעלות קובץ Excel (.xlsx או .xls)`);
      }
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setUploadResults([]);
    }
    
    if (errors.length > 0) {
      setUploadResults(errors.map(err => ({
        fileName: err.split(' - ')[0],
        success: false,
        error: err.split(' - ')[1],
      })));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadResults([]);
    
    const results: typeof uploadResults = [];
    let totalImported = 0;
    let totalDuplicates = 0;

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      const file = files[i];
      
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/transactions/import', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          results.push({
            fileName: file.name,
            success: true,
            summary: result.summary,
          });
          totalImported += result.summary.imported;
          totalDuplicates += result.summary.duplicates;
        } else {
          results.push({
            fileName: file.name,
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        results.push({
          fileName: file.name,
          success: false,
          error: 'שגיאה בהעלאת הקובץ',
        });
      }
    }

    setUploadResults(results);
    setFiles([]);
    setIsUploading(false);
    
    // Notify parent with combined summary
    if (totalImported > 0) {
      onImportComplete?.({
        totalRows: results.reduce((sum, r) => sum + (r.summary?.totalRows || 0), 0),
        parsed: results.reduce((sum, r) => sum + (r.summary?.parsed || 0), 0),
        imported: totalImported,
        duplicates: totalDuplicates,
        skipped: results.reduce((sum, r) => sum + (r.summary?.skipped || 0), 0),
        errors: results.flatMap(r => r.summary?.errors || []),
      });
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setFiles([]);
    setUploadResults([]);
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
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-2">
          <div className="text-4xl">📂</div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            גרור קבצי אקסל לכאן
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            או לחץ לבחירת קבצים (ניתן לבחור מספר קבצים)
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            תומך בקבצי .xlsx ו-.xls ממיטב טרייד • זיהוי כפילויות אוטומטי
          </p>
        </div>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-700 dark:text-gray-200">
              {files.length} קבצים נבחרו
            </p>
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              נקה הכל
            </Button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>
          
          <Button
            variant="primary"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              handleUpload();
            }}
            isLoading={isUploading}
          >
            {isUploading 
              ? `מייבא קובץ ${currentFileIndex + 1} מתוך ${files.length}...` 
              : `ייבא ${files.length} קבצים`
            }
          </Button>
        </div>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div className="space-y-3">
          {uploadResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span>{result.success ? '✅' : '❌'}</span>
                <span className="font-medium text-gray-900 dark:text-white">{result.fileName}</span>
              </div>
              
              {result.success && result.summary ? (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {result.summary.totalRows}
                    </p>
                    <p className="text-xs text-gray-500">שורות</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">
                      {result.summary.imported}
                    </p>
                    <p className="text-xs text-gray-500">יובאו</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-yellow-600">
                      {result.summary.duplicates}
                    </p>
                    <p className="text-xs text-gray-500">כפילויות</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-500">
                      {result.summary.skipped}
                    </p>
                    <p className="text-xs text-gray-500">דולגו</p>
                  </div>
                </div>
              ) : (
                <p className="text-red-700 dark:text-red-400 text-sm">{result.error}</p>
              )}
            </div>
          ))}
          
          {/* Combined Summary */}
          {uploadResults.filter(r => r.success).length > 1 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">סה"כ מכל הקבצים:</p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {uploadResults.reduce((sum, r) => sum + (r.summary?.imported || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">עסקאות יובאו</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {uploadResults.reduce((sum, r) => sum + (r.summary?.duplicates || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">כפילויות זוהו</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
