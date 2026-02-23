import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProject } from '../../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';
import { HybridMarkdownEditor } from 'hybrid-markdown-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MainEditor() {
    const { t } = useTranslation();
    const { projectPath, currentChapter, chapters, renameItem } = useProject();
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    // Composant de rendu personnalisé pour HybridMarkdownEditor
    // Permet d'injecter tous les composants complexes de ReactMarkdown (Gras, liens, code...) 
    // à l'intérieur du conteneur de type (h1, p, blockquote) déjà géré par l'éditeur hybride.
    const renderMarkdownLine = ({ line, isActive, defaultContent }: any) => {
        if (isActive) return defaultContent;
        if (line.trim() === '') return <>{'\u00A0'}</>;

        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // On unwrap les blocs primaires car HybridMarkdownEditor s'en charge déjà (il wrappe dans hmd-h1, hmd-p, etc.)
                    p: ({ children }) => <>{children}</>,
                    h1: ({ children }) => <>{children}</>,
                    h2: ({ children }) => <>{children}</>,
                    h3: ({ children }) => <>{children}</>,
                    h4: ({ children }) => <>{children}</>,
                    h5: ({ children }) => <>{children}</>,
                    h6: ({ children }) => <>{children}</>,
                    ul: ({ children }) => <>{children}</>,
                    ol: ({ children }) => <>{children}</>,
                    li: ({ children }) => <>{children}</>,
                    blockquote: ({ children }) => <>{children}</>,
                    // Stylisation des éléments en ligne
                    a: ({ href, children }) => <a href={href} className="text-primary-400 underline decoration-primary-500/30 hover:decoration-primary-500 transition-colors cursor-pointer" target="_blank" rel="noreferrer" onMouseDown={(e) => e.stopPropagation()}>{children}</a>,
                    code: ({ children }: any) => (
                        <code className="bg-gray-800/80 rounded px-1.5 py-0.5 text-sm text-pink-400 font-mono border border-gray-700/50">
                            {children}
                        </code>
                    ),
                    strong: ({ children }) => <strong className="font-bold text-gray-100">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                    del: ({ children }) => <del className="line-through text-gray-500">{children}</del>
                }}
            >
                {line}
            </ReactMarkdown>
        );
    };

    // Synchroniser le titre d'édition avec le registre
    useEffect(() => {
        if (currentChapter) {
            const ch = chapters.find(c => c.id === currentChapter);
            if (ch) setEditTitle(ch.title);
        }
    }, [currentChapter, chapters]);

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

    // Sauvegarde automatique (gérée par le composant hybride)
    const handleDebouncedSave = async (newContent: string) => {
        if (projectPath && currentChapter) {
            setIsSaving(true);
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
    };

    // Si aucun chapitre n'est sélectionné
    if (!currentChapter) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#0d1117] items-center justify-center">
                <p className="text-gray-500">{t('editor.noChapterDesc')}</p>
            </div>
        );
    }

    const handleRename = async () => {
        if (currentChapter && editTitle.trim()) {
            await renameItem(currentChapter, editTitle.trim(), 'chapters');
        }
    };

    // Calcul des statistiques en temps réel
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const charCount = content.length;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0d1117]">
            {/* Topbar for Editor */}
            <div className="h-16 border-b border-gray-800 flex items-center px-8 shrink-0 justify-between">
                <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.currentTarget.blur();
                        }
                    }}
                    className="bg-transparent text-xl font-semibold text-gray-100 outline-none w-full hover:bg-gray-800/50 focus:bg-gray-800/50 px-2 py-1 rounded transition-colors -ml-2"
                />
                <div className="flex items-center space-x-2 text-xs text-gray-500 shrink-0 ml-4">
                    <span>{isSaving ? t('editor.saving') : t('editor.saved')}</span>
                    <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-amber-500 animate-pulse' : 'bg-green-500 opacity-50'}`}></div>
                </div>
            </div>

            {/* Editor Content Area */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 pb-32">
                <div className="max-w-3xl mx-auto h-full flex flex-col">
                    <HybridMarkdownEditor
                        value={content}
                        onChange={setContent}
                        onDebouncedChange={handleDebouncedSave}
                        debounceMs={1000}
                        renderLine={renderMarkdownLine}
                        classNames={{
                            root: 'hybrid-editor-root w-full h-full text-lg leading-relaxed text-gray-300',
                            content: 'hybrid-editor-content',
                            activeLine: 'hybrid-active-line',
                            lineTypes: {
                                h1: 'hmd-h1 text-4xl font-bold mt-8 mb-4 text-white',
                                h2: 'hmd-h2 text-3xl font-semibold mt-6 mb-3 text-gray-100',
                                h3: 'hmd-h3 text-2xl font-semibold mt-4 mb-2 text-gray-200',
                                li: 'hmd-list ml-4 my-1',
                                blockquote: 'hmd-quote border-l-4 border-primary-500 bg-gray-800/50 pl-4 py-1.5 my-2 text-gray-400',
                                p: 'hmd-paragraph my-2 min-h-[1.5em]',
                            },
                        }}
                    />
                </div>
            </div>

            {/* Status Bar (Word Counter) */}
            <div className="h-8 bg-[#0a0d12] border-t border-gray-800/80 flex items-center justify-start px-6 text-[11px] text-gray-500 font-mono shrink-0">
                <div className="flex space-x-6">
                    <span className="hover:text-gray-300 transition-colors cursor-default" title="Mots">
                        {wordCount} mots
                    </span>
                    <span className="hover:text-gray-300 transition-colors cursor-default" title="Caractères">
                        {charCount} caractères
                    </span>
                </div>
            </div>
        </div>
    );
}
