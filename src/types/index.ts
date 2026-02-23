export interface Character {
    id: string; // FileName without extension
    name: string;
    role: string;
    description: string;
    appearance: string;
    personality: string;
}

export interface LoreEntry {
    id: string; // FileName without extension
    title: string;
    category: string;
    content: string;
}

export type ViewMode = 'chapters' | 'characters' | 'lore' | 'settings';

export interface RegistryItem {
    id: string; // Identifier unique et nom du fichier
    title: string; // Vrai titre (modifiable)
}

export interface Registry {
    chapters: RegistryItem[];
    characters: RegistryItem[];
    lore: RegistryItem[];
}

export interface ProjectStats {
    dailyGoal: number;
    history: Record<string, number>; // Date au format YYYY-MM-DD -> Nombre de mots écrits
}

export interface ProjectSettings {
    aiProvider: 'mistral' | 'none';
    mistralApiKey: string;
    mistralModel: string;
    temperature: number;
    lastViewMode?: ViewMode | 'statistics';
    lastChapterId?: string | null;
    lastComponentId?: string | null;
}
