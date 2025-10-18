'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, MoreVertical, Grid3x3, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataSync } from '@/lib/hooks/use-data-sync';
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
import { Label } from '@/components/ui/label';
import {
  useWeaponTypes,
  useCreateWeaponType,
  useUpdateWeaponType,
  useDeleteWeaponType,
} from '@/lib/hooks/use-queries';

interface WeaponType {
  id: string;
  name: string;
  image: string;
  category?: string;
}

export default function AdminWeaponTypesPage() {
  const { data: session } = useSession();

  // TanStack Query hooks
  const { data: weaponTypes = [], isLoading, refetch } = useWeaponTypes();
  const createWeaponTypeMutation = useCreateWeaponType();
  const updateWeaponTypeMutation = useUpdateWeaponType();
  const deleteWeaponTypeMutation = useDeleteWeaponType();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<WeaponType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    category: '',
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWeaponTypeMutation.mutateAsync({
      ...formData,
      userId: session?.user?.id,
    });
    setFormData({ name: '', image: '', category: '' });
    setShowCreateDialog(false);
  };

  const handleEdit = (weaponType: WeaponType) => {
    setSelectedType(weaponType);
    setFormData({
      name: weaponType.name,
      image: weaponType.image || '',
      category: weaponType.category || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    await updateWeaponTypeMutation.mutateAsync({
      id: selectedType.id,
      data: formData,
    });
    setShowEditDialog(false);
    setSelectedType(null);
  };

  const handleDelete = async () => {
    if (!selectedType) return;

    try {
      await deleteWeaponTypeMutation.mutateAsync(selectedType.id);
      setShowDeleteDialog(false);
      setSelectedType(null);
    } catch (error: any) {
      alert(error.message || 'Error deleting weapon type');
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
            <Grid3x3 className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Types d'Armes</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Type
            </Button>
          </div>
        </div>

        <Card>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weaponTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Aucun type d'arme trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  weaponTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.category || '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(type)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedType(type);
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
              <DialogTitle>Créer un nouveau type d'arme</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau type d'arme à votre inventaire
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="AK-47"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie (optionnel)</Label>
                  <Input
                    id="category"
                    placeholder="Fusil d'assaut"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
              <DialogTitle>Modifier le type d'arme</DialogTitle>
              <DialogDescription>
                Modifiez les informations du type d'arme
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
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
                  <Label htmlFor="edit-category">Catégorie (optionnel)</Label>
                  <Input
                    id="edit-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
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
                Êtes-vous sûr de vouloir supprimer le type "{selectedType?.name}" ? Cette action
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
          {weaponTypes.length} type{weaponTypes.length > 1 ? 's' : ''} au total
        </div>
      </div>
    </div>
  );
}
