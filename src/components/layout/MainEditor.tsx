import { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProject } from '../../contexts/ProjectContext';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Heading3 } from 'lucide-react';

export default function MainEditor() {
    const { t } = useTranslation();
    const { projectPath, currentChapter, chapters, renameItem, updateDailyWordCount, updateItemModified } = useProject();

    // État pour savoir si on est en train de sauvegarder
    const [isSaving, setIsSaving] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    // Références pour la synchro et l'auto-save
    const initialWordCountRef = useRef(0);
    const saveTimerRef = useRef<number | null>(null);
    const currentChapterRef = useRef(currentChapter);
    const projectPathRef = useRef(projectPath);

    useEffect(() => {
        currentChapterRef.current = currentChapter;
    }, [currentChapter]);

    useEffect(() => {
        projectPathRef.current = projectPath;
    }, [projectPath]);

    // Initialisation de Tiptap
    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'tiptap-editor prose prose-invert prose-p:text-gray-100 prose-headings:text-gray-50 prose-a:text-primary-400 prose-blockquote:border-primary-500 prose-blockquote:bg-gray-800/50 prose-blockquote:not-italic prose-blockquote:text-gray-300 prose-blockquote:px-4 prose-blockquote:py-2 max-w-none w-full min-h-[80vh] focus:outline-none p-6 sm:p-10 lg:p-12',
            },
        },
        onUpdate: ({ editor }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const storage = editor.storage as any;
            const markdown = storage.markdown ? storage.markdown.getMarkdown() : '';
            handleContentChange(markdown);
        },
    });

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

        if (projectPath && currentChapter && editor) {
            const loadChapter = async () => {
                try {
                    const fileContent: string = await invoke('read_file', {
                        path: `${projectPath}/chapters/${currentChapter}`
                    });
                    if (isCancelled) return;

                    // On force l'injection du markdown brut dans Tiptap
                    editor.commands.setContent(fileContent, { emitUpdate: false }); // false empêche d'ajouter ça à l'historique undo

                    const text = fileContent.trim();
                    const words = text ? text.split(/[\s\n\r]+/).filter(w => w.length > 0).length : 0;
                    initialWordCountRef.current = words;
                } catch (error) {
                    console.error("Erreur de lecture:", error);
                    if (isCancelled) return;
                    editor.commands.setContent('', { emitUpdate: false });
                    initialWordCountRef.current = 0;
                }
            };
            loadChapter();
        } else if (editor) {
            editor.commands.setContent('', { emitUpdate: false });
            initialWordCountRef.current = 0;
        }

        // Sauvegarde au démontage ou changement
        return () => {
            isCancelled = true;
            if (projectPathRef.current && currentChapterRef.current && saveTimerRef.current && editor) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const storage = editor.storage as any;
                const markdown = storage.markdown ? storage.markdown.getMarkdown() : '';
                invoke('write_file', {
                    path: `${projectPathRef.current}/chapters/${currentChapterRef.current}`,
                    content: markdown
                }).catch(e => console.error("Erreur flush:", e));
            }
        };
    }, [projectPath, currentChapter, editor]);

    // Sauvegarde automatique (Debounce manuel)
    const handleContentChange = useCallback((newContent: string) => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        const activePath = projectPath;
        const activeChapter = currentChapter;

        saveTimerRef.current = window.setTimeout(async () => {
            if (!activePath || !activeChapter) return;

            setIsSaving(true);
            try {
                await invoke('write_file', {
                    path: `${activePath}/chapters/${activeChapter}`,
                    content: newContent
                });

                await updateItemModified(activeChapter, Date.now());

                saveTimerRef.current = null;

                const currentText = newContent.trim();
                const newWordCount = currentText ? currentText.split(/[\s\n\r]+/).filter(w => w.length > 0).length : 0;
                const delta = newWordCount - initialWordCountRef.current;

                if (delta > 0) {
                    updateDailyWordCount(delta);
                    initialWordCountRef.current = newWordCount;
                } else if (delta < 0) {
                    initialWordCountRef.current = newWordCount;
                }
            } catch (error) {
                console.error("Erreur de sauvegarde native:", error);
            } finally {
                setIsSaving(false);
            }
        }, 1000);
    }, [projectPath, currentChapter, updateDailyWordCount, updateItemModified]);

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

    const wordCount = initialWordCountRef.current;

    // Safe check if editor is initialized before calling storage
    const getMarkdownContent = () => {
        if (!editor) return '';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const storage = editor.storage as any;
        return storage.markdown ? storage.markdown.getMarkdown() : '';
    };

    const liveWordCount = getMarkdownContent().trim().split(/[\s\n\r]+/).filter((w: string) => w.length > 0).length;
    const liveCharCount = getMarkdownContent().length;

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

            {/* Toolbar Tiptap (Sticky) */}
            {editor && (
                <div className="w-full bg-[#0d1117] border-b border-gray-800 p-2 flex items-center justify-center shrink-0 z-20">
                    <div className="flex items-center flex-wrap gap-1 max-w-4xl w-full">
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                            title="Gras (Ctrl+B)"
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                            title="Italique (Ctrl+I)"
                        >
                            <Italic className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-gray-700 mx-1"></div>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                            title="Titre 1"
                        >
                            <Heading1 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                            title="Titre 2"
                        >
                            <Heading2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                            title="Titre 3"
                        >
                            <Heading3 className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-gray-700 mx-1"></div>
                        <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                            title="Liste à puces"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                            title="Liste numérotée"
                        >
                            <ListOrdered className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-gray-700 mx-1"></div>
                        <button
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            className={`p-1.5 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-primary-500/20 text-primary-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                            title="Citation"
                        >
                            <Quote className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Editor Content Area */}
            <div className="flex-1 overflow-y-auto bg-[#050608] cursor-text flex flex-col items-center">
                <div className="w-full max-w-4xl flex-1 flex flex-col p-4 sm:p-8 lg:p-12 pb-32">
                    {editor && (
                        <EditorContent
                            editor={editor}
                            className="bg-[#0d1117] border border-gray-800 rounded-xl shadow-2xl shadow-black/50 flex-1"
                        />
                    )}
                </div>
            </div>

            {/* Status Bar (Word Counter) */}
            <div className="h-8 bg-[#0a0d12] border-t border-gray-800/80 flex items-center justify-start px-6 text-[11px] text-gray-500 font-mono shrink-0">
                <div className="flex space-x-6">
                    <span className="hover:text-gray-300 transition-colors cursor-default" title="Mots">
                        {liveWordCount > 0 ? liveWordCount : wordCount} mots
                    </span>
                    <span className="hover:text-gray-300 transition-colors cursor-default" title="Caractères">
                        {liveCharCount} caractères
                    </span>
                </div>
            </div>
        </div>
    );
}
