import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import type { ViewMode, Registry, RegistryItem, ProjectStats, ProjectSettings } from '../types';

interface ProjectContextType {
    projectPath: string;
    chapters: RegistryItem[];
    characters: RegistryItem[];
    lore: RegistryItem[];
    stats: ProjectStats;
    settings: ProjectSettings;
    refreshFiles: () => Promise<void>;
    createItem: (title: string, mode: ViewMode) => Promise<void>;
    renameItem: (id: string, newTitle: string, mode: ViewMode) => Promise<void>;
    reorderItem: (startIndex: number, endIndex: number, mode: ViewMode) => Promise<void>;
    currentChapter: string | null;
    setCurrentChapter: (chapter: string | null) => void;
    currentComponentId: string | null;
    setCurrentComponentId: (id: string | null) => void;
    viewMode: ViewMode | 'statistics';
    setViewMode: (mode: ViewMode | 'statistics') => void;
    updateDailyWordCount: (delta: number) => Promise<void>;
    updateDailyGoal: (goal: number) => Promise<void>;
    updateSettings: (newSettings: Partial<ProjectSettings>) => Promise<void>;
    closeProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children, projectPath, onCloseProject }: { children: ReactNode, projectPath: string, onCloseProject: () => void }) {
    const [chapters, setChapters] = useState<RegistryItem[]>([]);
    const [characters, setCharacters] = useState<RegistryItem[]>([]);
    const [lore, setLore] = useState<RegistryItem[]>([]);
    const [stats, setStats] = useState<ProjectStats>({ dailyGoal: 500, history: {} });
    const [settings, setSettings] = useState<ProjectSettings>({
        aiProvider: 'none',
        mistralApiKey: '',
        mistralModel: 'open-mistral-nemo',
        language: 'fr'
    });
    const [currentChapter, setCurrentChapter] = useState<string | null>(null);
    const [currentComponentId, setCurrentComponentId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode | 'statistics'>('chapters');
    const { i18n } = useTranslation();

    useEffect(() => {
        if (settings.language) {
            i18n.changeLanguage(settings.language);
        }
    }, [settings.language, i18n]);

    const slugify = (text: string) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Remplace les espaces par -
            .replace(/[^\w\-]+/g, '')       // Retire tous les caractères non-word (pas de lettres, chiffres, underscores, tirets)
            .replace(/\-\-+/g, '-')         // Remplace les multiples - par un seul
            .replace(/^-+/, '')             // Retire les - du début
            .replace(/-+$/, '');            // Retire les - de la fin
    };

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

    const saveStats = async (newStats: ProjectStats) => {
        try {
            await invoke('write_file', {
                path: `${projectPath}/stats.json`,
                content: JSON.stringify(newStats, null, 2)
            });
            // NE PAS FAIRE setStats() ici. Sinon la résolution asynchrone écrase l'état avec d'anciennes versions quand on tape vite (Race condition).
        } catch (error) {
            console.error("Erreur saveStats:", error);
        }
    };

    const saveSettings = async (newSettings: ProjectSettings) => {
        try {
            await invoke('write_file', {
                path: `${projectPath}/settings.json`,
                content: JSON.stringify(newSettings, null, 2)
            });
            setSettings(newSettings);
        } catch (error) {
            console.error("Erreur saveSettings:", error);
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

        try {
            const statsContent: string = await invoke('read_file', { path: `${projectPath}/stats.json` });
            const statsData = JSON.parse(statsContent) as ProjectStats;
            setStats(statsData);
        } catch {
            // Si le fichier n'existe pas encore, on l'initialise
            const initialStats = { dailyGoal: 500, history: {} };
            await saveStats(initialStats);
            setStats(initialStats);
        }

        try {
            const settingsContent: string = await invoke('read_file', { path: `${projectPath}/settings.json` });
            const settingsData = JSON.parse(settingsContent) as ProjectSettings;
            setSettings(settingsData);
            if (settingsData.lastViewMode) setViewMode(settingsData.lastViewMode);
            if (settingsData.lastChapterId !== undefined) setCurrentChapter(settingsData.lastChapterId);
            if (settingsData.lastComponentId !== undefined) setCurrentComponentId(settingsData.lastComponentId);
        } catch {
            // Initialisation par défaut
            const initialSettings: ProjectSettings = {
                aiProvider: 'none',
                mistralApiKey: '',
                mistralModel: 'open-mistral-nemo',
                language: 'fr'
            };
            await saveSettings(initialSettings);
            // setSettings est déjà appelé dans saveSettings()
        }
    };

    const refreshFiles = useCallback(async () => {
        await loadOrBuildRegistry();
    }, [projectPath]);

    const createItem = useCallback(async (title: string, mode: ViewMode) => {
        const timestamp = Date.now();
        // Slugification du titre pour en faire un identifiant de système de fichier sûr
        const slug = slugify(title);
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
    }, [chapters, characters, lore, projectPath]);

    const renameItem = useCallback(async (oldId: string, newTitle: string, mode: ViewMode) => {
        if (mode === 'settings') return;

        const currentRegistry: Registry = { chapters, characters, lore };
        const registryMode = mode as keyof Registry;

        const targetList = currentRegistry[registryMode];
        const itemIndex = targetList.findIndex((item) => item.id === oldId);

        if (itemIndex === -1) return; // Sécurité
        if (targetList[itemIndex].title === newTitle) return; // Ne rien faire si identique

        const timestamp = Date.now();
        const slug = slugify(newTitle);
        const newBaseId = `${timestamp}_${slug || 'untitled'}`;

        let folder = mode;
        let ext = mode === 'chapters' ? '.md' : '.json';
        let newId = `${newBaseId}${ext}`;

        try {
            await invoke('rename_file', {
                oldPath: `${projectPath}/${folder}/${oldId}`,
                newPath: `${projectPath}/${folder}/${newId}`
            });

            currentRegistry[registryMode][itemIndex] = { id: newId, title: newTitle };

            if (mode === 'chapters' && currentChapter === oldId) setCurrentChapter(newId);
            if ((mode === 'characters' || mode === 'lore') && currentComponentId === oldId) setCurrentComponentId(newId);

            await saveRegistry(currentRegistry);
        } catch (error) {
            console.error("Erreur lors du renommage physique:", error);
            alert("Erreur: Impossible de renommer le fichier source. " + error);
        }
    }, [chapters, characters, lore, projectPath, currentChapter, currentComponentId]);

    const reorderItem = useCallback(async (startIndex: number, endIndex: number, mode: ViewMode) => {
        if (mode === 'settings') return;

        const currentRegistry: Registry = { chapters, characters, lore };
        const registryMode = mode as keyof Registry;

        const list = Array.from(currentRegistry[registryMode]);
        const [removed] = list.splice(startIndex, 1);
        list.splice(endIndex, 0, removed);

        currentRegistry[registryMode] = list;
        await saveRegistry(currentRegistry);
    }, [chapters, characters, lore, projectPath]);

    const updateDailyWordCount = useCallback(async (delta: number) => {
        if (delta === 0) return;
        const today = new Date().toISOString().split('T')[0];

        setStats(prev => {
            const newStats = { ...prev, history: { ...prev.history } };
            const currentCount = newStats.history[today] || 0;
            // On s'assure que le compteur ne descend jamais en dessous de 0 (si l'utilisateur supprime plus que ce qu'il a écrit ce jour-là)
            newStats.history[today] = Math.max(0, currentCount + delta);
            saveStats(newStats); // Ne pas await pour ne pas bloquer l'UI
            return newStats;
        });
    }, [projectPath]);

    const updateDailyGoal = useCallback(async (goal: number) => {
        setStats(prev => {
            const newStats = { ...prev, history: { ...prev.history }, dailyGoal: Math.max(1, goal) };
            saveStats(newStats);
            return newStats;
        });
    }, [projectPath]);

    const updateSettings = useCallback(async (newPartialSettings: Partial<ProjectSettings>) => {
        const updatedSettings = { ...settings, ...newPartialSettings };
        await saveSettings(updatedSettings);
    }, [settings, projectPath]);

    const closeProject = useCallback(() => {
        onCloseProject();
    }, [onCloseProject]);

    // Charge le registre au montage
    useEffect(() => {
        refreshFiles();
    }, [refreshFiles]);

    // Synchronisation de la langue avec i18next
    useEffect(() => {
        if (settings.language && i18n.language !== settings.language) {
            i18n.changeLanguage(settings.language);
        }
    }, [settings.language, i18n]);

    // Sauvegarde automatique du contexte UI (Vue active, dernier élément sélectionné)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            updateSettings({
                lastViewMode: viewMode,
                lastChapterId: currentChapter,
                lastComponentId: currentComponentId
            });
        }, 1500); // 1.5s de debounce pour ne pas spammer d'écritures disque 

        return () => clearTimeout(timeoutId);
    }, [viewMode, currentChapter, currentComponentId, updateSettings]);

    // Mémoïsation de la valeur du contexte pour éviter les re-rendus enfants inutiles
    const contextValue = useMemo(() => ({
        projectPath,
        chapters, characters, lore, stats, settings,
        refreshFiles,
        createItem,
        renameItem,
        reorderItem,
        currentChapter, setCurrentChapter,
        currentComponentId, setCurrentComponentId,
        viewMode, setViewMode,
        updateDailyWordCount, updateDailyGoal, updateSettings, closeProject
    }), [
        projectPath, chapters, characters, lore, stats, settings,
        refreshFiles, createItem, renameItem, reorderItem,
        currentChapter, currentComponentId, viewMode,
        updateDailyWordCount, updateDailyGoal, updateSettings, closeProject
    ]);

    return (
        <ProjectContext.Provider value={contextValue}>
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
