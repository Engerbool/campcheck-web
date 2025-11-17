import { useState, useEffect } from 'react';
import { db } from '@/lib/db-context';
import type { Equipment, EquipmentStatus } from '@/types';
import { DEFAULT_CATEGORIES, STATUS_LABELS } from '@/constants/categories';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
};

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const [formData, setFormData] = useState({
    type: '',
    name: '',
    quantity: 1,
    category: DEFAULT_CATEGORIES[0],
    isConsumable: false,
    status: 'green' as EquipmentStatus,
    memo: '',
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  async function loadEquipment() {
    try {
      const data = await db.getAllEquipment();
      setEquipment(data);
    } catch (error) {
      toast.error('장비 목록을 불러올 수 없습니다');
    }
  }

  function resetForm() {
    setFormData({
      type: '',
      name: '',
      quantity: 1,
      category: DEFAULT_CATEGORIES[0],
      isConsumable: false,
      status: 'green',
      memo: '',
    });
    setEditingEquipment(null);
  }

  function handleEdit(eq: Equipment) {
    setEditingEquipment(eq);
    setFormData({
      type: eq.type,
      name: eq.name,
      quantity: eq.quantity,
      category: eq.category,
      isConsumable: eq.isConsumable,
      status: eq.status,
      memo: eq.memo || '',
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit() {
    try {
      if (editingEquipment && editingEquipment.id) {
        await db.updateEquipment({
          ...editingEquipment,
          ...formData,
        });
        toast.success('장비가 수정되었습니다');
      } else {
        await db.addEquipment(formData);
        toast.success('장비가 추가되었습니다');
      }
      loadEquipment();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('장비 저장에 실패했습니다');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await db.deleteEquipment(id);
      toast.success('장비가 삭제되었습니다');
      loadEquipment();
    } catch (error) {
      toast.error('장비 삭제에 실패했습니다');
    }
  }

  const filteredEquipment =
    selectedCategory === 'all'
      ? equipment
      : equipment.filter((eq) => eq.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">장비 관리</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              장비 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? '장비 수정' : '장비 추가'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">종류</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  placeholder="예: 개인, 공용"
                />
              </div>
              <div>
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="장비 이름"
                />
              </div>
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">수량</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: EquipmentStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">정상</SelectItem>
                    <SelectItem value="yellow">교체 필요</SelectItem>
                    <SelectItem value="red">구매 필요</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="memo">메모</Label>
                <Textarea
                  id="memo"
                  value={formData.memo}
                  onChange={(e) =>
                    setFormData({ ...formData, memo: e.target.value })
                  }
                  placeholder="메모 (선택사항)"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingEquipment ? '수정' : '추가'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4" />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {DEFAULT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((eq) => (
          <Card key={eq.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">{eq.name}</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${STATUS_COLORS[eq.status]}`}
                    title={STATUS_LABELS[eq.status]}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(eq)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eq.id && handleDelete(eq.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">종류:</span>
                  <span>{eq.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">카테고리:</span>
                  <Badge variant="secondary">{eq.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">수량:</span>
                  <span>{eq.quantity}개</span>
                </div>
                {eq.memo && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">{eq.memo}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">등록된 장비가 없습니다</p>
        </Card>
      )}
    </div>
  );
}
