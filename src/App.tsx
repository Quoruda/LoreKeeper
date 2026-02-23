import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import MainEditor from './components/layout/MainEditor';
import CharacterEditor from './components/layout/CharacterEditor';
import LoreEditor from './components/layout/LoreEditor';
import Statistics from './components/layout/Statistics';
import Settings from './components/layout/Settings';
import AIPanel from './components/layout/AIPanel';
import WelcomeScreen from './components/WelcomeScreen';
import { ProjectProvider, useProject } from './contexts/ProjectContext';

function MainLayout() {
  const { projectPath, viewMode } = useProject();

  if (!projectPath) {
    return null; // ou un spinner
  }

  return (
    <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden selection:bg-primary-500/30">
      <Sidebar projectPath={projectPath} />

      {/* Rendu conditionnel de l'éditeur */}
      {viewMode === 'chapters' && <MainEditor />}
      {viewMode === 'characters' && <CharacterEditor />}
      {viewMode === 'lore' && <LoreEditor />}
      {viewMode === 'statistics' && <Statistics />}
      {viewMode === 'settings' && <Settings />}

      <AIPanel />
    </div>
  );
}

function App() {
  const [projectPath, setProjectPath] = useState<string | null>(null);

  // Si aucun projet n'est ouvert, on affiche l'écran d'accueil
  if (!projectPath) {
    return <WelcomeScreen onProjectOpened={setProjectPath} />;
  }

  // Sinon, on affiche l'éditeur complet enveloppé par le contexte du projet
  return (
    <ProjectProvider projectPath={projectPath}>
      <MainLayout />
    </ProjectProvider>
  );
}

export default App;
