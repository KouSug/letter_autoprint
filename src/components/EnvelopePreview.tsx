import React from 'react';

interface PreviewData {
    zipCode: string;
    address1: string;
    address2: string;
    name: string;
    honorific: string;
}

interface FontSettings {
    zipCode: { family: string; size: number; x: number; y: number; spacing: number };
    address: { family: string; size: number; x: number; y: number };
    name: { family: string; size: number; x: number; y: number };
    honorific: { size: number };
}

import { X } from 'lucide-react';

interface EnvelopePreviewProps {
    data: PreviewData;
    fontSettings: FontSettings;
    onPositionChange: (key: 'zipCode' | 'address' | 'name', deltaX: number, deltaY: number) => void;
    activeField: 'zipCode' | 'address' | 'name' | null;
    onSelectField: (field: 'zipCode' | 'address' | 'name' | null) => void;
    onFontChange: (key: 'zipCode' | 'address' | 'name' | 'honorific', setting: string | number, type: 'family' | 'size' | 'spacing') => void;
    fontOptions: { label: string; value: string }[];
}

export const EnvelopePreview: React.FC<EnvelopePreviewProps> = ({
    data,
    fontSettings,
    onPositionChange,
    activeField,
    onSelectField,
    onFontChange,
    fontOptions
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = React.useState<'zipCode' | 'address' | 'name' | null>(null);
    const dragStartRef = React.useRef<{ x: number; y: number } | null>(null);

    const handlePointerDown = (e: React.PointerEvent, key: 'zipCode' | 'address' | 'name') => {
        e.preventDefault();
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(key);
        onSelectField(key); // Activate the field
        dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragging || !dragStartRef.current || !containerRef.current) return;
        e.preventDefault();

        const deltaXPixels = e.clientX - dragStartRef.current.x;
        const deltaYPixels = e.clientY - dragStartRef.current.y;

        // ピクセルからmmへの変換 (コンテナの実際の幅から計算)
        // コンテナは幅120mmでレンダリングされている
        const containerWidthPixels = containerRef.current.offsetWidth;
        // 左右のpadding (10mm * 2) を引いた幅ではなく、全体の幅で計算する
        // width: 120mm
        const mmPerPixel = 120 / containerWidthPixels;

        const deltaX = Number((deltaXPixels * mmPerPixel).toFixed(1));
        const deltaY = Number((deltaYPixels * mmPerPixel).toFixed(1));

        if (deltaX !== 0 || deltaY !== 0) {
            onPositionChange(dragging, deltaX, deltaY);
            // 差分適用後に基準点を更新
            dragStartRef.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (dragging) {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            setDragging(null);
            dragStartRef.current = null;
        }
    };

    const getCursorStyle = (key: 'zipCode' | 'address' | 'name') => {
        return dragging === key ? 'cursor-grabbing' : 'cursor-move';
    };

    const getOutlineClass = (key: 'zipCode' | 'address' | 'name') => {
        const isActive = activeField === key;
        return isActive
            ? 'outline outline-2 outline-indigo-500 rounded p-1 bg-indigo-500/5 transition-all'
            : 'hover:outline hover:outline-2 hover:outline-indigo-500/50 rounded p-1 transition-outline';
    };
    return (
        <div
            className="flex justify-center p-8 bg-slate-900 rounded-xl overflow-auto border border-slate-700 shadow-2xl relative"
            onClick={() => onSelectField(null)} // Deselect on background click
        >
            <div
                ref={containerRef}
                className="bg-orange-50 text-slate-900 shadow-xl relative flex flex-col items-center"
                style={{
                    width: '120mm',
                    height: '235mm',
                    padding: '10mm',
                    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                    fontFamily: '"Noto Serif JP", serif'
                }}
            >
                {/* 郵便番号 - JIS規格: 左端から約47mm、上端から約12mm */}
                {/* 文字間隔は約7mmピッチに合わせて調整 */}
                <div
                    onPointerDown={(e) => handlePointerDown(e, 'zipCode')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-[12mm] left-[46mm] flex justify-end font-bold ${getOutlineClass('zipCode')}`}
                    style={{
                        fontFamily: fontSettings.zipCode.family,
                        fontSize: `${fontSettings.zipCode.size}px`,
                        transform: `translate(${fontSettings.zipCode.x}mm, ${fontSettings.zipCode.y}mm)`,
                        cursor: getCursorStyle('zipCode'),
                        gap: `${fontSettings.zipCode.spacing}mm`,
                        width: '65mm' // 郵便番号枠の目安範囲
                    }}
                >
                    {data.zipCode.replace(/[^0-9]/g, '').split('').map((char, i) => (
                        <span key={i} className="inline-block w-[4mm] text-center">{char}</span>
                    ))}
                </div>

                {/* 住所1 (縦書き) - 右端から約15-20mm、上端から約25-30mm */}
                <div
                    onPointerDown={(e) => handlePointerDown(e, 'address')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-[28mm] right-[16mm] text-2xl font-medium tracking-widest ${getOutlineClass('address')}`}
                    style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'upright',
                        maxHeight: '16cm',
                        lineHeight: '1.8',
                        fontFamily: fontSettings.address.family,
                        fontSize: `${fontSettings.address.size}px`,
                        transform: `translate(${fontSettings.address.x}mm, ${fontSettings.address.y}mm)`,
                        cursor: getCursorStyle('address')
                    }}
                >
                    {data.address1}
                </div>

                {/* 住所2 (縦書き) - 住所1の左側、少し下げて配置 */}
                <div
                    onPointerDown={(e) => handlePointerDown(e, 'address')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-[45mm] right-[28mm] text-xl tracking-widest ${getOutlineClass('address')}`}
                    style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'upright',
                        maxHeight: '14cm',
                        lineHeight: '1.8',
                        fontFamily: fontSettings.address.family,
                        fontSize: `${fontSettings.address.size * 0.8}px`,
                        transform: `translate(${fontSettings.address.x}mm, ${fontSettings.address.y}mm)`,
                        cursor: getCursorStyle('address')
                    }}
                >
                    {data.address2}
                </div>

                {/* 氏名 (縦書き) - 中央配置 */}
                <div
                    onPointerDown={(e) => handlePointerDown(e, 'name')}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-4xl font-bold flex items-center gap-6 ${getOutlineClass('name')}`}
                    style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'upright',
                        letterSpacing: '0.25em',
                        fontFamily: fontSettings.name.family,
                        fontSize: `${fontSettings.name.size}px`,
                        transform: `translate(-50%, -50%) translate(${fontSettings.name.x}mm, ${fontSettings.name.y}mm)`,
                        whiteSpace: 'nowrap',
                        cursor: getCursorStyle('name')
                    }}
                >
                    <span className="inline-block">{data.name}</span>
                    <span className="font-medium mt-4" style={{ fontFamily: fontSettings.name.family, fontSize: `${fontSettings.honorific.size}px` }}>{data.honorific}</span>
                </div>
            </div>

            {/* Context Menu Panel */}
            {activeField && (
                <div
                    className="absolute bg-slate-800/95 backdrop-blur border border-slate-600 rounded-lg shadow-xl p-3 flex flex-col gap-2 z-10 w-64"
                    style={{
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-1">
                        <span className="text-xs font-bold text-slate-300">
                            {activeField === 'zipCode' ? '郵便番号' : activeField === 'address' ? '住所' : '宛名'}のフォント
                        </span>
                        <button onClick={() => onSelectField(null)} className="text-slate-400 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>

                    <select
                        value={fontSettings[activeField].family}
                        onChange={(e) => onFontChange(activeField, e.target.value, 'family')}
                        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                    >
                        {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-6">サイズ</span>
                        <input
                            type="range"
                            min="16" max="120"
                            value={fontSettings[activeField].size}
                            onChange={(e) => onFontChange(activeField, e.target.value, 'size')}
                            className="flex-1 accent-indigo-500 h-1"
                        />
                        <span className="text-[10px] w-6 text-right">{fontSettings[activeField].size}px</span>
                    </div>

                    {activeField === 'zipCode' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                            <span className="text-[10px] text-slate-500 w-6">間隔</span>
                            <input
                                type="range"
                                min="0" max="15" step="0.1"
                                value={fontSettings.zipCode.spacing}
                                onChange={(e) => onFontChange('zipCode', e.target.value, 'spacing')} // Pass 'spacing' type
                                className="flex-1 accent-indigo-500 h-1"
                            />
                            <span className="text-[10px] w-6 text-right">{fontSettings.zipCode.spacing}mm</span>
                        </div>
                    )}

                    {activeField === 'name' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
                            <span className="text-[10px] text-slate-500 w-6">敬称</span>
                            <input
                                type="range"
                                min="16" max="120"
                                value={fontSettings.honorific.size}
                                onChange={(e) => onFontChange('honorific', e.target.value, 'size')}
                                className="flex-1 accent-indigo-500 h-1"
                            />
                            <span className="text-[10px] w-6 text-right">{fontSettings.honorific.size}px</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
