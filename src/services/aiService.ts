import type { ProjectSettings } from '../types';

export interface AIResponse {
    text: string;
    error?: string;
    isTimeout?: boolean;
}

export const generateWithMistral = async (
    prompt: string,
    settings: ProjectSettings,
    systemPrompt: string = "",
    temperature: number = 0.7
): Promise<AIResponse> => {
    if (!settings.mistralApiKey || settings.aiProvider === 'none') {
        return { text: "", error: "L'assistance IA n'est pas configurée. Veuillez renseigner votre clé API dans les paramètres." };
    }

    // Sécurité: Si Mistral ne répond pas après 30 secondes, on annule la requête pour éviter de figer l'app
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.mistralApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: settings.mistralModel || 'open-mistral-nemo',
                temperature: temperature,
                messages: [
                    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                    { role: 'user', content: prompt }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Interprétation des codes d'erreur communs
            if (response.status === 401) return { text: "", error: "Clé API invalide ou expirée." };
            if (response.status === 429) return { text: "", error: "Trop de requêtes envoyées à Mistral simultanément. Veuillez patienter." };
            if (response.status === 402) return { text: "", error: "Solde de crédit Mistral insuffisant." };
            return { text: "", error: `Erreur du serveur IA (Code ${response.status})` };
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";

        return { text };
    } catch (error: unknown) {
        clearTimeout(timeoutId);

        // Gestion de l'erreur réseau ou du Timeout
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return { text: "", error: "Le serveur Mistral a mis trop de temps à répondre (Timeout). Veuillez réessayer.", isTimeout: true };
            }
            return { text: "", error: `Erreur réseau : ${error.message}. Vérifiez votre connexion internet.` };
        }

        return { text: "", error: "Erreur réseau inconnue. Vérifiez votre connexion internet." };
    }
};
