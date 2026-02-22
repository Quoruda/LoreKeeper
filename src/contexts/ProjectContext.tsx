import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ProjectContextType {
    projectPath: string;
    chapters: string[];
    refreshChapters: () => Promise<void>;
    currentChapter: string | null;
    setCurrentChapter: (chapter: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children, projectPath }: { children: ReactNode, projectPath: string }) {
    const [chapters, setChapters] = useState<string[]>([]);
    const [currentChapter, setCurrentChapter] = useState<string | null>(null);

    const refreshChapters = async () => {
        try {
            const chaptersPath = `${projectPath}/chapters`;
            // Appelle la commande Rust pour lister les fichiers du dossier chapters
            const files: string[] = await invoke('list_files', { path: chaptersPath });
            setChapters(files);

            // Sélectionne le premier chapitre par défaut s'il y en a un et qu'aucun n'est sélectionné
            if (files.length > 0 && !currentChapter) {
                setCurrentChapter(files[0]);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des chapitres:", error);
        }
    };

    // Charge les chapitres au montage du provider
    useEffect(() => {
        refreshChapters();
    }, [projectPath]);

    return (
        <ProjectContext.Provider value={{ projectPath, chapters, refreshChapters, currentChapter, setCurrentChapter }}>
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
