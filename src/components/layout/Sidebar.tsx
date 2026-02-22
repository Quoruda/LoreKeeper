import { Book, Users, ScrollText, BarChart2, Settings, ChevronRight, FileText } from 'lucide-react';

const navigation = [
    { name: 'Chapitres', icon: Book, current: true },
    { name: 'Personnages', icon: Users, current: false },
    { name: 'Lore', icon: ScrollText, current: false },
    { name: 'Statistiques', icon: BarChart2, current: false },
];

export default function Sidebar() {
    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full shrink-0">
            {/* Header Logo */}
            <div className="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-indigo-500 bg-clip-text text-transparent">
                    LoreKeeper
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                        <a
                            key={item.name}
                            href="#"
                            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${item.current
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                        >
                            <Icon className="w-5 h-5 mr-3 shrink-0" />
                            {item.name}
                            {item.current && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                        </a>
                    );
                })}

                {/* Mockup sub-items for Chapters to show the drag & drop idea */}
                <div className="mt-4 pt-4 border-t border-gray-800/50">
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Livre Actuel
                    </p>
                    <div className="space-y-1">
                        <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/30 rounded-lg group">
                            <FileText className="w-4 h-4 mr-3 text-gray-500 group-hover:text-primary-400" />
                            Chapitre 1
                        </a>
                        <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/30 rounded-lg group">
                            <FileText className="w-4 h-4 mr-3 text-gray-500 group-hover:text-primary-400" />
                            Chapitre 2
                        </a>
                        <a href="#" className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-white hover:bg-gray-800/30 rounded-lg italic group">
                            <span className="w-4 h-4 mr-3" />
                            + Nouveau chapitre
                        </a>
                    </div>
                </div>
            </nav>

            {/* Settings Footer */}
            <div className="p-4 border-t border-gray-800 shrink-0">
                <a href="#" className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 rounded-lg hover:text-white hover:bg-gray-800/50 transition-colors">
                    <Settings className="w-5 h-5 mr-3 shrink-0" />
                    Paramètres
                </a>
            </div>
        </div>
    );
}
