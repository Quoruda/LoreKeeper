#!/bin/bash

echo "🚀 Démarrage de la compilation de LoreKeeper..."

# Installation des dépendances pour s'assurer que tout est à jour
echo "📦 Vérification/Installation des dépendances NPM..."
npm install

# Lancer le build Tauri (ça s'occupe de TypeScript, Vite build, et de la compilation Rust native)
echo "⚙️ Compilation de l'exécutable (cela peut prendre quelques minutes au premier lancement)..."
npx tauri build

echo "✅ Compilation terminée !"
echo "📁 Ton exécutable final est disponible dans le dossier : src-tauri/target/release/bundle/"
