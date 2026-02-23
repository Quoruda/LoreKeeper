import { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProject } from '../../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';
import { HybridMarkdownEditor } from 'hybrid-markdown-editor';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MainEditor() {
    const { t } = useTranslation();
    const { projectPath, currentChapter, chapters, renameItem, updateDailyWordCount } = useProject();
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const initialWordCountRef = useRef(0);
    const saveTimerRef = useRef<number | null>(null);
    const currentChapterRef = useRef(currentChapter);
    const contentRef = useRef(content);
    const projectPathRef = useRef(projectPath);

    useEffect(() => {
        currentChapterRef.current = currentChapter;
    }, [currentChapter]);

    useEffect(() => {
        projectPathRef.current = projectPath;
    }, [projectPath]);

    // Composant de rendu personnalisé pour HybridMarkdownEditor
    // Permet d'injecter tous les composants complexes de ReactMarkdown (Gras, liens, code...) 
    // à l'intérieur du conteneur de type (h1, p, blockquote) déjà géré par l'éditeur hybride.
    const renderMarkdownLine = useCallback(({ line, isActive, defaultContent }: any) => {
        if (isActive) return defaultContent;
        if (line.trim() === '') return <>{'\u00A0'}</>;

        const customComponents: Partial<Components> = {
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
            a: ({ href, children }) => <a href={href} className="text-primary-400 underline decoration-primary-500/30 hover:decoration-primary-500 transition-colors cursor-pointer" target="_blank" rel="noreferrer" onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}>{children}</a>,
            code: ({ children }) => (
                <code className="bg-gray-800/80 rounded px-1.5 py-0.5 text-sm text-pink-400 font-mono border border-gray-700/50">
                    {children}
                </code>
            ),
            strong: ({ children }) => <strong className="font-bold text-gray-100">{children}</strong>,
            em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
            del: ({ children }) => <del className="line-through text-gray-500">{children}</del>
        };

        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={customComponents}
            >
                {line}
            </ReactMarkdown>
        );
    }, []);

    // Synchroniser le titre d'édition avec le registre
    useEffect(() => {
        if (currentChapter) {
            const ch = chapters.find(c => c.id === currentChapter);
            if (ch) setEditTitle(ch.title);
        }
    }, [currentChapter, chapters]);

    // Charger le contenu du chapitre quand il change
    useEffect(() => {
        let isCancelled = false;

        // --- CHARGEMENT DU NOUVEAU CHAPITRE ---
        if (projectPath && currentChapter) {
            const loadChapter = async () => {
                try {
                    const fileContent: string = await invoke('read_file', {
                        path: `${projectPath}/chapters/${currentChapter}`
                    });
                    if (isCancelled) return;
                    setContent(fileContent);
                    contentRef.current = fileContent;
                    const text = fileContent.trim();
                    // On filtre les éléments vides après avoir séparé par n'importe quel espace / retour chariot
                    const words = text ? text.split(/[\s\n\r]+/).filter(w => w.length > 0).length : 0;
                    initialWordCountRef.current = words;
                } catch (error) {
                    console.error("Erreur de lecture:", error);
                    if (isCancelled) return;
                    setContent('');
                    contentRef.current = '';
                    initialWordCountRef.current = 0;
                }
            };
            loadChapter();
        } else {
            setContent('');
            contentRef.current = '';
            initialWordCountRef.current = 0;
        }

        // --- MÉCANISME DE SAUVEGARDE AU DÉMONTAGE / CHANGEMENT DE CHAPITRE ---
        return () => {
            isCancelled = true;
            if (projectPath && currentChapter && saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
                // Flush synchrone / asynchrone sécurisé du dernier état connu (sur l'ancien chapitre bloqué en mémoire)
                invoke('write_file', {
                    path: `${projectPath}/chapters/${currentChapter}`,
                    content: contentRef.current
                }).catch(e => console.error("Erreur flush:", e));
            }
        };
    }, [projectPath, currentChapter]);

    // Sauvegarde automatique native et robuste (Debounce manuel)
    const handleContentChange = useCallback((newContent: string) => {
        setContent(newContent); // Met à jour l'affichage immédiatement
        contentRef.current = newContent; // Maintient la ref à jour pour le démontage

        // Annule le timer précédent s'il y en a un
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        const activePath = projectPath;
        const activeChapter = currentChapter;

        // Lance un nouveau timer de sauvegarde
        saveTimerRef.current = window.setTimeout(async () => {
            if (!activePath || !activeChapter) return;

            setIsSaving(true);
            try {
                await invoke('write_file', {
                    path: `${activePath}/chapters/${activeChapter}`,
                    content: newContent
                });

                saveTimerRef.current = null; // Timer acquitté

                // Calcul des mots écrits et envoi dans les stats
                const currentText = newContent.trim();
                const newWordCount = currentText ? currentText.split(/[\s\n\r]+/).filter(w => w.length > 0).length : 0;
                const delta = newWordCount - initialWordCountRef.current;

                if (delta > 0) { // On ajoute uniquement les ajouts confirmés
                    updateDailyWordCount(delta);
                    // On ne met à jour la référence QUE si un delta a été enregistré
                    initialWordCountRef.current = newWordCount;
                } else if (delta < 0) {
                    // Si l'utilisateur efface du texte, on ajuste sa ligne de base
                    initialWordCountRef.current = newWordCount;
                }
            } catch (error) {
                console.error("Erreur de sauvegarde native:", error);
            } finally {
                setIsSaving(false);
            }
        }, 1000); // Délai de 1 seconde après la frappe
    }, [projectPath, currentChapter, updateDailyWordCount]);

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
    const currentText = content.trim();
    const wordCount = currentText ? currentText.split(/[\s\n\r]+/).filter(w => w.length > 0).length : 0;
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
                        onChange={handleContentChange}
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
