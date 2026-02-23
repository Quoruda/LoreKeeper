import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ViewMode, Registry, RegistryItem } from '../types';

interface ProjectContextType {
    projectPath: string;
    chapters: RegistryItem[];
    characters: RegistryItem[];
    lore: RegistryItem[];
    refreshFiles: () => Promise<void>;
    createItem: (title: string, mode: ViewMode) => Promise<void>;
    renameItem: (id: string, newTitle: string, mode: ViewMode) => Promise<void>;
    reorderItem: (startIndex: number, endIndex: number, mode: ViewMode) => Promise<void>;
    currentChapter: string | null;
    setCurrentChapter: (chapter: string | null) => void;
    currentComponentId: string | null;
    setCurrentComponentId: (id: string | null) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children, projectPath }: { children: ReactNode, projectPath: string }) {
    const [chapters, setChapters] = useState<RegistryItem[]>([]);
    const [characters, setCharacters] = useState<RegistryItem[]>([]);
    const [lore, setLore] = useState<RegistryItem[]>([]);
    const [currentChapter, setCurrentChapter] = useState<string | null>(null);
    const [currentComponentId, setCurrentComponentId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('chapters');

    const saveRegistry = async (newRegistry: Registry) => {
        try {
            await invoke('write_file', {
                path: `${projectPath}/lorekeeper.json`,
                content: JSON.stringify(newRegistry, null, 2)
            });
            setChapters(newRegistry.chapters);
            setCharacters(newRegistry.characters);
            setLore(newRegistry.lore);
        } catch (error) {
            console.error("Erreur saveRegistry:", error);
        }
    };

    const loadOrBuildRegistry = async () => {
        try {
            const content: string = await invoke('read_file', { path: `${projectPath}/lorekeeper.json` });
            const data = JSON.parse(content) as Registry;
            setChapters(data.chapters || []);
            setCharacters(data.characters || []);
            setLore(data.lore || []);
        } catch {
            // Initialisation silencieuse : si le fichier n'existe pas, on le créé avec ce qu'on trouve sur le disque (fallback pour les anciens projets)
            try {
                const chapterFiles: string[] = await invoke('list_files', { path: `${projectPath}/chapters` });
                const charFiles: string[] = await invoke('list_files', { path: `${projectPath}/characters` });
                const loreFiles: string[] = await invoke('list_files', { path: `${projectPath}/lore` });

                const newRegistry: Registry = {
                    chapters: chapterFiles.filter(f => f.endsWith('.md')).map(f => ({ id: f, title: f.replace('.md', '') })),
                    characters: charFiles.filter(f => f.endsWith('.json')).map(f => ({ id: f, title: f.replace('.json', '') })),
                    lore: loreFiles.filter(f => f.endsWith('.json')).map(f => ({ id: f, title: f.replace('.json', '') }))
                };
                await saveRegistry(newRegistry);
            } catch (err) {
                console.error("Erreur de reconstruction du registre lorekeeper.json:", err);
            }
        }
    };

    const refreshFiles = async () => {
        await loadOrBuildRegistry();
    };

    const createItem = async (title: string, mode: ViewMode) => {
        const timestamp = Date.now();
        // Slugification du titre pour en faire un identifiant de système de fichier sûr
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const baseId = `${timestamp}_${slug || 'untitled'}`;

        const currentRegistry: Registry = { chapters, characters, lore };

        try {
            if (mode === 'chapters') {
                const fileName = `${baseId}.md`;
                await invoke('write_file', { path: `${projectPath}/chapters/${fileName}`, content: "" });
                currentRegistry.chapters = [...currentRegistry.chapters, { id: fileName, title }];
                setCurrentChapter(fileName);
            } else if (mode === 'characters') {
                const fileName = `${baseId}.json`;
                await invoke('write_file', {
                    path: `${projectPath}/characters/${fileName}`,
                    content: JSON.stringify({ id: baseId, name: title, role: "", description: "", appearance: "", personality: "" }, null, 2)
                });
                currentRegistry.characters = [...currentRegistry.characters, { id: fileName, title }];
                setCurrentComponentId(fileName);
            } else if (mode === 'lore') {
                const fileName = `${baseId}.json`;
                await invoke('write_file', {
                    path: `${projectPath}/lore/${fileName}`,
                    content: JSON.stringify({ id: baseId, title: title, category: "", content: "" }, null, 2)
                });
                currentRegistry.lore = [...currentRegistry.lore, { id: fileName, title }];
                setCurrentComponentId(fileName);
            }
            await saveRegistry(currentRegistry);
        } catch (error) {
            console.error("Erreur lors de la création", error);
            throw error;
        }
    };

    const renameItem = async (oldId: string, newTitle: string, mode: ViewMode) => {
        const currentRegistry: Registry = { chapters, characters, lore };

        const targetList = currentRegistry[mode];
        const itemIndex = targetList.findIndex(item => item.id === oldId);

        if (itemIndex === -1) return; // Sécurité
        if (targetList[itemIndex].title === newTitle) return; // Ne rien faire si identique

        const timestamp = Date.now();
        const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const newBaseId = `${timestamp}_${slug || 'untitled'}`;

        let folder = mode;
        let ext = mode === 'chapters' ? '.md' : '.json';
        let newId = `${newBaseId}${ext}`;

        try {
            await invoke('rename_file', {
                oldPath: `${projectPath}/${folder}/${oldId}`,
                newPath: `${projectPath}/${folder}/${newId}`
            });

            currentRegistry[mode][itemIndex] = { id: newId, title: newTitle };

            if (mode === 'chapters' && currentChapter === oldId) setCurrentChapter(newId);
            if ((mode === 'characters' || mode === 'lore') && currentComponentId === oldId) setCurrentComponentId(newId);

            await saveRegistry(currentRegistry);
        } catch (error) {
            console.error("Erreur lors du renommage physique:", error);
            alert("Erreur: Impossible de renommer le fichier source. " + error);
        }
    };

    const reorderItem = async (startIndex: number, endIndex: number, mode: ViewMode) => {
        const currentRegistry: Registry = { chapters, characters, lore };

        const list = Array.from(currentRegistry[mode]);
        const [removed] = list.splice(startIndex, 1);
        list.splice(endIndex, 0, removed);

        currentRegistry[mode] = list;
        await saveRegistry(currentRegistry);
    };

    // Charge le registre au montage
    useEffect(() => {
        refreshFiles();
    }, [projectPath]);

    return (
        <ProjectContext.Provider value={{
            projectPath,
            chapters, characters, lore,
            refreshFiles,
            createItem,
            renameItem,
            reorderItem,
            currentChapter, setCurrentChapter,
            currentComponentId, setCurrentComponentId,
            viewMode, setViewMode
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject doit être utilisé à l\'intérieur d\'un ProjectProvider');
    }
    return context;
}
