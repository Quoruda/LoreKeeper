import { Book, Users, ScrollText, BarChart2, Settings, ChevronRight, FileText, Check, X } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewMode } from '../../types';

const navigationKeys: { key: string; icon: any; mode: ViewMode | 'statistics' }[] = [
    { key: 'sidebar.nav.chapters', icon: Book, mode: 'chapters' },
    { key: 'sidebar.nav.characters', icon: Users, mode: 'characters' },
    { key: 'sidebar.nav.lore', icon: ScrollText, mode: 'lore' },
    { key: 'sidebar.nav.statistics', icon: BarChart2, mode: 'statistics' },
];

export default function Sidebar({ projectPath }: { projectPath: string }) {
    const { t } = useTranslation();
    const {
        chapters, characters, lore,
        currentChapter, setCurrentChapter,
        currentComponentId, setCurrentComponentId,
        viewMode, setViewMode,
        refreshFiles
    } = useProject();
    const [isCreatingChapter, setIsCreatingChapter] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState("");

    // Extraire juste le nom final du dossier pour le titre
    const projectName = projectPath.split(/[/\\]/).pop() || t('sidebar.newProjectText');

    const handleCreateSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const title = newChapterTitle.trim();
        if (!title) {
            setIsCreatingChapter(false);
            return;
        }

        let fileName = `${title.replace(/[/\\?%*:|"<>]/g, '-')}`;
        let folder = 'chapters';
        let content = '';

        if (viewMode === 'chapters') {
            fileName += '.md';
            content = `# ${title}\n\n`;
        } else if (viewMode === 'characters') {
            fileName += '.json';
            folder = 'characters';
            content = JSON.stringify({ id: fileName.replace('.json', ''), name: title, role: "", description: "", appearance: "", personality: "" }, null, 2);
        } else if (viewMode === 'lore') {
            fileName += '.json';
            folder = 'lore';
            content = JSON.stringify({ id: fileName.replace('.json', ''), title: title, category: "", content: "" }, null, 2);
        }

        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('write_file', {
                path: `${projectPath}/${folder}/${fileName}`,
                content
            });
            await refreshFiles();

            if (viewMode === 'chapters') {
                setCurrentChapter(fileName);
            } else {
                setCurrentComponentId(fileName);
            }

            // Re-intialiser
            setNewChapterTitle("");
            setIsCreatingChapter(false);
        } catch (error) {
            console.error("Erreur lors de la création du chapitre:", error);
            alert(t('sidebar.errCreate') + " " + error);
        }
    };

    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full shrink-0">
            {/* Header Logo & Project Name */}
            <div className="h-16 flex flex-col justify-center px-6 border-b border-gray-800 shrink-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-indigo-500 bg-clip-text text-transparent leading-tight">
                    {t('sidebar.appName')}
                </h1>
                <p className="text-xs text-gray-400 truncate mt-0.5" title={projectPath}>
                    {projectName}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navigationKeys.map((item) => {
                    const Icon = item.icon;
                    return (
                        <a
                            key={item.key}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (item.mode !== 'statistics') setViewMode(item.mode);
                            }}
                            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${viewMode === item.mode
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                        >
                            <Icon className="w-5 h-5 mr-3 shrink-0" />
                            {t(item.key)}
                            {viewMode === item.mode && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                        </a>
                    );
                })}

                {/* Dynamic sub-items list */}
                <div className="mt-4 pt-4 border-t border-gray-800/50">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {viewMode === 'chapters' && t('sidebar.currentBook')}
                        {viewMode === 'characters' && t('sidebar.nav.characters')}
                        {viewMode === 'lore' && t('sidebar.nav.lore')}
                    </p>
                    <div className="space-y-1">
                        {/* Chapters */}
                        {viewMode === 'chapters' && chapters.map((file) => (
                            <button
                                key={file}
                                onClick={() => setCurrentChapter(file)}
                                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg group transition-colors ${currentChapter === file
                                    ? 'text-white bg-primary-500/20'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                                    }`}
                            >
                                <FileText className={`w-4 h-4 mr-3 shrink-0 ${currentChapter === file ? 'text-primary-400' : 'text-gray-500 group-hover:text-primary-400'
                                    }`} />
                                <span className="truncate">{file.replace('.md', '')}</span>
                            </button>
                        ))}

                        {/* Characters */}
                        {viewMode === 'characters' && characters.map((file) => (
                            <button
                                key={file}
                                onClick={() => setCurrentComponentId(file)}
                                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg group transition-colors ${currentComponentId === file
                                    ? 'text-white bg-indigo-500/20'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                                    }`}
                            >
                                <Users className={`w-4 h-4 mr-3 shrink-0 ${currentComponentId === file ? 'text-indigo-400' : 'text-gray-500 group-hover:text-indigo-400'
                                    }`} />
                                <span className="truncate">{file.replace('.json', '')}</span>
                            </button>
                        ))}

                        {/* Lore */}
                        {viewMode === 'lore' && lore.map((file) => (
                            <button
                                key={file}
                                onClick={() => setCurrentComponentId(file)}
                                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg group transition-colors ${currentComponentId === file
                                    ? 'text-white bg-indigo-500/20'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                                    }`}
                            >
                                <ScrollText className={`w-4 h-4 mr-3 shrink-0 ${currentComponentId === file ? 'text-indigo-400' : 'text-gray-500 group-hover:text-indigo-400'
                                    }`} />
                                <span className="truncate">{file.replace('.json', '')}</span>
                            </button>
                        ))}

                        {isCreatingChapter ? (
                            <form onSubmit={handleCreateSubmit} className={`px-3 py-2 flex items-center space-x-2 bg-gray-800/50 rounded-lg border ${viewMode === 'chapters' ? 'border-primary-500/50' : 'border-indigo-500/50'}`}>
                                {viewMode === 'chapters' ? <FileText className="w-4 h-4 text-primary-400 shrink-0" /> : <Users className="w-4 h-4 text-indigo-400 shrink-0" />}
                                <input
                                    autoFocus
                                    type="text"
                                    value={newChapterTitle}
                                    onChange={(e) => setNewChapterTitle(e.target.value)}
                                    placeholder={
                                        viewMode === 'chapters' ? t('sidebar.chapterNamePlaceholder') :
                                            viewMode === 'characters' ? t('sidebar.charNamePlaceholder') :
                                                t('sidebar.loreNamePlaceholder')
                                    }
                                    className="flex-1 bg-transparent text-sm text-white outline-none min-w-0"
                                    onBlur={() => {
                                        if (!newChapterTitle.trim()) setIsCreatingChapter(false);
                                    }}
                                />
                                <button type="submit" className={`${viewMode === 'chapters' ? 'text-primary-400 hover:text-primary-300' : 'text-indigo-400 hover:text-indigo-300'} transition-colors`}>
                                    <Check className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => setIsCreatingChapter(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreatingChapter(true)}
                                className="w-full flex items-center px-3 py-2 text-sm text-gray-500 hover:text-white hover:bg-gray-800/30 rounded-lg italic group"
                            >
                                <span className="w-4 h-4 mr-3 shrink-0 text-center font-bold text-lg leading-none">+</span>
                                {
                                    viewMode === 'chapters' ? t('sidebar.newChapter') :
                                        viewMode === 'characters' ? t('sidebar.newCharacter') :
                                            t('sidebar.newLore')
                                }
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Settings Footer */}
            <div className="p-4 border-t border-gray-800 shrink-0">
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-lg hover:text-white hover:bg-gray-800/50 transition-colors">
                    <Settings className="w-5 h-5 mr-3 shrink-0" />
                    {t('sidebar.settings')}
                </a>
            </div>
        </div>
    );
}
