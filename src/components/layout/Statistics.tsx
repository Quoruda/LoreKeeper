import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, AreaChart, Area } from 'recharts';
import { useState, useEffect } from 'react';
import { Target, TrendingUp, BookOpen, Clock, BarChart2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function Statistics() {
    const { t } = useTranslation();
    const { projectPath, stats, updateDailyGoal, chapters } = useProject();
    const [goalInput, setGoalInput] = useState(stats.dailyGoal.toString());
    const [isEditingGoal, setIsEditingGoal] = useState(false);

    // Nouveaux états pour le volume global
    const [chapterStats, setChapterStats] = useState<{ name: string, words: number }[]>([]);
    const [totalManuscriptWords, setTotalManuscriptWords] = useState(0);

    useEffect(() => {
        let isCancelled = false;
        const loadChapterStats = async () => {
            const newStats = [];
            let total = 0;
            for (const chapter of chapters) {
                try {
                    const content: string = await invoke('read_file', {
                        path: `${projectPath}/chapters/${chapter.id}`
                    });
                    const text = content.trim();
                    const words = text ? text.split(/[\s\n\r]+/).filter(w => w.length > 0).length : 0;
                    newStats.push({ name: chapter.title, words });
                    total += words;
                } catch (error) {
                    console.error("Erreur read_file stats:", error);
                    newStats.push({ name: chapter.title, words: 0 });
                }
            }
            if (!isCancelled) {
                setChapterStats(newStats);
                setTotalManuscriptWords(total);
            }
        };
        if (projectPath && chapters.length > 0) {
            loadChapterStats();
        } else {
            Promise.resolve().then(() => {
                if (!isCancelled) {
                    setChapterStats([]);
                    setTotalManuscriptWords(0);
                }
            });
        }
        return () => { isCancelled = true; };
    }, [projectPath, chapters]);

    const handleGoalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const goal = parseInt(goalInput);
        if (!isNaN(goal) && goal > 0) {
            updateDailyGoal(goal);
            setIsEditingGoal(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const wordsToday = stats.history[today] || 0;
    const progress = Math.min(100, Math.round((wordsToday / stats.dailyGoal) * 100));

    // Préparer les données pour le graphique (14 derniers jours)
    const chartData = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const displayDate = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });

        chartData.push({
            date: displayDate,
            words: stats.history[dateStr] || 0
        });
    }


    // Calcul de la moyenne sur les 14 jours
    const averageWords = Math.round(chartData.reduce((acc, curr) => acc + curr.words, 0) / 14);

    return (
        <div className="flex-1 overflow-y-auto bg-[#0d1117] p-8 lg:p-12 text-gray-200">
            <div className="max-w-5xl mx-auto space-y-12 pb-24">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('statistics.title')}</h1>
                    <p className="text-gray-400">{t('statistics.subtitle')}</p>
                </div>

                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Objectif du jour */}
                    <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Target className="w-16 h-16 text-primary-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">{t('statistics.dailyGoal')}</h3>
                        <div className="flex items-end space-x-2">
                            <span className="text-4xl font-bold text-white">{wordsToday}</span>
                            <span className="text-gray-500 mb-1">/ {stats.dailyGoal} {t('statistics.words')}</span>
                        </div>

                        {/* Barre de progression */}
                        <div className="mt-4 h-2 bg-gray-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="mt-4 flex justify-between items-center text-sm">
                            <span className="text-primary-400 font-medium">{progress}% {t('statistics.achieved')}</span>
                            {isEditingGoal ? (
                                <form onSubmit={handleGoalSubmit} className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        value={goalInput}
                                        onChange={(e) => setGoalInput(e.target.value)}
                                        className="w-20 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white outline-none focus:border-primary-500"
                                    />
                                    <button type="submit" className="text-green-400 hover:text-green-300">OK</button>
                                </form>
                            ) : (
                                <button onClick={() => setIsEditingGoal(true)} className="text-gray-500 hover:text-gray-300 underline underline-offset-2">{t('statistics.editGoal')}</button>
                            )}
                        </div>
                    </div>

                    {/* Moyenne */}
                    <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp className="w-16 h-16 text-indigo-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">{t('statistics.average')}</h3>
                        <div className="flex items-end space-x-2">
                            <span className="text-4xl font-bold text-white">{averageWords}</span>
                            <span className="text-gray-500 mb-1">{t('statistics.wordsPerDay')}</span>
                        </div>
                    </div>

                    {/* Contenu Global */}
                    <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <BookOpen className="w-16 h-16 text-emerald-500" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Volume du Manuscrit</h3>
                        <div className="flex items-end space-x-2">
                            <span className="text-4xl font-bold text-white">{totalManuscriptWords}</span>
                            <span className="text-gray-500 mb-1">{t('statistics.words')}</span>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">Soit environ {Math.ceil(totalManuscriptWords / 250)} pages</p>
                    </div>
                </div>

                {/* Graphique d'activité */}
                <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                            <Clock className="w-5 h-5 mr-3 text-primary-400" />
                            {t('statistics.historyTitle')}
                        </h3>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: '#374151', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                                />
                                <ReferenceLine y={stats.dailyGoal} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
                                <Bar
                                    dataKey="words"
                                    name={t('statistics.wordsWritten')}
                                    fill="#818cf8"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={50}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Graphique de taille des chapitres */}
                {chapterStats.length > 0 && (
                    <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-semibold text-white flex items-center">
                                <BarChart2 className="w-5 h-5 mr-3 text-emerald-400" />
                                Longueur des Chapitres
                            </h3>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chapterStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#9ca3af"
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                        labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                                    />
                                    <Area type="monotone" dataKey="words" name="Mots" stroke="#10b981" fillOpacity={1} fill="url(#colorWords)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
