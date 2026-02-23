import { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProject } from '../../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import type { Character } from '../../types';

export default function CharacterEditor() {
    const { t } = useTranslation();
    const { projectPath, currentComponentId } = useProject();
    const [character, setCharacter] = useState<Character | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Initial load
    useEffect(() => {
        if (projectPath && currentComponentId) {
            const loadCharacter = async () => {
                try {
                    const fileContent: string = await invoke('read_file', {
                        path: `${projectPath}/characters/${currentComponentId}`
                    });
                    setCharacter(JSON.parse(fileContent));
                } catch (error) {
                    console.error("Erreur de lecture du personnage:", error);
                    setCharacter(null);
                }
            };
            loadCharacter();
        } else {
            setCharacter(null);
        }
    }, [projectPath, currentComponentId]);

    // Auto-save logic
    const handleChange = (field: keyof Character, value: string) => {
        if (!character) return;

        const updatedCharacter = { ...character, [field]: value };
        setCharacter(updatedCharacter);
        setIsSaving(true);

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            if (projectPath && currentComponentId) {
                try {
                    await invoke('write_file', {
                        path: `${projectPath}/characters/${currentComponentId}`,
                        content: JSON.stringify(updatedCharacter, null, 2)
                    });
                } catch (error) {
                    console.error("Erreur de sauvegarde:", error);
                } finally {
                    setIsSaving(false);
                }
            }
        }, 1000);
    };

    if (!currentComponentId || !character) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#0d1117] items-center justify-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-indigo-500/20" />
                <p className="text-gray-500">{t('charEditor.noSelection')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-y-auto">
            {/* Topbar */}
            <div className="h-16 border-b border-gray-800 flex items-center px-8 shrink-0 justify-between sticky top-0 bg-[#0d1117]/90 backdrop-blur z-10">
                <div className="flex items-center text-indigo-400">
                    <Users className="w-5 h-5 mr-3" />
                    <span className="font-medium">{t('charEditor.title')}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{isSaving ? t('editor.saving') : t('editor.saved')}</span>
                    <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-green-500 opacity-50'}`}></div>
                </div>
            </div>

            {/* Form Area */}
            <div className="p-8 lg:p-12 pb-32 max-w-4xl mx-auto w-full space-y-8">

                {/* Header / Name & Role */}
                <div className="flex gap-6">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('charEditor.nameLabel')}</label>
                        <input
                            type="text"
                            value={character.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder={t('charEditor.namePlaceholder')}
                            className="w-full bg-gray-900 border border-gray-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-xl font-bold text-white outline-none transition-colors"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('charEditor.roleLabel')}</label>
                        <input
                            type="text"
                            value={character.role}
                            onChange={(e) => handleChange('role', e.target.value)}
                            placeholder={t('charEditor.rolePlaceholder')}
                            className="w-full bg-gray-900 border border-gray-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-lg text-indigo-100 outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Textareas */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('charEditor.descLabel')}</label>
                        <textarea
                            value={character.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder={t('charEditor.descPlaceholder')}
                            className="w-full h-32 bg-gray-900 border border-gray-800 focus:border-indigo-500 rounded-xl p-4 text-sm text-gray-300 outline-none transition-colors resize-y leading-relaxed"
                        />
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('charEditor.appearanceLabel')}</label>
                            <textarea
                                value={character.appearance}
                                onChange={(e) => handleChange('appearance', e.target.value)}
                                placeholder={t('charEditor.appearancePlaceholder')}
                                className="w-full h-48 bg-gray-900 border border-gray-800 focus:border-indigo-500 rounded-xl p-4 text-sm text-gray-300 outline-none transition-colors resize-none leading-relaxed"
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('charEditor.personalityLabel')}</label>
                            <textarea
                                value={character.personality}
                                onChange={(e) => handleChange('personality', e.target.value)}
                                placeholder={t('charEditor.personalityPlaceholder')}
                                className="w-full h-48 bg-gray-900 border border-gray-800 focus:border-indigo-500 rounded-xl p-4 text-sm text-gray-300 outline-none transition-colors resize-none leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
