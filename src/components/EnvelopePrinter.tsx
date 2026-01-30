import React, { useState, useMemo } from 'react';
import { ExcelUploader } from './ExcelUploader';
import { FieldMapper } from './FieldMapper';
import { EnvelopePreview } from './EnvelopePreview';
import { Printer, ChevronLeft, ChevronRight, Layout, FileSpreadsheet, Eye, CheckSquare, Square, ListFilter, X, RotateCcw, Undo2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FieldMapping {
    zipCode: string;
    address1: string;
    address2: string;
    name: string;
    honorific: string;
}

export const EnvelopePrinter: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<FieldMapping>({
        zipCode: '',
        address1: '',
        address2: '',
        name: '',
        honorific: '様',
    });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
    const [printOffset, setPrintOffset] = useState({ x: 0, y: 0 });
    const [fontSettings, setFontSettings] = useState({
        zipCode: { family: '"Noto Sans JP", sans-serif', size: 24, x: 0, y: 0, spacing: 5.5 },
        address: { family: '"Noto Serif JP", serif', size: 24, x: 0, y: 0 },
        name: { family: '"Shippori Mincho", serif', size: 48, x: 6, y: 45 },
        honorific: { size: 48 }
    });

    const [localFonts, setLocalFonts] = useState<{ label: string; value: string }[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [activeField, setActiveField] = useState<'zipCode' | 'address' | 'name' | null>(null);

    // Initial settings for reset
    const INITIAL_FONT_SETTINGS = useMemo(() => ({
        zipCode: { family: '"Noto Sans JP", sans-serif', size: 24, x: 0, y: 0, spacing: 5.5 },
        address: { family: '"Noto Serif JP", serif', size: 24, x: 0, y: 0 },
        name: { family: '"Shippori Mincho", serif', size: 48, x: 6, y: 45 },
        honorific: { size: 48 }
    }), []);

    const [history, setHistory] = useState<{ fontSettings: typeof fontSettings, printOffset: typeof printOffset }[]>([]);
    const lastSavedRef = React.useRef({ fontSettings, printOffset });
    const isUndoingRef = React.useRef(false);

    // History management with debounce
    React.useEffect(() => {
        if (isUndoingRef.current) {
            isUndoingRef.current = false;
            lastSavedRef.current = { fontSettings, printOffset };
            return;
        }

        const timer = setTimeout(() => {
            const hasChanged =
                JSON.stringify(lastSavedRef.current.fontSettings) !== JSON.stringify(fontSettings) ||
                JSON.stringify(lastSavedRef.current.printOffset) !== JSON.stringify(printOffset);

            if (hasChanged) {
                setHistory(prev => [...prev, lastSavedRef.current]);
                lastSavedRef.current = { fontSettings, printOffset };
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
    }, [fontSettings, printOffset]);

    const handleUndo = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        isUndoingRef.current = true; // Skip history push on undo
        setFontSettings(previousState.fontSettings);
        setPrintOffset(previousState.printOffset);
        setHistory(prev => prev.slice(0, -1));
        lastSavedRef.current = previousState;
    };

    const handleReset = () => {
        if (!confirm('位置やフォントの設定を初期状態に戻しますか？')) return;
        // Save current state to history before reset
        setHistory(prev => [...prev, { fontSettings, printOffset }]);
        isUndoingRef.current = true;
        setFontSettings(INITIAL_FONT_SETTINGS);
        setPrintOffset({ x: 0, y: 0 });
        lastSavedRef.current = { fontSettings: INITIAL_FONT_SETTINGS, printOffset: { x: 0, y: 0 } };
    };

    const fontOptions = [
        { label: '明朝体 (標準)', value: '"Noto Serif JP", serif' },
        { label: 'ゴシック体', value: '"Noto Sans JP", sans-serif' },
        { label: 'しっぽり明朝', value: '"Shippori Mincho", serif' },
        { label: '手書き風 (紅道)', value: '"Zen Kurenaido", sans-serif' },
        ...localFonts
    ];

    const handleLoadLocalFonts = async () => {
        try {
            // @ts-ignore
            if (!window.queryLocalFonts) {
                alert('お使いのブラウザはローカルフォントの取得に対応していません (Chrome/Edge推奨)');
                return;
            }
            // @ts-ignore
            const fonts = await window.queryLocalFonts();
            const fontList = fonts
                .map((f: any) => ({ label: f.fullName, value: `"${f.fullName}"` }))
                .filter((v: any, i: number, a: any) => a.findIndex((t: any) => t.label === v.label) === i)
                .sort((a: any, b: any) => a.label.localeCompare(b.label));

            setLocalFonts(fontList);
        } catch (err) {
            console.error(err);
        }
    };


    const columns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

    const currentPersonData = useMemo(() => {
        if (data.length === 0) return null;
        const item = data[currentIndex];
        return {
            zipCode: item[mapping.zipCode] || '',
            address1: (item[mapping.address1] || '').toString().replace(/[-－]/g, 'ー'),
            address2: (item[mapping.address2] || '').toString().replace(/[-－]/g, 'ー'),
            name: item[mapping.name] || '',
            honorific: mapping.honorific,
        };
    }, [data, mapping, currentIndex]);

    const handleDataLoaded = (loadedData: any[]) => {
        setData(loadedData);
        setSelectedIndices(new Set(loadedData.map((_, i) => i)));
        setStep('map');
    };

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIndices(newSet);
    };

    const toggleAll = () => {
        if (selectedIndices.size === data.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(data.map((_, i) => i)));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handlePositionChange = (key: 'zipCode' | 'address' | 'name', deltaX: number, deltaY: number) => {
        setFontSettings(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                x: Number((prev[key].x + deltaX).toFixed(1)),
                y: Number((prev[key].y + deltaY).toFixed(1))
            }
        }));
    };

    const handleFontChange = (key: 'zipCode' | 'address' | 'name' | 'honorific', setting: string | number, type: 'family' | 'size' | 'spacing') => {
        setFontSettings(prev => {
            // honorific only has size
            if (key === 'honorific') {
                return {
                    ...prev,
                    honorific: { ...prev.honorific, size: Number(setting) }
                };
            }
            return {
                ...prev,
                [key]: {
                    ...prev[key],
                    [type]: type === 'family' ? setting : Number(setting)
                }
            };
        });
    };

    return (
        <>
            <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 no-print">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-12 flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                                封筒宛名印刷
                            </h1>
                            <p className="text-slate-400">Excelデータから高品質な封筒印刷を簡単に</p>
                        </div>
                        {data.length > 0 ? (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        if (confirm('データをクリアして最初の画面に戻りますか？')) {
                                            setData([]);
                                            setStep('upload');
                                            setCurrentIndex(0);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                                >
                                    <ChevronLeft size={18} />
                                    最初から
                                </button>
                                <button
                                    onClick={() => setStep('map')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${step === 'map' ? 'bg-indigo-600' : 'bg-slate-800'}`}
                                >
                                    <Layout size={18} />
                                    マッピング
                                </button>
                                <button
                                    onClick={() => setStep('preview')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${step === 'preview' ? 'bg-indigo-600' : 'bg-slate-800'}`}
                                >
                                    <Eye size={18} />
                                    プレビュー
                                </button>
                                <button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 px-4 py-2 rounded-lg text-white font-semibold">
                                    <Printer size={18} />
                                    {selectedIndices.size}件を印刷
                                </button>
                            </div>
                        ) : (
                            <button
                                disabled
                                className="bg-slate-800 text-slate-500 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed opacity-50"
                            >
                                <Printer size={20} />
                                印刷する
                            </button>
                        )}
                    </header>

                    <AnimatePresence mode="wait">
                        {step === 'upload' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <ExcelUploader onDataLoaded={handleDataLoaded} />
                                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="glass p-6">
                                        <FileSpreadsheet className="text-indigo-400 mb-4" size={32} />
                                        <h3 className="text-lg font-semibold mb-2">Excel読込</h3>
                                        <p className="text-sm text-slate-400">Excelファイルをドラッグするだけで、住所録を自動で読み込みます。</p>
                                    </div>
                                    <div className="glass p-6">
                                        <Layout className="text-cyan-400 mb-4" size={32} />
                                        <h3 className="text-lg font-semibold mb-2">自由なマッピング</h3>
                                        <p className="text-sm text-slate-400">Excelの列名を住所や氏名に自由に紐付けることができます。</p>
                                    </div>
                                    <div className="glass p-6">
                                        <Printer className="text-emerald-400 mb-4" size={32} />
                                        <h3 className="text-lg font-semibold mb-2">長形3号対応</h3>
                                        <p className="text-sm text-slate-400">日本の標準的な封筒サイズに合わせた縦書きレイアウト。一瞬で大量印刷。</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 'map' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <FieldMapper
                                    columns={columns}
                                    mapping={mapping}
                                    onMappingChange={setMapping}
                                    onComplete={() => setStep('preview')}
                                    onBack={() => setStep('upload')}
                                />
                            </motion.div>
                        )}

                        {step === 'preview' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="flex flex-col lg:flex-row gap-8 items-start"
                            >
                                {/* 左カラム：設定パネル */}
                                <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 order-2 lg:order-1">
                                    <div className="w-full flex justify-between items-center glass p-4 rounded-xl">
                                        <h2 className="text-xl font-bold">印刷プレビュー</h2>
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={currentIndex === 0}
                                                onClick={() => setCurrentIndex(i => i - 1)}
                                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-30 transition-colors"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                            <div className="flex items-center gap-1 bg-white rounded px-2 border border-slate-300 shadow-inner">
                                                <input
                                                    type="number"
                                                    value={currentIndex + 1}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val)) {
                                                            const newIndex = Math.max(0, Math.min(data.length - 1, val - 1));
                                                            setCurrentIndex(newIndex);
                                                        }
                                                    }}
                                                    className="w-12 bg-transparent border-none text-center font-mono text-lg font-bold text-slate-900 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="text-slate-400 font-mono text-sm">/ {data.length}</span>
                                            </div>
                                            <button
                                                disabled={currentIndex === data.length - 1}
                                                onClick={() => setCurrentIndex(i => i + 1)}
                                                className="p-2 bg-slate-700 hover:bg-slate-600 rounded disabled:opacity-30 transition-colors"
                                            >
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </div>


                                    {/* フォント設定 */}
                                    <div className="glass p-6">
                                        <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">Aa</span>
                                                文字設定
                                            </div>
                                            <button
                                                onClick={handleLoadLocalFonts}
                                                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors"
                                            >
                                                PCフォント読込
                                            </button>
                                        </h3>


                                        <div className="grid grid-cols-1 gap-6">
                                            {/* 宛名 */}
                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <label className="text-sm text-slate-400">宛名（氏名・敬称）</label>
                                                    <span className="text-xs text-slate-500">{fontSettings.name.size}px / 敬称{fontSettings.honorific.size}px</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <select
                                                        value={fontSettings.name.family}
                                                        onChange={(e) => setFontSettings(prev => ({ ...prev, name: { ...prev.name, family: e.target.value } }))}
                                                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-sm"
                                                    >
                                                        {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                    <div className="flex gap-4 items-center">
                                                        <span className="text-xs text-slate-500 w-8">氏名</span>
                                                        <input
                                                            type="range" min="20" max="120" value={fontSettings.name.size}
                                                            onChange={(e) => setFontSettings(prev => ({ ...prev, name: { ...prev.name, size: Number(e.target.value) } }))}
                                                            className="flex-1 accent-indigo-500"
                                                        />
                                                    </div>
                                                    <div className="flex gap-4 items-center">
                                                        <span className="text-xs text-slate-500 w-8">敬称</span>
                                                        <input
                                                            type="range" min="16" max="120" value={fontSettings.honorific.size}
                                                            onChange={(e) => setFontSettings(prev => ({ ...prev, honorific: { ...prev.honorific, size: Number(e.target.value) } }))}
                                                            className="flex-1 accent-indigo-500"
                                                        />
                                                    </div>
                                                    {/* 位置調整 */}
                                                    <div className="pt-2 border-t border-slate-700/50">
                                                        <div className="flex gap-4 mb-2">
                                                            <div className="flex-1">
                                                                <label className="text-[10px] text-slate-500 block mb-1">横位置 (mm)</label>
                                                                <input
                                                                    type="number" value={fontSettings.name.x}
                                                                    onChange={(e) => setFontSettings(prev => ({ ...prev, name: { ...prev.name, x: Number(e.target.value) } }))}
                                                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="text-[10px] text-slate-500 block mb-1">縦位置 (mm)</label>
                                                                <input
                                                                    type="number" value={fontSettings.name.y}
                                                                    onChange={(e) => setFontSettings(prev => ({ ...prev, name: { ...prev.name, y: Number(e.target.value) } }))}
                                                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 住所 */}
                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <label className="text-sm text-slate-400">住所</label>
                                                    <span className="text-xs text-slate-500">{fontSettings.address.size}px</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <select
                                                        value={fontSettings.address.family}
                                                        onChange={(e) => setFontSettings(prev => ({ ...prev, address: { ...prev.address, family: e.target.value } }))}
                                                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-sm"
                                                    >
                                                        {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                    <input
                                                        type="range" min="16" max="40" value={fontSettings.address.size}
                                                        onChange={(e) => setFontSettings(prev => ({ ...prev, address: { ...prev.address, size: Number(e.target.value) } }))}
                                                        className="w-full accent-indigo-500"
                                                    />
                                                    {/* 位置調整 */}
                                                    <div className="flex gap-4 pt-1">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] text-slate-500 block mb-1">横位置</label>
                                                            <input
                                                                type="number" value={fontSettings.address.x}
                                                                onChange={(e) => setFontSettings(prev => ({ ...prev, address: { ...prev.address, x: Number(e.target.value) } }))}
                                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="text-[10px] text-slate-500 block mb-1">縦位置</label>
                                                            <input
                                                                type="number" value={fontSettings.address.y}
                                                                onChange={(e) => setFontSettings(prev => ({ ...prev, address: { ...prev.address, y: Number(e.target.value) } }))}
                                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 郵便番号 */}
                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <label className="text-sm text-slate-400">郵便番号</label>
                                                    <span className="text-xs text-slate-500">{fontSettings.zipCode.size}px</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <select
                                                        value={fontSettings.zipCode.family}
                                                        onChange={(e) => setFontSettings(prev => ({ ...prev, zipCode: { ...prev.zipCode, family: e.target.value } }))}
                                                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-sm"
                                                    >
                                                        {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                    </select>
                                                    <input
                                                        type="range" min="16" max="40" value={fontSettings.zipCode.size}
                                                        onChange={(e) => setFontSettings(prev => ({ ...prev, zipCode: { ...prev.zipCode, size: Number(e.target.value) } }))}
                                                        className="w-full accent-indigo-500"
                                                    />
                                                    {/* 文字間隔 */}
                                                    <div className="pt-1">
                                                        <div className="flex justify-between mb-1">
                                                            <label className="text-[10px] text-slate-500">文字間隔 (mm)</label>
                                                            <span className="text-[10px] text-slate-500">{fontSettings.zipCode.spacing}mm</span>
                                                        </div>
                                                        <input
                                                            type="range" min="0" max="15" step="0.1" value={fontSettings.zipCode.spacing}
                                                            onChange={(e) => setFontSettings(prev => ({ ...prev, zipCode: { ...prev.zipCode, spacing: Number(e.target.value) } }))}
                                                            className="w-full accent-indigo-500 h-1"
                                                        />
                                                    </div>
                                                    {/* 位置調整 */}
                                                    <div className="flex gap-4 pt-1">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] text-slate-500 block mb-1">横位置</label>
                                                            <input
                                                                type="number" value={fontSettings.zipCode.x}
                                                                onChange={(e) => setFontSettings(prev => ({ ...prev, zipCode: { ...prev.zipCode, x: Number(e.target.value) } }))}
                                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="text-[10px] text-slate-500 block mb-1">縦位置</label>
                                                            <input
                                                                type="number" value={fontSettings.zipCode.y}
                                                                onChange={(e) => setFontSettings(prev => ({ ...prev, zipCode: { ...prev.zipCode, y: Number(e.target.value) } }))}
                                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 位置調整コントロール */}
                                    <div className="glass p-6">
                                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <Layout size={20} />
                                            位置調整 (mm)
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-2">横位置 (X)</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="-20"
                                                        max="20"
                                                        value={printOffset.x}
                                                        onChange={(e) => setPrintOffset(prev => ({ ...prev, x: Number(e.target.value) }))}
                                                        className="w-full accent-indigo-500"
                                                    />
                                                    <span className="font-mono w-8 text-right text-sm">{printOffset.x}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-2">縦位置 (Y)</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="-20"
                                                        max="20"
                                                        value={printOffset.y}
                                                        onChange={(e) => setPrintOffset(prev => ({ ...prev, y: Number(e.target.value) }))}
                                                        className="w-full accent-indigo-500"
                                                    />
                                                    <span className="font-mono w-8 text-right text-sm">{printOffset.y}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 右カラム：プレビュー */}
                                <div className="flex-1 flex flex-col items-center sticky lg:top-8 order-1 lg:order-2 overflow-auto w-full">
                                    {/* Toolbar (Target Selection & Undo/Reset) */}
                                    <div className="flex justify-between items-center gap-2 mb-4 w-[120mm]">
                                        <button
                                            onClick={() => setIsSelectionModalOpen(true)}
                                            className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded transition-colors text-slate-300 border border-slate-700"
                                        >
                                            <ListFilter size={16} />
                                            対象選択 ({selectedIndices.size})
                                        </button>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleUndo}
                                                disabled={history.length === 0}
                                                className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 px-3 py-2 rounded transition-colors text-slate-300"
                                                title="元に戻す"
                                            >
                                                <Undo2 size={14} />
                                                元に戻す
                                            </button>
                                            <button
                                                onClick={handleReset}
                                                className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded transition-colors text-slate-300"
                                                title="初期状態に戻す"
                                            >
                                                <RotateCcw size={14} />
                                                リセット
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-4">
                                        <div style={{
                                            transform: `translate(${printOffset.x}mm, ${printOffset.y}mm)`,
                                            transition: 'transform 0.2s',
                                            transformOrigin: 'top center'
                                        }}>
                                            {currentPersonData && (
                                                <EnvelopePreview
                                                    data={currentPersonData}
                                                    fontSettings={fontSettings}
                                                    onPositionChange={handlePositionChange}
                                                    activeField={activeField}
                                                    onSelectField={setActiveField}
                                                    onFontChange={handleFontChange}
                                                    fontOptions={fontOptions}
                                                />
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full cursor-pointer hover:bg-slate-700 transition-colors" onClick={() => toggleSelection(currentIndex)}>
                                            {selectedIndices.has(currentIndex) ? <CheckSquare className="text-emerald-400" size={20} /> : <Square className="text-slate-500" size={20} />}
                                            <span className={selectedIndices.has(currentIndex) ? "text-white" : "text-slate-500"}>この宛先を印刷する</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 印刷対象選択モーダル */}
            {isSelectionModalOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={() => setIsSelectionModalOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <ListFilter className="text-indigo-400" />
                                <h3 className="text-xl font-bold">印刷対象を選択</h3>
                                <span className="text-sm bg-slate-800 px-2 py-1 rounded text-slate-300">
                                    {selectedIndices.size} / {data.length} 件選択中
                                </span>
                            </div>
                            <button
                                onClick={() => setIsSelectionModalOpen(false)}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex justify-end p-2 border-b border-slate-700/50 bg-slate-900">
                            <button
                                onClick={toggleAll}
                                className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded transition-colors flex items-center gap-2"
                            >
                                {selectedIndices.size === data.length ? <CheckSquare size={16} /> : <Square size={16} />}
                                {selectedIndices.size === data.length ? '全選択解除' : '全て選択'}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            {data.map((item, i) => (
                                <div
                                    key={i}
                                    onClick={() => toggleSelection(i)}
                                    className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors border ${selectedIndices.has(i) ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-800/30 border-transparent hover:bg-slate-800'}`}
                                >
                                    <div className={`text-indigo-400 transition-transform ${selectedIndices.has(i) ? 'scale-110' : 'scale-100'}`}>
                                        {selectedIndices.has(i) ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-lg">{item[mapping.name] || '氏名なし'}</div>
                                        <div className="text-sm text-slate-400 flex gap-4">
                                            <span>〒{item[mapping.zipCode]}</span>
                                            <span className="truncate max-w-[300px]">{item[mapping.address1]}</span>
                                        </div>
                                    </div>
                                    {i === currentIndex && (
                                        <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded">プレビュー中</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end">
                            <button
                                onClick={() => setIsSelectionModalOpen(false)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all"
                            >
                                完了
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* 印刷専用レイアウト */}
            <div className="print-only">
                {data.map((item, index) => {
                    if (!selectedIndices.has(index)) return null;

                    const person = {
                        zipCode: item[mapping.zipCode] || '',
                        address1: (item[mapping.address1] || '').toString().replace(/[-－]/g, 'ー'),
                        address2: (item[mapping.address2] || '').toString().replace(/[-－]/g, 'ー'),
                        name: item[mapping.name] || '',
                        honorific: mapping.honorific,
                    };
                    return (
                        <div key={index} className="envelope-page text-slate-900" style={{ fontFamily: '"Noto Serif JP", serif' }}>
                            <div className="relative w-full h-full" style={{ transform: `translate(${printOffset.x}mm, ${printOffset.y}mm)` }}>
                                {/* 郵便番号 */}
                                <div className="absolute top-[12mm] left-[46mm] flex justify-end font-bold"
                                    style={{
                                        fontFamily: fontSettings.zipCode.family,
                                        fontSize: `${fontSettings.zipCode.size}px`,
                                        transform: `translate(${fontSettings.zipCode.x}mm, ${fontSettings.zipCode.y}mm)`,
                                        gap: `${fontSettings.zipCode.spacing}mm`,
                                        width: '65mm'
                                    }}
                                >
                                    {person.zipCode.replace(/[^0-9]/g, '').split('').map((char: string, i: number) => (
                                        <span key={i} className="inline-block w-[4mm] text-center">{char}</span>
                                    ))}
                                </div>

                                {/* 住所1 */}
                                <div
                                    className="absolute top-[28mm] right-[16mm] text-2xl font-medium tracking-widest"
                                    style={{
                                        writingMode: 'vertical-rl',
                                        textOrientation: 'upright',
                                        maxHeight: '16cm',
                                        lineHeight: '1.8',
                                        fontFamily: fontSettings.address.family,
                                        fontSize: `${fontSettings.address.size}px`,
                                        transform: `translate(${fontSettings.address.x}mm, ${fontSettings.address.y}mm)`
                                    }}
                                >
                                    {person.address1}
                                </div>

                                {/* 住所2 */}
                                <div
                                    className="absolute top-[45mm] right-[28mm] text-xl tracking-widest"
                                    style={{
                                        writingMode: 'vertical-rl',
                                        textOrientation: 'upright',
                                        maxHeight: '14cm',
                                        lineHeight: '1.8',
                                        fontFamily: fontSettings.address.family,
                                        fontSize: `${fontSettings.address.size}px`,
                                        transform: `translate(${fontSettings.address.x}mm, ${fontSettings.address.y}mm)`
                                    }}
                                >
                                    {person.address2}
                                </div>

                                {/* 氏名 */}
                                <div
                                    className="absolute top-[52%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-4xl font-bold flex items-center gap-6"
                                    style={{
                                        writingMode: 'vertical-rl',
                                        textOrientation: 'upright',
                                        letterSpacing: '0.25em',
                                        fontFamily: fontSettings.name.family,
                                        fontSize: `${fontSettings.name.size}px`,
                                        transform: `translate(-50%, -50%) translate(${fontSettings.name.x}mm, ${fontSettings.name.y}mm)`,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <span className="inline-block">{person.name}</span>
                                    <span className="font-medium mt-4" style={{ fontFamily: fontSettings.name.family, fontSize: `${fontSettings.honorific.size}px` }}>{person.honorific}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};
