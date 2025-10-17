'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, MoreVertical, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { translateWeaponStatus } from '@/lib/translations';

interface Weapon {
  id: string;
  serialNumber: string;
  name: string;
  type: string;
  description?: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';
  ammunition: number;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminWeaponsPage() {
  const { data: session } = useSession();
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    type: '',
    description: '',
    status: 'AVAILABLE' as Weapon['status'],
    ammunition: 0,
  });

  useEffect(() => {
    if ((session?.user as any)?.role === 'ADMIN') {
      fetchWeapons();
    }
  }, [session]);

  const fetchWeapons = async () => {
    try {
      const response = await fetch('/api/weapons');
      const data = await response.json();
      setWeapons(data);
    } catch (error) {
      console.error('Error fetching weapons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/weapons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: session?.user?.id }),
      });
      setFormData({ serialNumber: '', name: '', type: '', description: '', status: 'AVAILABLE', ammunition: 0 });
      setShowCreateDialog(false);
      fetchWeapons();
    } catch (error) {
      console.error('Error creating weapon:', error);
    }
  };

  const handleEdit = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setFormData({
      serialNumber: weapon.serialNumber,
      name: weapon.name,
      type: weapon.type,
      description: weapon.description || '',
      status: weapon.status,
      ammunition: weapon.ammunition || 0,
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWeapon) return;

    try {
      await fetch(`/api/weapons/${selectedWeapon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setShowEditDialog(false);
      setSelectedWeapon(null);
      fetchWeapons();
    } catch (error) {
      console.error('Error updating weapon:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedWeapon) return;

    try {
      await fetch(`/api/weapons/${selectedWeapon.id}`, {
        method: 'DELETE',
      });
      setShowDeleteDialog(false);
      setSelectedWeapon(null);
      fetchWeapons();
    } catch (error) {
      console.error('Error deleting weapon:', error);
    }
  };

  const handleStatusChange = async (weaponId: string, newStatus: Weapon['status']) => {
    try {
      await fetch(`/api/weapons/${weaponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchWeapons();
    } catch (error) {
      console.error('Error updating weapon status:', error);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'default';
      case 'ASSIGNED':
        return 'secondary';
      case 'MAINTENANCE':
        return 'destructive';
      case 'RETIRED':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Accès refusé</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Gestion des Armes</h1>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Arme
          </Button>
        </div>

        <Card>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Numéro de Série</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Munitions</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Assigné à</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weapons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Aucune arme trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  weapons.map((weapon) => (
                    <TableRow key={weapon.id}>
                      <TableCell className="font-medium">{weapon.name}</TableCell>
                      <TableCell className="font-mono text-sm">{weapon.serialNumber}</TableCell>
                      <TableCell>{weapon.type}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {weapon.ammunition ?? 0} balles
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={weapon.status}
                          onValueChange={(value) =>
                            handleStatusChange(weapon.id, value as Weapon['status'])
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <Badge variant={getStatusVariant(weapon.status)}>
                              {translateWeaponStatus(weapon.status)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AVAILABLE">
                              {translateWeaponStatus('AVAILABLE')}
                            </SelectItem>
                            <SelectItem value="ASSIGNED">
                              {translateWeaponStatus('ASSIGNED')}
                            </SelectItem>
                            <SelectItem value="MAINTENANCE">
                              {translateWeaponStatus('MAINTENANCE')}
                            </SelectItem>
                            <SelectItem value="RETIRED">
                              {translateWeaponStatus('RETIRED')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {weapon.assignedTo ? (
                          <div>
                            <div className="font-medium">
                              {weapon.assignedTo.name || weapon.assignedTo.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(weapon)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedWeapon(weapon);
                                setShowDeleteDialog(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle arme</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle arme à votre inventaire
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Numéro de Série</Label>
                  <Input
                    id="serialNumber"
                    required
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, serialNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ammunition">Munitions</Label>
                  <Input
                    id="ammunition"
                    type="number"
                    min="0"
                    value={formData.ammunition}
                    onChange={(e) =>
                      setFormData({ ...formData, ammunition: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'arme</DialogTitle>
              <DialogDescription>
                Modifiez les informations de l'arme
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-serialNumber">Numéro de Série</Label>
                  <Input
                    id="edit-serialNumber"
                    required
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, serialNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nom</Label>
                  <Input
                    id="edit-name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <Input
                    id="edit-type"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ammunition">Munitions</Label>
                  <Input
                    id="edit-ammunition"
                    type="number"
                    min="0"
                    value={formData.ammunition}
                    onChange={(e) =>
                      setFormData({ ...formData, ammunition: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as Weapon['status'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AVAILABLE">
                        {translateWeaponStatus('AVAILABLE')}
                      </SelectItem>
                      <SelectItem value="ASSIGNED">
                        {translateWeaponStatus('ASSIGNED')}
                      </SelectItem>
                      <SelectItem value="MAINTENANCE">
                        {translateWeaponStatus('MAINTENANCE')}
                      </SelectItem>
                      <SelectItem value="RETIRED">
                        {translateWeaponStatus('RETIRED')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer l'arme "{selectedWeapon?.name}" ? Cette action
                est irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Results count */}
        <div className="mt-4 text-sm text-muted-foreground text-center">
          {weapons.length} arme{weapons.length > 1 ? 's' : ''} au total
        </div>
      </div>
    </div>
  );
}
