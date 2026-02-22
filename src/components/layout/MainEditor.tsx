import { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProject } from '../../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';

export default function MainEditor() {
    const { t } = useTranslation();
    const { projectPath, currentChapter } = useProject();
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Charger le contenu du chapitre quand il change
    useEffect(() => {
        if (projectPath && currentChapter) {
            const loadChapter = async () => {
                try {
                    const fileContent: string = await invoke('read_file', {
                        path: `${projectPath}/chapters/${currentChapter}`
                    });
                    setContent(fileContent);
                } catch (error) {
                    console.error("Erreur de lecture:", error);
                    setContent('');
                }
            };
            loadChapter();
        } else {
            setContent('');
        }
    }, [projectPath, currentChapter]);

    // Sauvegarde automatique (Debounce de 1 seconde)
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);
        setIsSaving(true);

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            if (projectPath && currentChapter) {
                try {
                    await invoke('write_file', {
                        path: `${projectPath}/chapters/${currentChapter}`,
                        content: newContent
                    });
                } catch (error) {
                    console.error("Erreur de sauvegarde:", error);
                } finally {
                    setIsSaving(false);
                }
            }
        }, 1000); // Sauvegarde 1s après la dernière frappe
    };

    // Si aucun chapitre n'est sélectionné
    if (!currentChapter) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#0d1117] items-center justify-center">
                <p className="text-gray-500">{t('editor.noChapterDesc')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0d1117]">
            {/* Topbar for Editor */}
            <div className="h-16 border-b border-gray-800 flex items-center px-8 shrink-0 justify-between">
                <input
                    type="text"
                    value={currentChapter.replace('.md', '')}
                    readOnly
                    className="bg-transparent text-xl font-semibold text-gray-100 outline-none w-full"
                />
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{isSaving ? t('editor.saving') : t('editor.saved')}</span>
                    <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-green-500 opacity-50'}`}></div>
                </div>
            </div>

            {/* Editor Content Area */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 pb-32">
                <div className="max-w-3xl mx-auto h-full flex flex-col">
                    <textarea
                        className="w-full h-full bg-transparent text-gray-300 text-lg leading-relaxed resize-none outline-none font-serif"
                        placeholder={t('editor.placeholder')}
                        value={content}
                        onChange={handleChange}
                        spellCheck="false"
                    />
                </div>
            </div>
        </div>
    );
}
