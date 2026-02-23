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
