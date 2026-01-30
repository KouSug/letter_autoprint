import React from 'react';
import { MapPin, User, Hash } from 'lucide-react';

interface FieldMapping {
    zipCode: string;
    address1: string;
    address2: string;
    name: string;
    honorific: string;
}

interface FieldMapperProps {
    columns: string[];
    mapping: FieldMapping;
    onMappingChange: (mapping: FieldMapping) => void;
    onComplete: () => void;
    onBack: () => void;
}

export const FieldMapper: React.FC<FieldMapperProps> = ({ columns, mapping, onMappingChange, onComplete, onBack }) => {
    const fields = [
        { id: 'zipCode', label: '郵便番号', icon: <Hash size={18} />, placeholder: '例: 123-4567' },
        { id: 'address1', label: '住所1', icon: <MapPin size={18} />, placeholder: '例: 東京都港区xxx' },
        { id: 'address2', label: '住所2', icon: <MapPin size={18} />, placeholder: '例: マンション名など' },
        { id: 'name', label: '氏名', icon: <User size={18} />, placeholder: '例: 田中 太郎' },
    ];

    const handleSelectChange = (fieldId: keyof FieldMapping, value: string) => {
        onMappingChange({ ...mapping, [fieldId]: value });
    };

    return (
        <div className="mt-8 relative flex flex-col items-center w-full">
            <div className="flex flex-col gap-4 w-full max-w-2xl">
                {fields.map((field) => (
                    <div key={field.id} className="glass p-6 flex flex-col gap-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                            {field.icon}
                            {field.label}
                        </label>
                        <select
                            value={mapping[field.id as keyof FieldMapping]}
                            onChange={(e) => handleSelectChange(field.id as keyof FieldMapping, e.target.value)}
                            className="bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">選択してください</option>
                            {columns.map((col) => (
                                <option key={col} value={col}>
                                    {col}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
                <div className="glass p-6 flex flex-col gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <User size={18} />
                        敬称
                    </label>
                    <select
                        value={mapping.honorific}
                        onChange={(e) => handleSelectChange('honorific', e.target.value)}
                        className="bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="様">様</option>
                        <option value="御中">御中</option>
                        <option value="先生">先生</option>
                        <option value="殿">殿</option>
                    </select>
                </div>
            </div>

            <div className="mt-8 flex justify-between items-center bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm border border-slate-700/50">
                <button
                    onClick={onBack}
                    className="px-6 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors font-medium"
                >
                    戻る
                </button>
                <button
                    onClick={onComplete}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                >
                    プレビューを確認する
                </button>
            </div>
        </div>
    );
};
