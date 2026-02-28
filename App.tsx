
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Deviations } from './components/Deviations';
import { AuditManager } from './components/AuditManager';
import { RiskAssessment } from './components/RiskAssessment';
import { AIAdvisor } from './components/AIAdvisor';
import { Login } from './components/Login';
import { COAManager } from './components/COAManager';
import { IPQCSystem } from './components/IPQCSystem';
import { OOSManagement } from './components/OOSManagement';
import { NotificationSettings } from './components/NotificationSettings';
import { ChangeControl } from './components/ChangeControl';
import { CAPAManager } from './components/CAPAManager';
import { StabilityManager } from './components/StabilityManager';
import { AuditTrail } from './components/AuditTrail';
import { RecallManagement } from './components/RecallManagement';
import { RegulatoryTracker } from './components/RegulatoryTracker';
import { MaterialManager } from './components/MaterialManager';
import { LIMS } from './components/LIMS';
import { WarehouseGDP } from './components/WarehouseGDP';
import { BatchRecordSystem } from './components/BatchRecordSystem';
import { ArchiveManager } from './components/ArchiveManager';
import { Module, User } from './types';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [capaPreFill, setCapaPreFill] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('pharma_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleModuleChange = (module: Module, preFill?: string) => {
    setActiveModule(module);
    if (preFill) setCapaPreFill(preFill);
  };

  const handleLogin = (userData: User) => {
    const userWithEmail = { ...userData, email: userData.email || 'admin@pharmaqualify.com' };
    setUser(userWithEmail);
    localStorage.setItem('pharma_user', JSON.stringify(userWithEmail));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pharma_user');
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'deviations': return <Deviations currentUser={user} onModuleChange={handleModuleChange} />;
      case 'audits': return <AuditManager user={user} />;
      case 'risk': return <RiskAssessment user={user} />;
      case 'oos': return <OOSManagement user={user} />;
      case 'capa': return <CAPAManager user={user} preFillSourceRef={capaPreFill} onClearPreFill={() => setCapaPreFill(null)} />;
      case 'stability': return <StabilityManager user={user} />;
      case 'coa-manager': return <COAManager currentUser={user} />;
      case 'ipqc-comp': return <IPQCSystem />;
      case 'batch-records': return <BatchRecordSystem user={user} />;
      case 'ai-advisor': return <AIAdvisor />;
      case 'notifications': return <NotificationSettings />;
      case 'changes': return <ChangeControl user={user} />;
      case 'audit-trail': return <AuditTrail />;
      case 'recall': return <RecallManagement user={user} />;
      case 'regulatory': return <RegulatoryTracker />;
      case 'inventory': return <MaterialManager />;
      case 'lims': return <LIMS />;
      case 'warehouse': return <WarehouseGDP />;
      case 'archive': return <ArchiveManager />;
      default: return (
        <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-50">
          <span className="text-8xl mb-4">🏗️</span>
          <p className="text-xl font-black uppercase tracking-[8px]">Module Expansion</p>
          <p className="text-sm mt-4 font-bold">Porting regulatory data for module ID: {activeModule}</p>
        </div>
      );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 antialiased overflow-hidden">
      <Layout 
        activeModule={activeModule} 
        onModuleChange={setActiveModule}
        user={user}
        onLogout={handleLogout}
      >
        {renderContent()}
      </Layout>
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default App;
