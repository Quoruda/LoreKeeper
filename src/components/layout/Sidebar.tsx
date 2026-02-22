import { Book, Users, ScrollText, BarChart2, Settings, ChevronRight, FileText, Check, X } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { useState } from 'react';

const navigation = [
    { name: 'Chapitres', icon: Book, current: true },
    { name: 'Personnages', icon: Users, current: false },
    { name: 'Lore', icon: ScrollText, current: false },
    { name: 'Statistiques', icon: BarChart2, current: false },
];

export default function Sidebar({ projectPath }: { projectPath: string }) {
    const { chapters, currentChapter, setCurrentChapter, refreshChapters } = useProject();
    const [isCreatingChapter, setIsCreatingChapter] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState("");

    // Extraire juste le nom final du dossier pour le titre
    const projectName = projectPath.split(/[/\\]/).pop() || "Nouveau Projet";

    const handleCreateSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const title = newChapterTitle.trim();
        if (!title) {
            setIsCreatingChapter(false);
            return;
        }

        const fileName = `${title.replace(/[/\\?%*:|"<>]/g, '-')}.md`;
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('write_file', {
                path: `${projectPath}/chapters/${fileName}`,
                content: `# ${title}\n\n`
            });
            await refreshChapters();
            setCurrentChapter(fileName);
            // Re-intialiser
            setNewChapterTitle("");
            setIsCreatingChapter(false);
        } catch (error) {
            console.error("Erreur lors de la création du chapitre:", error);
            alert("Impossible de créer le fichier: " + error);
        }
    };

    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full shrink-0">
            {/* Header Logo & Project Name */}
            <div className="h-16 flex flex-col justify-center px-6 border-b border-gray-800 shrink-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-indigo-500 bg-clip-text text-transparent leading-tight">
                    LoreKeeper
                </h1>
                <p className="text-xs text-gray-400 truncate mt-0.5" title={projectPath}>
                    {projectName}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                        <a
                            key={item.name}
                            href="#"
                            className={`flex items - center px - 3 py - 2.5 text - sm font - medium rounded - lg transition - colors ${item.current
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                } `}
                        >
                            <Icon className="w-5 h-5 mr-3 shrink-0" />
                            {item.name}
                            {item.current && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                        </a>
                    );
                })}

                {/* Dynamic sub-items for Chapters */}
                <div className="mt-4 pt-4 border-t border-gray-800/50">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Livre Actuel
                    </p>
                    <div className="space-y-1">
                        {chapters.map((chapterFile) => (
                            <button
                                key={chapterFile}
                                onClick={() => setCurrentChapter(chapterFile)}
                                className={`w - full flex items - center px - 3 py - 2 text - sm rounded - lg group transition - colors ${currentChapter === chapterFile
                                    ? 'text-white bg-primary-500/20'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-800/30'
                                    } `}
                            >
                                <FileText className={`w - 4 h - 4 mr - 3 shrink - 0 ${currentChapter === chapterFile ? 'text-primary-400' : 'text-gray-500 group-hover:text-primary-400'
                                    } `} />
                                <span className="truncate">{chapterFile.replace('.md', '')}</span>
                            </button>
                        ))}

                        {isCreatingChapter ? (
                            <form onSubmit={handleCreateSubmit} className="px-3 py-2 flex items-center space-x-2 bg-gray-800/50 rounded-lg border border-primary-500/50">
                                <FileText className="w-4 h-4 text-primary-400 shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    value={newChapterTitle}
                                    onChange={(e) => setNewChapterTitle(e.target.value)}
                                    placeholder="Nom du chapitre..."
                                    className="flex-1 bg-transparent text-sm text-white outline-none min-w-0"
                                    onBlur={() => {
                                        if (!newChapterTitle.trim()) setIsCreatingChapter(false);
                                    }}
                                />
                                <button type="submit" className="text-primary-400 hover:text-primary-300 transition-colors">
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
                                Nouveau chapitre
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Settings Footer */}
            <div className="p-4 border-t border-gray-800 shrink-0">
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-lg hover:text-white hover:bg-gray-800/50 transition-colors">
                    <Settings className="w-5 h-5 mr-3 shrink-0" />
                    Paramètres
                </a>
            </div>
        </div>
    );
}
