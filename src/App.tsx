import { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import MainEditor from './components/layout/MainEditor';
import AIPanel from './components/layout/AIPanel';
import WelcomeScreen from './components/WelcomeScreen';
import { ProjectProvider } from './contexts/ProjectContext';

function App() {
  const [projectPath, setProjectPath] = useState<string | null>(null);

  // Si aucun projet n'est ouvert, on affiche l'écran d'accueil
  if (!projectPath) {
    return <WelcomeScreen onProjectOpened={setProjectPath} />;
  }

  // Sinon, on affiche l'éditeur complet enveloppé par le contexte du projet
  return (
    <ProjectProvider projectPath={projectPath}>
      <div className="flex h-screen w-screen overflow-hidden text-gray-100 bg-gray-900 select-none">
        <Sidebar projectPath={projectPath} />
        <MainEditor />
        <AIPanel />
      </div>
    </ProjectProvider>
  );
}

export default App;
