import { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProject } from '../../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';
import { ScrollText, MapPin } from 'lucide-react';
import type { LoreEntry } from '../../types';

export default function LoreEditor() {
    const { t } = useTranslation();
    const { projectPath, currentComponentId } = useProject();
    const [lore, setLore] = useState<LoreEntry | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial load
    useEffect(() => {
        if (projectPath && currentComponentId) {
            const loadLore = async () => {
                try {
                    const fileContent: string = await invoke('read_file', {
                        path: `${projectPath}/lore/${currentComponentId}`
                    });
                    setLore(JSON.parse(fileContent));
                } catch (error) {
                    console.error("Erreur de lecture du lore:", error);
                    setLore(null);
                }
            };
            loadLore();
        } else {
            setLore(null);
        }
    }, [projectPath, currentComponentId]);

    // Auto-save logic
    const handleChange = (field: keyof LoreEntry, value: string) => {
        if (!lore) return;

        const updatedLore = { ...lore, [field]: value };
        setLore(updatedLore);
        setIsSaving(true);

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            if (projectPath && currentComponentId) {
                try {
                    await invoke('write_file', {
                        path: `${projectPath}/lore/${currentComponentId}`,
                        content: JSON.stringify(updatedLore, null, 2)
                    });
                } catch (error) {
                    console.error("Erreur de sauvegarde:", error);
                } finally {
                    setIsSaving(false);
                }
            }
        }, 1000);
    };

    if (!currentComponentId || !lore) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#0d1117] items-center justify-center">
                <ScrollText className="w-16 h-16 mx-auto mb-4 text-emerald-500/20" />
                <p className="text-gray-500">{t('loreEditor.noSelection')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-y-auto">
            {/* Topbar */}
            <div className="h-16 border-b border-gray-800 flex items-center px-8 shrink-0 justify-between sticky top-0 bg-[#0d1117]/90 backdrop-blur z-10">
                <div className="flex items-center text-emerald-400">
                    <ScrollText className="w-5 h-5 mr-3" />
                    <span className="font-medium">{t('loreEditor.title')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{isSaving ? t('editor.saving') : t('editor.saved')}</span>
                    <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-green-500 opacity-50'}`}></div>
                </div>
            </div>

            {/* Form Area */}
            <div className="p-8 lg:p-12 pb-32 max-w-4xl mx-auto w-full space-y-8">

                {/* Header / Title & Category */}
                <div className="flex gap-6">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('loreEditor.nameLabel')}</label>
                        <input
                            type="text"
                            value={lore.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder={t('loreEditor.namePlaceholder')}
                            className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xl font-bold text-white outline-none transition-colors"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('loreEditor.categoryLabel')}</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                                type="text"
                                value={lore.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                placeholder={t('loreEditor.categoryPlaceholder')}
                                className="w-full bg-gray-900 border border-gray-800 focus:border-emerald-500 rounded-xl pl-12 pr-4 py-3 text-lg text-emerald-100 outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Content Textarea */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('loreEditor.descLabel')}</label>
                        <textarea
                            value={lore.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                            placeholder={t('loreEditor.descPlaceholder')}
                            className="w-full min-h-[400px] h-auto bg-gray-900 border border-gray-800 focus:border-emerald-500 rounded-xl p-6 text-base text-gray-300 outline-none transition-colors resize-y leading-loose font-serif"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
