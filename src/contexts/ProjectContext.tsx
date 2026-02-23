import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { ViewMode } from '../types';

interface ProjectContextType {
    projectPath: string;
    chapters: string[];
    characters: string[];
    lore: string[];
    refreshFiles: () => Promise<void>;
    currentChapter: string | null;
    setCurrentChapter: (chapter: string | null) => void;
    currentComponentId: string | null;
    setCurrentComponentId: (id: string | null) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children, projectPath }: { children: ReactNode, projectPath: string }) {
    const [chapters, setChapters] = useState<string[]>([]);
    const [characters, setCharacters] = useState<string[]>([]);
    const [lore, setLore] = useState<string[]>([]);
    const [currentChapter, setCurrentChapter] = useState<string | null>(null);
    const [currentComponentId, setCurrentComponentId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('chapters');

    const refreshFiles = async () => {
        try {
            // Refresh chapters
            const chaptersPath = `${projectPath}/chapters`;
            const chapterFiles: string[] = await invoke('list_files', { path: chaptersPath });
            setChapters(chapterFiles.filter(f => f.endsWith('.md')));

            // Refresh characters
            const charsPath = `${projectPath}/characters`;
            const charFiles: string[] = await invoke('list_files', { path: charsPath });
            setCharacters(charFiles.filter(f => f.endsWith('.json')));

            // Refresh lore
            const lorePath = `${projectPath}/lore`;
            const loreFiles: string[] = await invoke('list_files', { path: lorePath });
            setLore(loreFiles.filter(f => f.endsWith('.json')));

            // Default selection logic on initial load could go here if needed
        } catch (error) {
            console.error("Erreur lors de la récupération des fichiers:", error);
        }
    };

    // Charge les fichiers au montage du provider
    useEffect(() => {
        refreshFiles();
    }, [projectPath]);

    return (
        <ProjectContext.Provider value={{
            projectPath,
            chapters, characters, lore,
            refreshFiles,
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
