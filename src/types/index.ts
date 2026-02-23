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

export type ViewMode = 'chapters' | 'characters' | 'lore';

export interface RegistryItem {
    id: string; // Identifier unique et nom du fichier
    title: string; // Vrai titre (modifiable)
}

export interface Registry {
    chapters: RegistryItem[];
    characters: RegistryItem[];
    lore: RegistryItem[];
}
