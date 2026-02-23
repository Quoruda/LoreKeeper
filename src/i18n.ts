import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "welcome": {
                "title": "Select the LoreKeeper project folder",
                "description": "Select or enter the path to your book's folder.",
                "pathLabel": "Project folder path",
                "pathPlaceholder": "/home/user/Documents/MyBook",
                "browse": "Browse",
                "openBtn": "Open project",
                "fallbackDesc": "If the Browse button does not work, you can directly paste the folder's absolute path in the text field.",
                "errorNative": "Error during native dialog:",
                "errorInit": "Initialization error:",
                "errorEmptyWebkit": "Unable to extract full folder path from local browser. Please type the absolute path manually.",
                "promptPath": "Enter the full folder path (ex: /home/user/Desktop/Book):"
            },
            "sidebar": {
                "appName": "LoreKeeper",
                "newProjectText": "New Project",
                "nav": {
                    "chapters": "Chapters",
                    "characters": "Characters",
                    "lore": "Lore",
                    "statistics": "Statistics"
                },
                "currentBook": "Current Book",
                "newChapter": "New chapter",
                "chapterNamePlaceholder": "Chapter name...",
                "newCharacter": "New character",
                "charNamePlaceholder": "Character name...",
                "newLore": "New lore entry",
                "loreNamePlaceholder": "Entry name...",
                "settings": "Settings",
                "errCreate": "Unable to create file:"
            },
            "editor": {
                "saving": "Saving...",
                "saved": "Saved",
                "noChapter": "No chapter selected",
                "noChapterDesc": "Select a chapter in the sidebar or create a new one to start writing.",
                "placeholder": "Write your story here..."
            },
            "charEditor": {
                "title": "Character Profile",
                "noSelection": "No character selected. Choose one from the sidebar or create a new one.",
                "nameLabel": "Name",
                "namePlaceholder": "Character's name...",
                "roleLabel": "Role",
                "rolePlaceholder": "Protagonist, Antagonist, etc.",
                "descLabel": "General Description",
                "descPlaceholder": "Write a summary of the character...",
                "appearanceLabel": "Appearance",
                "appearancePlaceholder": "Physical details, clothing, distinguishing features...",
                "personalityLabel": "Personality",
                "personalityPlaceholder": "Traits, flaws, motivations..."
            },
            "loreEditor": {
                "title": "Lore Entry",
                "noSelection": "No entry selected. Choose one from the sidebar or create a new one.",
                "nameLabel": "Title",
                "namePlaceholder": "Title of the entry...",
                "categoryLabel": "Category",
                "categoryPlaceholder": "Location, Artifact, Event, etc.",
                "descLabel": "Content & Details",
                "descPlaceholder": "Write the details of this lore entry here..."
            },
            "aipanel": {
                "title": "AI Reader",
                "syncWarningTitle": "Desynchronized",
                "syncWarning": "Chapter 1 has been modified. Notes for subsequent chapters might be outdated.",
                "updateAnalysis": "Generate analysis",
                "notesTitle": "Reading Notes",
                "note1Title": "Plot Summary",
                "note1Desc": "Introduction of Elara's character waking up. An atmosphere of anticipation for a major event is established.",
                "note2Title": "Characters",
                "note2Desc": "Elara: Seems used to a modest environment (worn floorboards). Has striking dreams."
            },
            "statistics": {
                "title": "Dashboard",
                "subtitle": "Track your project's progress and statistics",
                "dailyGoal": "Daily Goal",
                "wordsPerDay": "words / day",
                "words": "words",
                "achieved": "achieved",
                "editGoal": "Edit Goal",
                "average": "Average (14d)",
                "projectVolume": "Project Volume",
                "filesCreated": "files created",
                "chapters": "chapters",
                "characters": "characters",
                "lore": "lore",
                "historyTitle": "Writing History",
                "wordsWritten": "Words written"
            }
        }
    },
    fr: {
        translation: {
            "welcome": {
                "title": "Sélectionner le dossier du projet LoreKeeper",
                "description": "Sélectionnez ou indiquez le chemin vers le dossier de votre livre.",
                "pathLabel": "Chemin du dossier projet",
                "pathPlaceholder": "/home/audrick/Documents/MonLivre",
                "browse": "Parcourir",
                "openBtn": "Ouvrir le projet",
                "fallbackDesc": "Si le bouton Parcourir ne fonctionne pas, vous pouvez directement coller le chemin absolu du dossier dans le champ de texte.",
                "errorNative": "Erreur de dialogue natif:",
                "errorInit": "Erreur d'initialisation:",
                "errorEmptyWebkit": "Impossible d'extraire le chemin complet du dossier depuis le navigateur local. Veuillez écrire le chemin absolu manuellement.",
                "promptPath": "Entrez le chemin complet du dossier (ex: /home/audrick/Bureau/Livre):"
            },
            "sidebar": {
                "appName": "LoreKeeper",
                "newProjectText": "Nouveau Projet",
                "nav": {
                    "chapters": "Chapitres",
                    "characters": "Personnages",
                    "lore": "Lore",
                    "statistics": "Statistiques"
                },
                "currentBook": "Livre Actuel",
                "newChapter": "Nouveau chapitre",
                "chapterNamePlaceholder": "Nom du chapitre...",
                "newCharacter": "Nouveau personnage",
                "charNamePlaceholder": "Nom du personnage...",
                "newLore": "Nouvelle entrée",
                "loreNamePlaceholder": "Nom de l'entrée...",
                "settings": "Paramètres",
                "errCreate": "Impossible de créer le fichier:"
            },
            "editor": {
                "saving": "Sauvegarde en cours...",
                "saved": "Sauvegardé",
                "noChapter": "Aucun chapitre sélectionné",
                "noChapterDesc": "Sélectionnez ou créez un chapitre pour commencer à écrire.",
                "placeholder": "Écrivez votre histoire ici..."
            },
            "charEditor": {
                "title": "Fiche Personnage",
                "noSelection": "Aucun personnage sélectionné. Choisissez-en un ou créez-en un nouveau.",
                "nameLabel": "Nom",
                "namePlaceholder": "Nom complet...",
                "roleLabel": "Rôle",
                "rolePlaceholder": "Protagoniste, Antagoniste, Allié...",
                "descLabel": "Description Manuelle",
                "descPlaceholder": "Décrivez ce personnage dans les grandes lignes...",
                "appearanceLabel": "Apparence Physique",
                "appearancePlaceholder": "Traits, cicatrices, style vestimentaire...",
                "personalityLabel": "Personnalité & Caractère",
                "personalityPlaceholder": "Défauts, qualités, tiques psychologiques..."
            },
            "loreEditor": {
                "title": "Fiche Univers",
                "noSelection": "Aucune entrée sélectionnée. Choisissez-en une ou créez-en une nouvelle.",
                "nameLabel": "Titre",
                "namePlaceholder": "Titre officiel de l'entrée...",
                "categoryLabel": "Catégorie",
                "categoryPlaceholder": "Lieu, Artefact, Espèce, Évènement...",
                "descLabel": "Description Détaillée",
                "descPlaceholder": "Consignez ici tous les détails de cet élément d'univers..."
            },
            "aipanel": {
                "title": "Lecteur IA",
                "syncWarningTitle": "Désynchronisation",
                "syncWarning": "Le chapitre 1 a été modifié. Les notes des chapitres suivants pourraient être obsolètes.",
                "updateAnalysis": "Générer l'analyse",
                "notesTitle": "Notes de lecture",
                "note1Title": "Résumé de l'intrigue",
                "note1Desc": "Présentation du personnage d'Elara qui se réveille. Une ambiance d'anticipation pour un évènement important est mise en place.",
                "note2Title": "Personnages",
                "note2Desc": "Elara : Semble habituée à un environnement modeste (plancher usé). Fait des rêves marquants."
            },
            "statistics": {
                "title": "Tableau de bord",
                "subtitle": "Suivi et statistiques de votre projet",
                "dailyGoal": "Objectif Quotidien",
                "wordsPerDay": "mots / jour",
                "words": "mots",
                "achieved": "atteint",
                "editGoal": "Modifier l'objectif",
                "average": "Moyenne (14j)",
                "projectVolume": "Volume du Projet",
                "filesCreated": "fichiers créés",
                "chapters": "chapitres",
                "characters": "personnages",
                "lore": "lore",
                "historyTitle": "Historique d'écriture",
                "wordsWritten": "Mots écrits"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en', // Set English as the default fallback
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
