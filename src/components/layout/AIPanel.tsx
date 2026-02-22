import { BrainCircuit, RefreshCw, AlertTriangle } from 'lucide-react';

export default function AIPanel() {
    return (
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full shrink-0">
            {/* AI Header */}
            <div className="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
                <BrainCircuit className="w-5 h-5 text-indigo-400 mr-3" />
                <h2 className="text-sm font-semibold text-indigo-100 uppercase tracking-wider">Lecteur IA</h2>
            </div>

            {/* AI Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Warning Cascade Mockup */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-medium text-amber-400 mb-1">Désynchronisation</p>
                            <p className="text-xs text-gray-400">Le chapitre 1 a été modifié. Les notes des chapitres suivants pourraient être obsolètes.</p>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div>
                    <button className="w-full flex items-center justify-center py-2.5 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-medium border border-indigo-500/30 rounded-lg transition-colors group">
                        <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                        Générer l'analyse
                    </button>
                </div>

                {/* AI Notes Mockup */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Notes de lecture</h3>

                    <div className="space-y-4">
                        <div className="bg-gray-800/50 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-gray-300 mb-1">Résumé de l'intrigue</h4>
                            <p className="text-xs text-gray-400">Présentation du personnage d'Elara qui se réveille. Une ambiance d'anticipation pour un évènement important est mise en place.</p>
                        </div>

                        <div className="bg-gray-800/50 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-gray-300 mb-1">Personnages</h4>
                            <p className="text-xs text-gray-400">Elara : Semble habituée à un environnement modeste (plancher usé). Fait des rêves marquants.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
