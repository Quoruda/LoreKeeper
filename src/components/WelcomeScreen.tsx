import { FolderOpen, Book, Check } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';

interface WelcomeScreenProps {
    onProjectOpened: (path: string) => void;
}

export default function WelcomeScreen({ onProjectOpened }: WelcomeScreenProps) {
    const [manualPath, setManualPath] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleBrowse = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Sélectionner le dossier du projet LoreKeeper"
            });
            if (selected && typeof selected === 'string') {
                setManualPath(selected);
            }
        } catch (error) {
            console.error("Erreur de dialogue natif:", error);
            alert("Erreur lors de l'ouverture de l'explorateur : " + error);
        }
    };

    const handleConfirm = async () => {
        if (!manualPath.trim()) return;
        setIsLoading(true);
        try {
            await invoke('init_project', { path: manualPath.trim() });
            onProjectOpened(manualPath.trim());
        } catch (error) {
            console.error("Erreur d'initialisation:", error);
            alert("Erreur: " + error);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
            <div className="max-w-md w-full p-8 text-center bg-gray-800/30 rounded-2xl border border-gray-800">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg border border-gray-700">
                    <Book className="w-8 h-8 text-primary-500" />
                </div>

                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-indigo-500 bg-clip-text text-transparent mb-2">
                    LoreKeeper
                </h1>
                <p className="text-gray-400 mb-8 text-sm">
                    Sélectionnez ou indiquez le chemin vers le dossier de votre livre.
                </p>

                <div className="space-y-4 text-left">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1 ml-1" htmlFor="path">
                            Chemin du dossier projet
                        </label>
                        <div className="flex space-x-2">
                            <input
                                id="path"
                                type="text"
                                value={manualPath}
                                onChange={(e) => setManualPath(e.target.value)}
                                placeholder="/home/audrick/Documents/MonLivre"
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary-500 transition-colors"
                            />
                            <button
                                onClick={handleBrowse}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
                                title="Parcourir"
                            >
                                <FolderOpen className="w-4 h-4 text-gray-300" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!manualPath.trim() || isLoading}
                        className="w-full flex items-center justify-center py-3 px-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg shadow-primary-500/20"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Check className="w-5 h-5 mr-2" />
                                Ouvrir le projet
                            </>
                        )}
                    </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-800/50 text-xs text-gray-500 text-center">
                    <p>Si le bouton Parcourir ne fonctionne pas, vous pouvez directement coller le chemin absolu du dossier dans le champ de texte.</p>
                </div>
            </div>
        </div>
    );
}
