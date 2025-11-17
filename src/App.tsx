import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { DBProvider, useDB } from './lib/db-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { PackageCheck, ListChecks, Layers, Settings } from 'lucide-react';
import EquipmentPage from './pages/EquipmentPage';
import ModulesPage from './pages/ModulesPage';
import ChecklistsPage from './pages/ChecklistsPage';
import SettingsPage from './pages/SettingsPage';

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-lg text-muted-foreground">CampCheck 로딩 중...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="p-6 max-w-md">
        <h2 className="text-xl font-bold text-destructive mb-2">오류 발생</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </Card>
    </div>
  );
}

function MainApp() {
  const { isInitialized, error } = useDB();
  const [activeTab, setActiveTab] = useState('checklists');

  if (error) return <ErrorScreen error={error} />;
  if (!isInitialized) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <PackageCheck className="w-8 h-8" />
            CampCheck
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            캠핑 장비 관리 시스템
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="checklists" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              <span className="hidden sm:inline">체크리스트</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4" />
              <span className="hidden sm:inline">장비관리</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">모듈</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">설정</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklists">
            <ChecklistsPage />
          </TabsContent>

          <TabsContent value="equipment">
            <EquipmentPage />
          </TabsContent>

          <TabsContent value="modules">
            <ModulesPage />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPage />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DBProvider>
        <MainApp />
      </DBProvider>
    </ThemeProvider>
  );
}
