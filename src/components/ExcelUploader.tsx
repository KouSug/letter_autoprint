import React, { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download } from 'lucide-react';

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

  const handleDownloadTemplate = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // テンプレートデータの作成（見出しのみ）
    const templateData = [
      ['郵便番号', '住所1', '住所2', '氏名']
    ];

    // ワークブックとワークシートの作成
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '住所録テンプレート');

    // 列幅の調整（見やすさのため）
    const colWidths = [
      { wch: 10 }, // 郵便番号
      { wch: 30 }, // 住所1
      { wch: 30 }, // 住所2
      { wch: 15 }  // 氏名
    ];
    worksheet['!cols'] = colWidths;

    // ファイルのダウンロード
    XLSX.writeFile(workbook, '宛名印刷テンプレート.xlsx');
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <label className="glass p-12 text-center border-dashed border-2 border-slate-600 hover:border-indigo-500 transition-colors cursor-pointer relative group block w-full max-w-2xl">
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

      <button
        onClick={handleDownloadTemplate}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 hover:border-slate-500 shadow-lg"
      >
        <Download size={18} className="text-emerald-400" />
        入力用テンプレートをダウンロード
      </button>
    </div>
  );
};
