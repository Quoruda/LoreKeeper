import Sidebar from './components/layout/Sidebar';
import MainEditor from './components/layout/MainEditor';
import AIPanel from './components/layout/AIPanel';

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden text-gray-100 bg-gray-900 select-none">
      <Sidebar />
      <MainEditor />
      <AIPanel />
    </div>
  );
}

export default App;
