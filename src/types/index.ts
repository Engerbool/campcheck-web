// 장비 상태 타입
export type EquipmentStatus = 'green' | 'yellow' | 'red';

// 장비 타입 정의
export interface Equipment {
  id?: number;
  type: string;
  name: string;
  quantity: number;
  category: string;
  isConsumable: boolean;
  status: EquipmentStatus;
  memo?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 모듈 타입 정의
export interface Module {
  id?: number;
  name: string;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 모듈-장비 연결 타입
export interface ModuleEquipment {
  id?: number;
  moduleId: number;
  equipmentId: number;
}

// 체크리스트 타입 정의
export interface Checklist {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 체크리스트 아이템 타입
export interface ChecklistItem {
  id?: number;
  checklistId: number;
  equipmentId: number;
  quantity: number;
  isChecked: boolean;
}

// 설정 타입 정의
export interface Settings {
  darkMode: boolean;
  notifications: boolean;
}
