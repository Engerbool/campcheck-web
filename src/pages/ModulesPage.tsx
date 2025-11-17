import { useState, useEffect } from 'react';
import { db } from '@/lib/db-context';
import type { Module, Equipment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [moduleName, setModuleName] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [modulesData, equipmentData] = await Promise.all([
        db.getAllModules(),
        db.getAllEquipment(),
      ]);
      setModules(modulesData);
      setEquipment(equipmentData);
    } catch (error) {
      toast.error('데이터를 불러올 수 없습니다');
    }
  }

  async function loadModuleEquipment(moduleId: number) {
    const eq = await db.getModuleEquipment(moduleId);
    setSelectedEquipment(eq.map((e) => e.id!).filter(Boolean));
  }

  function handleEdit(module: Module) {
    setSelectedModule(module);
    setModuleName(module.name);
    if (module.id) loadModuleEquipment(module.id);
    setIsDialogOpen(true);
  }

  function resetForm() {
    setSelectedModule(null);
    setModuleName('');
    setSelectedEquipment([]);
  }

  async function handleSubmit() {
    try {
      if (!moduleName.trim()) {
        toast.error('모듈 이름을 입력하세요');
        return;
      }

      let moduleId: number;

      if (selectedModule?.id) {
        await db.updateModule({
          ...selectedModule,
          name: moduleName,
        });
        moduleId = selectedModule.id;
        toast.success('모듈이 수정되었습니다');
      } else {
        const maxSortOrder = modules.reduce(
          (max, m) => Math.max(max, m.sortOrder),
          0
        );
        moduleId = await db.addModule({
          name: moduleName,
          sortOrder: maxSortOrder + 1,
        });
        toast.success('모듈이 추가되었습니다');
      }

      // Update module equipment
      const currentEquipment = await db.getModuleEquipment(moduleId);
      const currentIds = currentEquipment.map((e) => e.id!);

      // Remove deselected
      for (const eq of currentEquipment) {
        if (!selectedEquipment.includes(eq.id!)) {
          await db.deleteModuleEquipment(moduleId, eq.id!);
        }
      }

      // Add newly selected
      for (const eqId of selectedEquipment) {
        if (!currentIds.includes(eqId)) {
          await db.addModuleEquipment({ moduleId, equipmentId: eqId });
        }
      }

      loadData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('모듈 저장에 실패했습니다');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await db.deleteModule(id);
      toast.success('모듈이 삭제되었습니다');
      loadData();
    } catch (error) {
      toast.error('모듈 삭제에 실패했습니다');
    }
  }

  function toggleEquipment(eqId: number) {
    setSelectedEquipment((prev) =>
      prev.includes(eqId)
        ? prev.filter((id) => id !== eqId)
        : [...prev, eqId]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">모듈 관리</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              모듈 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedModule ? '모듈 수정' : '모듈 추가'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="moduleName">모듈 이름</Label>
                <Input
                  id="moduleName"
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder="예: 여름 캠핑, 겨울 캠핑"
                />
              </div>

              <div>
                <Label>장비 선택</Label>
                <div className="space-y-2 mt-2 max-h-64 overflow-y-auto border rounded-md p-4">
                  {equipment.map((eq) => (
                    <div key={eq.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`eq-${eq.id}`}
                        checked={selectedEquipment.includes(eq.id!)}
                        onCheckedChange={() => toggleEquipment(eq.id!)}
                      />
                      <label
                        htmlFor={`eq-${eq.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                      >
                        {eq.name} ({eq.category})
                      </label>
                    </div>
                  ))}
                </div>
                {equipment.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    등록된 장비가 없습니다
                  </p>
                )}
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {selectedModule ? '수정' : '추가'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {modules.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">등록된 모듈이 없습니다</p>
        </Card>
      )}
    </div>
  );
}

function ModuleCard({
  module,
  onEdit,
  onDelete,
}: {
  module: Module;
  onEdit: (module: Module) => void;
  onDelete: (id: number) => void;
}) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  useEffect(() => {
    if (module.id) {
      db.getModuleEquipment(module.id).then(setEquipment);
    }
  }, [module.id]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{module.name}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(module)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => module.id && onDelete(module.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            장비 {equipment.length}개
          </div>
          <div className="flex flex-wrap gap-1">
            {equipment.slice(0, 5).map((eq) => (
              <Badge key={eq.id} variant="secondary" className="text-xs">
                {eq.name}
              </Badge>
            ))}
            {equipment.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{equipment.length - 5}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
