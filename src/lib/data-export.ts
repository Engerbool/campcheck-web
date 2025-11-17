import { db } from './db-context';
import type { Equipment, Module, Checklist, ChecklistItem, Settings } from '@/types';

export interface BackupData {
  version: string;
  exportDate: string;
  equipment: Equipment[];
  modules: Module[];
  checklists: Checklist[];
  checklistItems: ChecklistItem[];
  settings: Settings;
}

/**
 * 모든 데이터를 JSON 파일로 내보내기
 */
export async function exportData(): Promise<void> {
  try {
    // 모든 데이터 가져오기
    const [equipment, modules, checklists, settings] = await Promise.all([
      db.getAllEquipment(),
      db.getAllModules(),
      db.getAllChecklists(),
      db.getSettings(),
    ]);

    // 모든 체크리스트 아이템 가져오기
    const checklistItems: ChecklistItem[] = [];
    for (const checklist of checklists) {
      if (checklist.id) {
        const items = await db.getChecklistItems(checklist.id);
        checklistItems.push(...items);
      }
    }

    // 백업 데이터 구조 생성
    const backupData: BackupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      equipment,
      modules,
      checklists,
      checklistItems,
      settings,
    };

    // JSON 문자열로 변환 (보기 좋게 포맷팅)
    const jsonString = JSON.stringify(backupData, null, 2);

    // Blob 생성
    const blob = new Blob([jsonString], { type: 'application/json' });

    // 다운로드 링크 생성
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // 파일명: campcheck-backup-2024-11-18.json
    const date = new Date().toISOString().split('T')[0];
    link.download = `campcheck-backup-${date}.json`;

    // 다운로드 실행
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 메모리 정리
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('데이터 내보내기에 실패했습니다');
  }
}

/**
 * JSON 파일에서 데이터 가져오기
 */
export async function importData(file: File, mode: 'merge' | 'replace' = 'replace'): Promise<void> {
  try {
    // 파일 읽기
    const text = await file.text();
    const backupData: BackupData = JSON.parse(text);

    // 데이터 유효성 검증
    if (!backupData.version || !backupData.equipment) {
      throw new Error('올바른 백업 파일이 아닙니다');
    }

    // 덮어쓰기 모드일 경우 기존 데이터 삭제
    if (mode === 'replace') {
      await clearAllData();
    }

    // 장비 데이터 가져오기
    for (const equipment of backupData.equipment) {
      const { id, ...equipmentData } = equipment;
      await db.addEquipment(equipmentData);
    }

    // 모듈 데이터 가져오기
    const moduleIdMap = new Map<number, number>(); // old ID -> new ID
    for (const module of backupData.modules) {
      const { id: oldId, ...moduleData } = module;
      const newId = await db.addModule(moduleData);
      if (oldId) moduleIdMap.set(oldId, newId);
    }

    // 체크리스트 데이터 가져오기
    const checklistIdMap = new Map<number, number>();
    for (const checklist of backupData.checklists) {
      const { id: oldId, ...checklistData } = checklist;
      const newId = await db.addChecklist(checklistData);
      if (oldId) checklistIdMap.set(oldId, newId);
    }

    // 체크리스트 아이템 가져오기
    for (const item of backupData.checklistItems) {
      const newChecklistId = checklistIdMap.get(item.checklistId);
      if (newChecklistId) {
        const { id, checklistId, ...itemData } = item;
        await db.addChecklistItem({
          ...itemData,
          checklistId: newChecklistId,
        });
      }
    }

    // 설정 가져오기
    if (backupData.settings) {
      await db.updateSettings(backupData.settings);
    }
  } catch (error) {
    console.error('Import failed:', error);
    throw new Error('데이터 가져오기에 실패했습니다');
  }
}

/**
 * 모든 데이터 삭제
 */
async function clearAllData(): Promise<void> {
  const [equipment, modules, checklists] = await Promise.all([
    db.getAllEquipment(),
    db.getAllModules(),
    db.getAllChecklists(),
  ]);

  // 모든 체크리스트 삭제
  for (const checklist of checklists) {
    if (checklist.id) await db.deleteChecklist(checklist.id);
  }

  // 모든 모듈 삭제
  for (const module of modules) {
    if (module.id) await db.deleteModule(module.id);
  }

  // 모든 장비 삭제
  for (const eq of equipment) {
    if (eq.id) await db.deleteEquipment(eq.id);
  }
}

/**
 * 파일 선택 다이얼로그 열기
 */
export function openFileDialog(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      resolve(file || null);
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}
