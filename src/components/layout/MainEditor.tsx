import { Info } from 'lucide-react';

export default function MainEditor() {
    return (
        <div className="flex-1 flex flex-col h-full bg-[#0d1117]">
            {/* Topbar for Editor */}
            <div className="h-16 border-b border-gray-800 flex items-center px-8 shrink-0 justify-between">
                <input
                    type="text"
                    defaultValue="Chapitre 1 : Le Réveil"
                    className="bg-transparent text-xl font-semibold text-gray-100 placeholder-gray-600 outline-none w-full"
                />
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Automatiquement sauvegardé</span>
                    <div className="w-2 h-2 rounded-full bg-green-500 opacity-50"></div>
                </div>
            </div>

            {/* Editor Content Area */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 pb-32">
                <div className="max-w-3xl mx-auto h-full flex flex-col">
                    <textarea
                        className="w-full h-full bg-transparent text-gray-300 text-lg leading-relaxed resize-none outline-none font-serif"
                        placeholder="Écrivez votre histoire ici..."
                        defaultValue="La lumière de l'aube filtrait à travers les volets entrebâillés, dessinant de longues lignes dorées sur le plancher en bois usé. Elara ouvrit les yeux, l'esprit encore embrumé par les restes de son rêve. Ce jour n'était pas un jour ordinaire."
                        spellCheck="false"
                    />
                </div>
            </div>
        </div>
    );
}
