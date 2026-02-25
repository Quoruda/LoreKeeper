import { useState } from 'react';
import { BrainCircuit, RefreshCw, Loader2, AlertTriangle, MessageSquare, MessageCircle, FileText, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import { invoke } from '@tauri-apps/api/core';
import { generateWithMistral } from '../../services/aiService';

export default function AIPanel() {
    const { t } = useTranslation();
    const { projectPath, currentChapter, chapters, viewMode, settings, aiNotes, saveAiNotes } = useProject();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    type AITab = 'analysis' | 'suggestion';
    const [activeTab, setActiveTab] = useState<AITab>('analysis');

    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionResult, setSuggestionResult] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState("");

    const isMistralReady = settings.aiProvider !== 'none' && settings.mistralApiKey;
    const currentNoteData = currentChapter ? aiNotes[currentChapter] : null;
    const currentNotes = currentNoteData ? currentNoteData.notes : [];

    // --- LOGIQUE DE CASCADE & HISTORIQUE ---
    let currentChapterData = null;
    let currentIndex = -1;
    let previousChapter = null;

    if (currentChapter) {
        currentChapterData = chapters.find(c => c.id === currentChapter);
        currentIndex = chapters.findIndex(c => c.id === currentChapter);
        previousChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
    }

    const previousNoteData = previousChapter ? aiNotes[previousChapter.id] : null;

    let isOutdated = false;
    let outdatedReason = '';

    if (currentNoteData) {
        if (currentChapterData?.lastModified && currentChapterData.lastModified > currentNoteData.updatedAt) {
            isOutdated = true;
            outdatedReason = "Ce chapitre a été modifié depuis votre dernière analyse.";
        } else if (previousChapter?.lastModified && previousChapter.lastModified > currentNoteData.updatedAt) {
            isOutdated = true;
            outdatedReason = "Le chapitre précédent a été modifié, ce qui peut impacter la continuité.";
        } else if (previousNoteData && previousNoteData.updatedAt > currentNoteData.updatedAt) {
            isOutdated = true;
            outdatedReason = "Les notes du chapitre précédent ont été recalculées récemment.";
        }
    }

    const handleUpdateAnalysis = async () => {
        if (!projectPath || !currentChapter || !isMistralReady) return;

        setIsLoading(true);
        setError(null);

        try {
            const content = await invoke<string>('read_file', {
                path: `${projectPath}/chapters/${currentChapter}`
            });

            if (!content.trim()) {
                setError("Le chapitre est vide.");
                setIsLoading(false);
                return;
            }

            // Construction d'une mémoire agrégée par Titre depuis le début du livre jusqu'au chapitre précédent
            const aggregatedHistory: Record<string, string[]> = {};
            if (currentIndex > 0) {
                // On parcourt tous les chapitres AVANT l'actuel
                for (let i = 0; i < currentIndex; i++) {
                    const chapId = chapters[i].id;
                    const chapNotesData = aiNotes[chapId];
                    if (chapNotesData && chapNotesData.notes) {
                        chapNotesData.notes.forEach(note => {
                            if (!aggregatedHistory[note.title]) {
                                aggregatedHistory[note.title] = [];
                            }
                            aggregatedHistory[note.title].push(note.description);
                        });
                    }
                }
            }

            let previousContext = "";
            const historicalKeys = Object.keys(aggregatedHistory);
            if (historicalKeys.length > 0) {
                previousContext = `\n\nVoici le CONTEXTE HISTORIQUE CONSOLIDÉ des chapitres précédents. Ne répète jamais ce qui est écrit ici. Utilise-le uniquement pour comprendre l'état du monde avant de lire le nouveau texte :\n`;
                historicalKeys.forEach(title => {
                    // On joint l'historique d'une entité
                    previousContext += `- [${title}] : ${aggregatedHistory[title].join(' ')}\n`;
                });
            }

            const systemPrompt = `Tu es l'assistant de l'application LoreKeeper. Ta tâche est de jouer le rôle d'un 'lecteur bêta' méticuleux.
Lis le texte fourni et extrait UNIQUEMENT CE QUE TU COMPRENDS DE NOUVEAU dans ce chapitre.${previousContext}

INSTRUCTIONS STRICTES :
1. Crée des notes thématiques, chacune ayant un "title" court et identifiant (ex: "Arthur", "La Cité d'Or", "Épée maudite").
2. Si un "title" existe déjà dans le contexte historique fourni, réutilise EXACTEMENT la même orthographe pour maintenir la cohérence.
3. Adopte la perspective du LECTEUR : Ne prends pas l'information comme une vérité absolue. Note "ce que tu comprends" (ex: "Il semble souffrir d'une allergie", "La ville donne une impression d'abandon").
4. Exprime des DOUTES ou des déductions si le texte n'est pas explicite (ex: "Il est sous-entendu que...", "Peut-être une trahison de sa part ?").
5. Ne décris QUE ce qui relève de NOUVEAU dans ce chapitre pour ce titre. Si le personnage n'évolue pas, ne fais pas de note sur lui.
6. Crée OBLIGATOIREMENT une note ayant exactement pour "title": "Événements du chapitre" qui résumera l'action brute principale en 2 ou 3 phrases.
7. Sois extrêmement concis. Pas de longues phrases, va droit au but.
8. En plus des notes, tu DOIS rédiger un 'Avis Global' sur le chapitre (son ambiance, ce qui fonctionne bien, l'évaluation de l'intrigue). Si tu repères une confusion mineure signale-le, mais l'avis doit prioritairement rester amical, encourageant et pertinent. Fais-le en un court paragraphe !

Tu DOIS RÉPONDRE UNIQUEMENT avec un objet JSON strictement valide avec le format suivant:
{
  "review": "Ton avis global et critique sur ce chapitre...",
  "notes": [
    { "title": "Nom du Sujet (Personnage, Ville, Objet) ou 'Événements du chapitre'", "description": "Ce qu'on a appris de nouveau à ce sujet dans ce chapitre." }
  ]
}`;

            const response = await generateWithMistral(content, settings, systemPrompt, 0.3); // temperature plus basse pour du JSON strict

            if (response.error) {
                setError(response.error);
                setIsLoading(false);
                return;
            }

            try {
                // Nettoyage au cas où Mistral rajoute des backticks markdown (```json ... ```)
                let jsonStr = response.text.trim();
                const jsonMatch = jsonStr.match(/\{[\s\S]*\}/); // On extrait le premier bloc ressemblant à un objet JSON

                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }

                const parsed = JSON.parse(jsonStr);
                if (parsed.notes && Array.isArray(parsed.notes)) {
                    await saveAiNotes(currentChapter, parsed.notes, parsed.review);
                    setError(null);
                } else {
                    setError("Format de réponse inattendu de l'IA.");
                }
            } catch (jsonError) {
                console.error("Erreur de parsing JSON:", jsonError, response.text);
                setError("Impossible de lire la réponse de l'IA. Essaye un Modèle plus large.");
            }

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur lors de l'analyse locale.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateSuggestion = async (promptType: 'next' | 'character' | 'custom', customText?: string) => {
        if (!projectPath || !currentChapter || !isMistralReady) return;

        setIsSuggesting(true);
        setError(null);
        setSuggestionResult(null);

        try {
            const content = await invoke<string>('read_file', {
                path: `${projectPath}/chapters/${currentChapter}`
            });

            if (!content.trim()) {
                setError("Le chapitre est vide. Écrivez un peu avant de demander des suggestions !");
                setIsSuggesting(false);
                return;
            }

            // Historique RAG: Tous les chapitres d'AVANT
            const aggregatedHistory: Record<string, string[]> = {};
            if (currentIndex > 0) {
                for (let i = 0; i < currentIndex; i++) {
                    const chapId = chapters[i].id;
                    const chapNotesData = aiNotes[chapId];
                    if (chapNotesData && chapNotesData.notes) {
                        chapNotesData.notes.forEach(note => {
                            if (!aggregatedHistory[note.title]) {
                                aggregatedHistory[note.title] = [];
                            }
                            aggregatedHistory[note.title].push(note.description);
                        });
                    }
                }
            }

            let previousContext = "";
            const historicalKeys = Object.keys(aggregatedHistory);
            if (historicalKeys.length > 0) {
                previousContext = `\n[CONTEXTE HISTORIQUE (RESUME DES CHAPITRES PRECEDENTS)]\n`;
                historicalKeys.forEach(title => {
                    previousContext += `- ${title} : ${aggregatedHistory[title].join(' ')}\n`;
                });
            }

            let magicPrompt = "";
            if (promptType === 'next') {
                magicPrompt = "Que va-t-il se passer dans les secondes qui suivent la toute dernière phrase écrite ? Propose simplement 3 idées brèves (action logique, prise de parole, observation) en parfaite continuité avec l'instant présent. Pas de grands rebondissements ou d'événements extraordinaires.";
            } else if (promptType === 'character') {
                magicPrompt = "Comment un personnage (présent ou lié à ce chapitre) pourrait réagir à la situation actuelle d'une manière inattendue mais réaliste ?";
            } else if (promptType === 'custom' && customText) {
                magicPrompt = customText;
            }

            const systemInstruction = `Tu es l'assistant créatif d'un écrivain. Ton but est de l'aider à trouver des idées (brainstorming).
Voici le contexte général de l'histoire jusqu'ici : ${previousContext}

Voici le texte brut du chapitre qu'il est en TRAIN d'écrire :
[TEXTE DU CHAPITRE ACTUEL]
${content}

INSTRUCTIONS : 
- Réponds UNIQUEMENT à la question posée par l'auteur en te basant sur le [TEXTE DU CHAPITRE ACTUEL] et le [CONTEXTE HISTORIQUE].
- Ne fais pas de JSON, réponds directement en Markdown formaté, proprement, de façon créative et pertinente.
- SOIS EXTRÊMEMENT CONCIS. Ne fais jamais de longs paragraphes. Cible l'essentiel.
- Ne rajoute pas d'introduction ("Voici des idées...") ou de conclusion.
- Présente tes idées sous forme de liste à puces ou numérotée si c'est pertinent.`;

            const response = await generateWithMistral(magicPrompt, settings, systemInstruction, 0.8); // température plus haute pour la créativité

            if (response.error) {
                setError(response.error);
            } else {
                setSuggestionResult(response.text);
            }

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erreur inattendue.");
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full shrink-0">
            {/* AI Header */}
            <div className="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
                <BrainCircuit className="w-5 h-5 text-indigo-400 mr-3" />
                <h2 className="text-sm font-semibold text-indigo-100 uppercase tracking-wider">{t('aipanel.title')}</h2>
            </div>

            {/* AI Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {!isMistralReady ? (
                    <div className="text-sm text-gray-500 text-center mt-10 p-4 border border-gray-800/50 rounded-lg">
                        Veuillez configurer l'API Mistral dans les paramètres pour utiliser l'assistance IA.
                    </div>
                ) : !currentChapter || viewMode !== 'chapters' ? (
                    <div className="text-sm text-gray-500 text-center mt-10 p-4">
                        Ouvrez un chapitre pour générer une analyse chronologique de ses événements.
                    </div>
                ) : (
                    <>
                        {/* AI Tabs */}
                        <div className="flex border-b border-gray-800 shrink-0">
                            <button
                                onClick={() => setActiveTab('analysis')}
                                className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'analysis' ? 'text-indigo-400 border-indigo-500 bg-gray-800/20' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                            >
                                Analyse
                            </button>
                            <button
                                onClick={() => setActiveTab('suggestion')}
                                className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'suggestion' ? 'text-indigo-400 border-indigo-500 bg-gray-800/20' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
                            >
                                Suggestions
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Avertissement de désynchronisation (Cascade) */}
                            {isOutdated && activeTab === 'analysis' && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-medium text-amber-400 mb-1">{t('aipanel.syncWarningTitle') || 'Analyse Obsolète'}</p>
                                            <p className="text-xs text-amber-500/70">{outdatedReason}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'analysis' ? (
                                <>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                            <p className="text-xs text-red-400">{error}</p>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <div>
                                        <button
                                            onClick={handleUpdateAnalysis}
                                            disabled={isLoading}
                                            className="w-full flex items-center justify-center py-2.5 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-50 text-indigo-400 text-sm font-medium border border-indigo-500/30 rounded-lg transition-colors group"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                                            )}
                                            {isLoading ? "Analyse en cours..." : t('aipanel.updateAnalysis')}
                                        </button>
                                    </div>

                                    {/* AI Notes */}
                                    {currentNoteData?.review && (
                                        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4 mb-2 shadow-inner">
                                            <h3 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center">
                                                <MessageSquare className="w-4 h-4 mr-2" />
                                                Avis Critique
                                            </h3>
                                            <p className="text-sm text-indigo-100/80 italic leading-relaxed">
                                                "{currentNoteData.review}"
                                            </p>
                                        </div>
                                    )}

                                    {currentNotes.length > 0 && (
                                        <div className="space-y-6">
                                            {/* Zone d'Action (Événements du chapitre) */}
                                            {(() => {
                                                const actionNote = currentNotes.find(n => n.title.toLowerCase().includes('événement') || n.title.toLowerCase().includes('evenement'));
                                                if (actionNote) {
                                                    return (
                                                        <div>
                                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Dans ce chapitre</h3>
                                                            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 shadow-sm">
                                                                <p className="text-sm text-indigo-200 leading-relaxed font-medium">{actionNote.description}</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}

                                            {/* Zone Lore & Personnages */}
                                            {(() => {
                                                const loreNotes = currentNotes.filter(n => !n.title.toLowerCase().includes('événement') && !n.title.toLowerCase().includes('evenement'));
                                                if (loreNotes.length > 0) {
                                                    return (
                                                        <div>
                                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Nouvelles connaissances</h3>
                                                            <div className="space-y-3">
                                                                {loreNotes.map((note, idx) => (
                                                                    <div key={idx} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 shadow-sm hover:border-gray-500/30 transition-colors">
                                                                        <h4 className="text-xs font-semibold text-gray-300 mb-1.5">{note.title}</h4>
                                                                        <p className="text-xs text-gray-400 leading-relaxed">{note.description}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    )}

                                    {currentNotes.length === 0 && !isLoading && !error && (
                                        <p className="text-xs text-gray-500 text-center italic mt-4">
                                            Aucune analyse générée pour ce chapitre.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Suggestion Mode */}
                                    <div className="space-y-4">
                                        <p className="text-xs text-gray-400 leading-relaxed mb-6">
                                            Besoin d'inspiration ? Je peux lire ce chapitre en cours avec le reste de vos archives et vous proposer des idées.
                                        </p>

                                        {error && (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                                <p className="text-xs text-red-400">{error}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 gap-3">
                                            <button
                                                onClick={() => handleGenerateSuggestion('next')}
                                                disabled={isSuggesting}
                                                className="w-full text-left p-3 rounded-lg border border-indigo-500/20 bg-indigo-900/10 hover:bg-indigo-900/30 hover:border-indigo-500/40 transition-colors disabled:opacity-50 group flex items-start"
                                            >
                                                <MessageCircle className="w-5 h-5 text-indigo-400 mr-3 mt-0.5 shrink-0" />
                                                <div>
                                                    <h4 className="text-sm font-medium text-indigo-300">Et ensuite ?</h4>
                                                    <p className="text-xs text-indigo-200/60 mt-1">Imagine 3 pistes pour la suite directe de l'histoire.</p>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => handleGenerateSuggestion('character')}
                                                disabled={isSuggesting}
                                                className="w-full text-left p-3 rounded-lg border border-emerald-500/20 bg-emerald-900/10 hover:bg-emerald-900/30 hover:border-emerald-500/40 transition-colors disabled:opacity-50 group flex items-start"
                                            >
                                                <FileText className="w-5 h-5 text-emerald-400 mr-3 mt-0.5 shrink-0" />
                                                <div>
                                                    <h4 className="text-sm font-medium text-emerald-300">Réaction des persos</h4>
                                                    <p className="text-xs text-emerald-200/60 mt-1">Comment pourraient réagir les personnages à cette situation ?</p>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                                            <h4 className="text-sm font-medium text-gray-400">Demande libre</h4>
                                            <div className="flex flex-col gap-2">
                                                <textarea
                                                    value={customPrompt}
                                                    onChange={e => setCustomPrompt(e.target.value)}
                                                    placeholder="Posez une question à l'IA (ex: Comment introduire un nouveau personnage ici ?)..."
                                                    className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500/70 outline-none focus:border-indigo-500/50 transition-colors resize-none h-24 shadow-inner"
                                                />
                                                <button
                                                    onClick={() => handleGenerateSuggestion('custom', customPrompt)}
                                                    disabled={isSuggesting || !customPrompt.trim()}
                                                    className="w-full flex items-center justify-center py-2.5 px-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-700 hover:border-gray-500"
                                                >
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Envoyer la demande
                                                </button>
                                            </div>
                                        </div>

                                        {isSuggesting && (
                                            <div className="flex flex-col items-center justify-center p-8 text-indigo-400">
                                                <Loader2 className="w-6 h-6 animate-spin mb-3" />
                                                <span className="text-sm font-medium">Réflexion scénaristique...</span>
                                                <span className="text-xs text-indigo-400/60 mt-2 text-center">Cela peut prendre jusqu'à 20 secondes selon la taille de votre univers.</span>
                                            </div>
                                        )}

                                        {suggestionResult && !isSuggesting && (
                                            <div className="bg-gray-800/80 border border-gray-700/80 rounded-lg p-5 mt-6 shadow-inner">
                                                <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                    {suggestionResult}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
