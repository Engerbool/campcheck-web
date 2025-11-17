import type {
  Equipment,
  Module,
  ModuleEquipment,
  Checklist,
  ChecklistItem,
  Settings,
} from '@/types';

const DB_NAME = 'CampCheckDB';
const DB_VERSION = 1;

class Database {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Equipment store
        if (!db.objectStoreNames.contains('equipment')) {
          const equipmentStore = db.createObjectStore('equipment', {
            keyPath: 'id',
            autoIncrement: true,
          });
          equipmentStore.createIndex('category', 'category', { unique: false });
          equipmentStore.createIndex('status', 'status', { unique: false });
        }

        // Modules store
        if (!db.objectStoreNames.contains('modules')) {
          const moduleStore = db.createObjectStore('modules', {
            keyPath: 'id',
            autoIncrement: true,
          });
          moduleStore.createIndex('name', 'name', { unique: true });
          moduleStore.createIndex('sortOrder', 'sortOrder', { unique: false });
        }

        // ModuleEquipment store
        if (!db.objectStoreNames.contains('moduleEquipment')) {
          const meStore = db.createObjectStore('moduleEquipment', {
            keyPath: 'id',
            autoIncrement: true,
          });
          meStore.createIndex('moduleId', 'moduleId', { unique: false });
          meStore.createIndex('equipmentId', 'equipmentId', { unique: false });
          meStore.createIndex('moduleEquipment', ['moduleId', 'equipmentId'], {
            unique: true,
          });
        }

        // Checklists store
        if (!db.objectStoreNames.contains('checklists')) {
          db.createObjectStore('checklists', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }

        // ChecklistItems store
        if (!db.objectStoreNames.contains('checklistItems')) {
          const ciStore = db.createObjectStore('checklistItems', {
            keyPath: 'id',
            autoIncrement: true,
          });
          ciStore.createIndex('checklistId', 'checklistId', { unique: false });
          ciStore.createIndex('equipmentId', 'equipmentId', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };
    });
  }

  private getStore(
    storeName: string,
    mode: IDBTransactionMode = 'readonly'
  ): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Generic CRUD operations
  async add<T>(storeName: string, data: T): Promise<number> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getById<T>(storeName: string, id: number): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update<T>(storeName: string, data: T & { id: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.put({
        ...data,
        updatedAt: new Date(),
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<T>(
    storeName: string,
    indexName: string,
    value: any
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Equipment methods
  async addEquipment(equipment: Omit<Equipment, 'id'>): Promise<number> {
    return this.add('equipment', equipment);
  }

  async getAllEquipment(): Promise<Equipment[]> {
    return this.getAll<Equipment>('equipment');
  }

  async getEquipmentById(id: number): Promise<Equipment | undefined> {
    return this.getById<Equipment>('equipment', id);
  }

  async updateEquipment(equipment: Equipment): Promise<void> {
    if (!equipment.id) throw new Error('Equipment ID is required');
    return this.update('equipment', equipment as Equipment & { id: number });
  }

  async deleteEquipment(id: number): Promise<void> {
    // Delete related module_equipment entries
    const meItems = await this.getByIndex<ModuleEquipment>(
      'moduleEquipment',
      'equipmentId',
      id
    );
    for (const item of meItems) {
      if (item.id) await this.delete('moduleEquipment', item.id);
    }
    return this.delete('equipment', id);
  }

  // Module methods
  async addModule(module: Omit<Module, 'id'>): Promise<number> {
    return this.add('modules', module);
  }

  async getAllModules(): Promise<Module[]> {
    const modules = await this.getAll<Module>('modules');
    return modules.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getModuleById(id: number): Promise<Module | undefined> {
    return this.getById<Module>('modules', id);
  }

  async updateModule(module: Module): Promise<void> {
    if (!module.id) throw new Error('Module ID is required');
    return this.update('modules', module as Module & { id: number });
  }

  async deleteModule(id: number): Promise<void> {
    // Delete related module_equipment entries
    const meItems = await this.getByIndex<ModuleEquipment>(
      'moduleEquipment',
      'moduleId',
      id
    );
    for (const item of meItems) {
      if (item.id) await this.delete('moduleEquipment', item.id);
    }
    return this.delete('modules', id);
  }

  // ModuleEquipment methods
  async addModuleEquipment(
    moduleEquipment: Omit<ModuleEquipment, 'id'>
  ): Promise<number> {
    return this.add('moduleEquipment', moduleEquipment);
  }

  async getModuleEquipment(moduleId: number): Promise<Equipment[]> {
    const meItems = await this.getByIndex<ModuleEquipment>(
      'moduleEquipment',
      'moduleId',
      moduleId
    );
    const equipment: Equipment[] = [];
    for (const item of meItems) {
      const eq = await this.getEquipmentById(item.equipmentId);
      if (eq) equipment.push(eq);
    }
    return equipment;
  }

  async deleteModuleEquipment(
    moduleId: number,
    equipmentId: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('moduleEquipment', 'readwrite');
      const index = store.index('moduleEquipment');
      const request = index.openCursor([moduleId, equipmentId]);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Checklist methods
  async addChecklist(checklist: Omit<Checklist, 'id'>): Promise<number> {
    return this.add('checklists', checklist);
  }

  async getAllChecklists(): Promise<Checklist[]> {
    return this.getAll<Checklist>('checklists');
  }

  async getChecklistById(id: number): Promise<Checklist | undefined> {
    return this.getById<Checklist>('checklists', id);
  }

  async updateChecklist(checklist: Checklist): Promise<void> {
    if (!checklist.id) throw new Error('Checklist ID is required');
    return this.update('checklists', checklist as Checklist & { id: number });
  }

  async deleteChecklist(id: number): Promise<void> {
    // Delete related checklist items
    const items = await this.getByIndex<ChecklistItem>(
      'checklistItems',
      'checklistId',
      id
    );
    for (const item of items) {
      if (item.id) await this.delete('checklistItems', item.id);
    }
    return this.delete('checklists', id);
  }

  // ChecklistItem methods
  async addChecklistItem(
    item: Omit<ChecklistItem, 'id'>
  ): Promise<number> {
    return this.add('checklistItems', item);
  }

  async getChecklistItems(checklistId: number): Promise<ChecklistItem[]> {
    return this.getByIndex<ChecklistItem>(
      'checklistItems',
      'checklistId',
      checklistId
    );
  }

  async updateChecklistItem(item: ChecklistItem): Promise<void> {
    if (!item.id) throw new Error('ChecklistItem ID is required');
    return this.update('checklistItems', item as ChecklistItem & { id: number });
  }

  async deleteChecklistItem(id: number): Promise<void> {
    return this.delete('checklistItems', id);
  }

  // Settings methods
  async getSettings(): Promise<Settings> {
    const settings = await this.getById<Settings>('settings', 1);
    return settings || { darkMode: false, notifications: true };
  }

  async updateSettings(settings: Settings): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore('settings', 'readwrite');
      const request = store.put({ ...settings, id: 1 });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new Database();
