import { useState, useEffect } from 'react';
import { db } from '@/lib/db-context';
import type { Checklist, Equipment, Module } from '@/types';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [checklistName, setChecklistName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [checklistsData, modulesData] = await Promise.all([
        db.getAllChecklists(),
        db.getAllModules(),
      ]);
      setChecklists(checklistsData);
      setModules(modulesData);
    } catch (error) {
      toast.error('데이터를 불러올 수 없습니다');
    }
  }

  function resetForm() {
    setChecklistName('');
    setStartDate('');
    setEndDate('');
    setSelectedModule('');
  }

  async function handleSubmit() {
    try {
      if (!checklistName.trim() || !startDate || !endDate) {
        toast.error('모든 필드를 입력하세요');
        return;
      }

      const checklistId = await db.addChecklist({
        name: checklistName,
        startDate,
        endDate,
      });

      // Add equipment from selected module
      if (selectedModule) {
        const moduleId = parseInt(selectedModule);
        const equipment = await db.getModuleEquipment(moduleId);

        for (const eq of equipment) {
          if (eq.id) {
            await db.addChecklistItem({
              checklistId,
              equipmentId: eq.id,
              quantity: eq.quantity,
              isChecked: false,
            });
          }
        }
      }

      toast.success('체크리스트가 생성되었습니다');
      loadData();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('체크리스트 생성에 실패했습니다');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await db.deleteChecklist(id);
      toast.success('체크리스트가 삭제되었습니다');
      loadData();
    } catch (error) {
      toast.error('체크리스트 삭제에 실패했습니다');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">체크리스트</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              체크리스트 생성
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>새 체크리스트</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="checklistName">체크리스트 이름</Label>
                <Input
                  id="checklistName"
                  value={checklistName}
                  onChange={(e) => setChecklistName(e.target.value)}
                  placeholder="예: 2024년 여름 캠핑"
                />
              </div>

              <div>
                <Label htmlFor="startDate">시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">종료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="module">모듈 선택 (선택사항)</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="모듈을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={String(module.id)}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {modules.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    등록된 모듈이 없습니다
                  </p>
                )}
              </div>

              <Button onClick={handleSubmit} className="w-full">
                생성
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {checklists.map((checklist) => (
          <ChecklistCard
            key={checklist.id}
            checklist={checklist}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {checklists.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">생성된 체크리스트가 없습니다</p>
          <p className="text-sm text-muted-foreground mt-2">
            모듈을 활용하여 빠르게 체크리스트를 만들어보세요
          </p>
        </Card>
      )}
    </div>
  );
}

function ChecklistCard({
  checklist,
  onDelete,
}: {
  checklist: Checklist;
  onDelete: (id: number) => void;
}) {
  const [items, setItems] = useState<{ equipment: Equipment; quantity: number; isChecked: boolean }[]>([]);
  const [checkedCount, setCheckedCount] = useState(0);

  useEffect(() => {
    if (checklist.id) {
      loadItems();
    }
  }, [checklist.id]);

  async function loadItems() {
    try {
      const checklistItems = await db.getChecklistItems(checklist.id!);
      const itemsWithEquipment = await Promise.all(
        checklistItems.map(async (item) => {
          const equipment = await db.getEquipmentById(item.equipmentId);
          return {
            id: item.id,
            equipment: equipment!,
            quantity: item.quantity,
            isChecked: item.isChecked,
          };
        })
      );
      setItems(itemsWithEquipment);
      setCheckedCount(itemsWithEquipment.filter((i) => i.isChecked).length);
    } catch (error) {
      console.error('Failed to load checklist items:', error);
    }
  }

  async function toggleItem(itemId: number, checked: boolean) {
    try {
      const item = await db.getChecklistItems(checklist.id!).then((items) =>
        items.find((i) => i.id === itemId)
      );
      if (item) {
        await db.updateChecklistItem({ ...item, isChecked: checked });
        loadItems();
      }
    } catch (error) {
      toast.error('체크 상태 변경에 실패했습니다');
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{checklist.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => checklist.id && onDelete(checklist.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {checklist.startDate} ~ {checklist.endDate}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">진행률</span>
            <Badge>
              {checkedCount}/{items.length}
            </Badge>
          </div>

          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`item-${item.id}`}
                  checked={item.isChecked}
                  onCheckedChange={(checked) =>
                    toggleItem(item.id!, checked as boolean)
                  }
                />
                <label
                  htmlFor={`item-${item.id}`}
                  className={`text-sm flex-1 cursor-pointer ${
                    item.isChecked ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {item.equipment.name} (x{item.quantity})
                </label>
              </div>
            ))}
            {items.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                외 {items.length - 5}개 항목
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
