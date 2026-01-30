import React, { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';

interface ExcelUploaderProps {
  onDataLoaded: (data: any[]) => void;
}

export const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onDataLoaded }) => {
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      onDataLoaded(json);
    };
    reader.readAsBinaryString(file);
  }, [onDataLoaded]);

  return (
    <label className="glass p-12 text-center border-dashed border-2 border-slate-600 hover:border-indigo-500 transition-colors cursor-pointer relative group block">
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="sr-only"
      />
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
          <Upload size={48} />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Excelファイルをアップロード</h3>
          <p className="text-slate-400">クリックまたはドラッグ＆ドロップでファイルを選択</p>
        </div>
      </div>
    </label>
  );
};
