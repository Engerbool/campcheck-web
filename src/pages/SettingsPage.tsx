import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { db } from '@/lib/db-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Info, Download, Upload, Copy, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';
import { exportData, importData, openFileDialog, exportDataToClipboard, importDataFromClipboard } from '@/lib/data-export';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const settings = await db.getSettings();
      setNotifications(settings.notifications);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async function handleNotificationsChange(checked: boolean) {
    try {
      setNotifications(checked);
      const settings = await db.getSettings();
      await db.updateSettings({ ...settings, notifications: checked });
      toast.success('설정이 저장되었습니다');
    } catch (error) {
      toast.error('설정 저장에 실패했습니다');
    }
  }

  async function handleExportData() {
    try {
      await exportData();
      toast.success('데이터가 성공적으로 내보내졌습니다');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('데이터 내보내기에 실패했습니다');
    }
  }

  async function handleCopyToClipboard() {
    try {
      await exportDataToClipboard();
      toast.success('데이터가 클립보드에 복사되었습니다\n카톡 등으로 전송할 수 있습니다');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('클립보드 복사에 실패했습니다');
    }
  }

  async function handleImportData() {
    try {
      const file = await openFileDialog();
      if (!file) {
        return; // User cancelled
      }

      const mode = confirm(
        '기존 데이터를 유지하면서 가져오시겠습니까?\n\n확인: 기존 데이터 유지 (병합)\n취소: 기존 데이터 삭제 후 가져오기 (덮어쓰기)'
      )
        ? 'merge'
        : 'replace';

      await importData(file, mode);
      toast.success('데이터를 성공적으로 가져왔습니다');

      // Reload the page to reflect imported data
      window.location.reload();
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(error instanceof Error ? error.message : '데이터 가져오기에 실패했습니다');
    }
  }

  async function handlePasteFromClipboard() {
    try {
      const mode = confirm(
        '기존 데이터를 유지하면서 가져오시겠습니까?\n\n확인: 기존 데이터 유지 (병합)\n취소: 기존 데이터 삭제 후 가져오기 (덮어쓰기)'
      )
        ? 'merge'
        : 'replace';

      await importDataFromClipboard(mode);
      toast.success('데이터를 성공적으로 가져왔습니다');

      // Reload the page to reflect imported data
      window.location.reload();
    } catch (error) {
      console.error('Paste failed:', error);
      toast.error(error instanceof Error ? error.message : '클립보드에서 가져오기에 실패했습니다');
    }
  }

  async function handleClearData() {
    if (
      !confirm(
        '모든 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?'
      )
    ) {
      return;
    }

    try {
      // Clear all data
      const [equipment, modules, checklists] = await Promise.all([
        db.getAllEquipment(),
        db.getAllModules(),
        db.getAllChecklists(),
      ]);

      for (const eq of equipment) {
        if (eq.id) await db.deleteEquipment(eq.id);
      }

      for (const module of modules) {
        if (module.id) await db.deleteModule(module.id);
      }

      for (const checklist of checklists) {
        if (checklist.id) await db.deleteChecklist(checklist.id);
      }

      toast.success('모든 데이터가 삭제되었습니다');
    } catch (error) {
      toast.error('데이터 삭제에 실패했습니다');
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold">설정</h2>

      <Card>
        <CardHeader>
          <CardTitle>화면 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>다크 모드</Label>
              <p className="text-sm text-muted-foreground">
                화면 테마를 변경합니다
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="w-4 h-4 mr-2" />
                라이트
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                <Moon className="w-4 h-4 mr-2" />
                다크
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>알림 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">알림 활성화</Label>
              <p className="text-sm text-muted-foreground">
                캠핑 일정 알림을 받습니다
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={handleNotificationsChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>데이터 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>데이터 백업 및 복원</Label>
            <p className="text-sm text-muted-foreground">
              파일 또는 텍스트로 데이터를 내보내거나 가져올 수 있습니다
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                파일로 내보내기
              </Button>
              <Button variant="outline" onClick={handleCopyToClipboard}>
                <Copy className="w-4 h-4 mr-2" />
                텍스트 복사
              </Button>
              <Button variant="outline" onClick={handleImportData}>
                <Upload className="w-4 h-4 mr-2" />
                파일에서 가져오기
              </Button>
              <Button variant="outline" onClick={handlePasteFromClipboard}>
                <ClipboardPaste className="w-4 h-4 mr-2" />
                텍스트 붙여넣기
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              💡 팁: 텍스트 복사 후 카톡으로 바로 전송할 수 있습니다
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label>모든 데이터 삭제</Label>
            <p className="text-sm text-muted-foreground">
              장비, 모듈, 체크리스트를 포함한 모든 데이터가 삭제됩니다
            </p>
            <Button variant="destructive" onClick={handleClearData}>
              모든 데이터 삭제
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            앱 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">앱 이름:</span>
            <span>CampCheck</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">버전:</span>
            <span>1.0.0 (Web)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">데이터 저장:</span>
            <span>IndexedDB</span>
          </div>
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              캠핑 장비를 효율적으로 관리하고 체크리스트를 작성하세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
