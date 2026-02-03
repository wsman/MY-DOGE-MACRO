import MainLayout from './components/layout/MainLayout';
import ServiceStatus from './components/ServiceStatus';
import { CommandPalette } from './components/commands/CommandPalette';
import { ServerSettings } from './components/ServerSettings';

function App() {
  return (
    <div className="relative h-screen w-screen bg-black">
      {/* 核心布局层 */}
      <MainLayout />
      
      {/* 命令面板 */}
      <CommandPalette />
      
      {/* 悬浮状态栏 (临时方案，后续移入 Status Bar) */}
      <div className="absolute top-1 right-1 z-50 flex gap-2">
        <ServerSettings />
        <ServiceStatus />
      </div>
    </div>
  );
}

export default App;