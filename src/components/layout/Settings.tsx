import { useState } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import { Key, Bot, Settings2, PlugZap, ShieldAlert, CheckCircle2, Globe } from 'lucide-react';

export default function Settings() {
    const { settings, updateSettings } = useProject();
    const [apiKey, setApiKey] = useState(settings.mistralApiKey);
    const [model, setModel] = useState(settings.mistralModel);
    const [language, setLanguage] = useState(settings.language || 'fr');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateSettings({
            mistralApiKey: apiKey,
            mistralModel: model,
            language: language
        });
        // Feedback visuel court ?
        setTestStatus('idle');
        setTestMessage('');
    };

    const testConnection = async () => {
        if (!apiKey) {
            setTestStatus('error');
            setTestMessage('Veuillez entrer une clé API d\'abord.');
            return;
        }

        setTestStatus('testing');
        setTestMessage('Connexion en cours...');

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes max

            const response = await fetch('https://api.mistral.ai/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                setTestStatus('success');
                setTestMessage('Connexion réussie ! API fonctionnelle.');
            } else if (response.status === 401) {
                setTestStatus('error');
                setTestMessage('Clé API invalide ou non autorisée (401).');
            } else {
                setTestStatus('error');
                setTestMessage(`Erreur de l'API (${response.status} ${response.statusText}).`);
            }
        } catch (error: any) {
            setTestStatus('error');
            if (error.name === 'AbortError') {
                setTestMessage('Délai dépassé (Timeout). Le réseau est trop lent ou bloqué.');
            } else {
                setTestMessage(`Impossible de joindre le serveur : ${error.message}`);
            }
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#0d1117] p-8 lg:p-12 text-gray-200">
            <div className="max-w-4xl mx-auto space-y-10 pb-24">
                {/* En-tête de la page */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                        <Settings2 className="w-8 h-8 mr-3 text-primary-500" />
                        Configurations & Paramètres
                    </h1>
                    <p className="text-gray-400">Gérez vos préférences générales et les intégrations de LoreKeeper.</p>
                </div>

                <div className="space-y-8">
                    {/* Section Intelligence Artificielle */}
                    <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <Bot className="w-32 h-32 text-indigo-500" />
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                                <Bot className="w-5 h-5 mr-3 text-indigo-400" />
                                Assistance IA (Mistral)
                            </h2>
                            <p className="text-sm text-gray-400 mb-8 max-w-2xl">
                                Configurez l'accès à l'API Mistral pour générer des idées, résumer vos chapitres ou
                                structurer vos fiches personnages. <strong className="text-gray-300">Votre clé est stockée uniquement en local sur votre ordinateur.</strong>
                            </p>

                            <form onSubmit={handleSave} className="space-y-6 max-w-xl">
                                {/* Clé API */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 flex items-center">
                                        <Key className="w-4 h-4 mr-2" />
                                        Clé API Mistral
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="sk-..."
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full bg-[#0a0d12] border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Vous pouvez obtenir une clé d'API sur <a href="https://console.mistral.ai" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">console.mistral.ai</a>.
                                    </p>
                                </div>

                                {/* Choix du modèle */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Modèle Préféré
                                    </label>
                                    <select
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        className="w-full bg-[#0a0d12] border border-gray-700/50 rounded-lg px-4 py-2.5 text-white focus:border-indigo-500/50 outline-none appearance-none"
                                    >
                                        <option value="open-mistral-nemo">Mistral Nemo (Moteur par défaut, rapide et standard)</option>
                                        <option value="mistral-small-latest">Mistral Small (Très bas coût)</option>
                                        <option value="mistral-large-latest">Mistral Large (Compréhension maximum, plus lent)</option>
                                    </select>
                                </div>

                                <div className="pt-4 flex items-center space-x-4">
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
                                    >
                                        Sauvegarder les paramètres
                                    </button>

                                    <button
                                        type="button"
                                        onClick={testConnection}
                                        disabled={testStatus === 'testing' || !apiKey}
                                        className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700/50 text-white text-sm font-medium rounded-lg transition-all flex items-center"
                                    >
                                        {testStatus === 'testing' ? (
                                            <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2" />
                                        ) : (
                                            <PlugZap className="w-4 h-4 mr-2" />
                                        )}
                                        Tester la connexion
                                    </button>
                                </div>

                                {/* Résultat du test */}
                                {testStatus !== 'idle' && (
                                    <div className={`mt-4 p-4 rounded-lg flex items-start space-x-3 text-sm border
                                        ${testStatus === 'success' ? 'bg-emerald-900/20 border-emerald-800/50 text-emerald-400' : ''}
                                        ${testStatus === 'error' ? 'bg-red-900/20 border-red-800/50 text-red-400' : ''}
                                        ${testStatus === 'testing' ? 'bg-gray-800/50 border-gray-700 text-gray-300' : ''}
                                    `}>
                                        {testStatus === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                                        {testStatus === 'error' && <ShieldAlert className="w-5 h-5 shrink-0" />}
                                        {testStatus === 'testing' && <span className="w-5 h-5 flex animate-pulse shrink-0">📡</span>}
                                        <span>{testMessage}</span>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Section Préférences Générales */}
                    <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <Globe className="w-32 h-32 text-green-500" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                                <Globe className="w-5 h-5 mr-3 text-green-400" />
                                Préférences Générales
                            </h2>
                            <form onSubmit={handleSave} className="space-y-6 max-w-xl">
                                {/* Choix de la langue */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Langue de l'interface
                                    </label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full bg-[#0a0d12] border border-gray-700/50 rounded-lg px-4 py-2.5 text-white focus:border-green-500/50 outline-none appearance-none"
                                    >
                                        <option value="fr">Français</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex items-center space-x-4">
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-green-900/20 transition-all active:scale-95"
                                    >
                                        Sauvegarder les préférences
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
