'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, MoreVertical, Shield, RefreshCw, Search, Filter, X, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePusher } from '@/lib/hooks/use-pusher';
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
import {
  useWeapons,
  useWeaponTypes,
  useUsers,
  useCreateWeapon,
  useUpdateWeapon,
  useDeleteWeapon,
  useAssignWeapon,
} from '@/lib/hooks/use-queries';
import type { Weapon } from '@/lib/types';

interface FilterType {
  id: string;
  type: 'status' | 'weaponType' | 'assignedTo';
  value: string;
}

type SortField = 'name' | 'serialNumber' | 'status' | 'ammunition';
type SortOrder = 'asc' | 'desc';

export default function AdminWeaponsPage() {
  const { data: session } = useSession();

  // TanStack Query hooks - Super propre !
  const { data: weapons = [], isLoading, refetch: refetchWeapons } = useWeapons();
  const { data: weaponTypes = [], refetch: refetchWeaponTypes } = useWeaponTypes();
  const { data: users = [] } = useUsers();

  // Mutations
  const createWeaponMutation = useCreateWeapon();
  const updateWeaponMutation = useUpdateWeapon();
  const deleteWeaponMutation = useDeleteWeapon();
  const assignWeaponMutation = useAssignWeapon();

  const [filteredWeapons, setFilteredWeapons] = useState<Weapon[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    type: '',
    description: '',
    status: 'AVAILABLE' as Weapon['status'],
    ammunition: 0,
  });

  useEffect(() => {
    applyFiltersAndSort();
  }, [weapons, filters, searchTerm, sortField, sortOrder]);

  // Pusher real-time updates (uniquement si authentifié et admin)
  usePusher({
    onWeaponsChange: refetchWeapons,
    onWeaponTypesChange: refetchWeaponTypes,
    enabled: (session?.user as any)?.role === 'ADMIN',
    isAuthenticated: !!session?.user,
  });

  const applyFiltersAndSort = () => {
    let filtered = [...weapons];

    // Apply filters
    filters.forEach((filter) => {
      filtered = filtered.filter((weapon) => {
        switch (filter.type) {
          case 'status':
            return weapon.status === filter.value;
          case 'weaponType':
            return weapon.weaponTypeId === filter.value;
          case 'assignedTo':
            return weapon.assignedTo?.id === filter.value;
          default:
            return true;
        }
      });
    });

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (weapon) =>
          weapon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          weapon.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          weapon.weaponType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          weapon.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredWeapons(filtered);
  };

  const addFilter = (type: FilterType['type'], value: string) => {
    setFilters([...filters, { id: Date.now().toString(), type, value }]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getUniqueStatuses = () => {
    return Array.from(new Set(weapons.map((w) => w.status)));
  };

  const getUniqueWeaponTypes = () => {
    return Array.from(
      new Map(weapons.map((w) => [w.weaponTypeId, w.weaponType])).values()
    );
  };

  const getUniqueAssignedUsers = () => {
    const users = weapons
      .filter((w) => w.assignedTo)
      .map((w) => w.assignedTo!);
    return Array.from(new Map(users.map((u) => [u.id, u])).values());
  };

  const handleRefresh = async () => {
    await Promise.all([refetchWeapons(), refetchWeaponTypes()]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWeaponMutation.mutateAsync({
      ...formData,
      userId: session?.user?.id
    });
    setFormData({ serialNumber: '', name: '', type: '', description: '', status: 'AVAILABLE', ammunition: 0 });
    setShowCreateDialog(false);
  };

  const handleEdit = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setFormData({
      serialNumber: weapon.serialNumber,
      name: weapon.name,
      type: weapon.weaponTypeId,
      description: weapon.description || '',
      status: weapon.status,
      ammunition: weapon.ammunition || 0,
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWeapon) return;

    await updateWeaponMutation.mutateAsync({
      id: selectedWeapon.id,
      data: formData,
    });
    setShowEditDialog(false);
    setSelectedWeapon(null);
  };

  const handleDelete = async () => {
    if (!selectedWeapon) return;

    await deleteWeaponMutation.mutateAsync(selectedWeapon.id);
    setShowDeleteDialog(false);
    setSelectedWeapon(null);
  };

  const handleStatusChange = async (weaponId: string, newStatus: Weapon['status']) => {
    // Si on passe à ASSIGNED, ouvrir la popup de sélection d'utilisateur
    if (newStatus === 'ASSIGNED') {
      const weapon = weapons.find((w) => w.id === weaponId);
      if (weapon) {
        setSelectedWeapon(weapon);
        setSelectedUserId('');
        setShowAssignDialog(true);
      }
      return;
    }

    // Pour les autres statuts, mettre à jour directement
    await updateWeaponMutation.mutateAsync({
      id: weaponId,
      data: { status: newStatus },
    });
  };

  const handleAssignWeapon = async () => {
    if (!selectedWeapon || !selectedUserId) return;

    await assignWeaponMutation.mutateAsync({
      weaponId: selectedWeapon.id,
      userId: selectedUserId
    });
    setShowAssignDialog(false);
    setSelectedWeapon(null);
    setSelectedUserId('');
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
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

  const getStatusClassName = (status: string) => {
    if (status === 'MAINTENANCE') {
      return 'bg-[#800020] text-white border-[#800020] hover:bg-[#6b001a]';
    }
    return '';
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
              Nouvelle Arme
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une arme..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un filtre
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-96 overflow-y-auto">
                  <div className="p-2 text-xs font-medium text-muted-foreground">
                    Filtrer par statut
                  </div>
                  {getUniqueStatuses().map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => addFilter('status', status)}
                    >
                      {translateWeaponStatus(status)}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  <div className="p-2 text-xs font-medium text-muted-foreground">
                    Filtrer par type
                  </div>
                  {getUniqueWeaponTypes().map((type) => (
                    <DropdownMenuItem
                      key={type.id}
                      onClick={() => addFilter('weaponType', type.id)}
                    >
                      {type.name}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  <div className="p-2 text-xs font-medium text-muted-foreground">
                    Filtrer par utilisateur
                  </div>
                  {getUniqueAssignedUsers().map((user) => (
                    <DropdownMenuItem
                      key={user.id}
                      onClick={() => addFilter('assignedTo', user.id)}
                    >
                      {user.name || user.email}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Active Filters */}
            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => {
                  let displayValue = filter.value;
                  let displayType: string = filter.type;

                  if (filter.type === 'status') {
                    displayValue = translateWeaponStatus(filter.value);
                    displayType = 'statut';
                  } else if (filter.type === 'weaponType') {
                    const type = weapons.find((w) => w.weaponTypeId === filter.value)?.weaponType;
                    displayValue = type?.name || filter.value;
                    displayType = 'type';
                  } else if (filter.type === 'assignedTo') {
                    const user = weapons.find((w) => w.assignedTo?.id === filter.value)?.assignedTo;
                    displayValue = user?.name || user?.email || filter.value;
                    displayType = 'assigné à';
                  }

                  return (
                    <Badge key={filter.id} variant="secondary" className="gap-1 pr-1">
                      <span className="text-xs text-muted-foreground">{displayType}:</span>
                      {displayValue}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeFilter(filter.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters([])}
                  className="h-6 text-xs"
                >
                  Tout effacer
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                    <div className="flex items-center gap-1">
                      Nom
                      {sortField === 'name' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('serialNumber')}>
                    <div className="flex items-center gap-1">
                      Numéro de Série
                      {sortField === 'serialNumber' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('ammunition')}>
                    <div className="flex items-center gap-1">
                      Munitions
                      {sortField === 'ammunition' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort('status')}>
                    <div className="flex items-center gap-1">
                      Statut
                      {sortField === 'status' && (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Assigné à</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWeapons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Aucune arme trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWeapons.map((weapon) => (
                    <TableRow key={weapon.id}>
                      <TableCell className="font-medium">{weapon.name}</TableCell>
                      <TableCell className="font-mono text-sm">{weapon.serialNumber}</TableCell>
                      <TableCell>{weapon.weaponType.name}</TableCell>
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
                            <Badge
                              variant={getStatusVariant(weapon.status)}
                              className={getStatusClassName(weapon.status)}
                            >
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

        {/* Results count */}
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Affichage de {filteredWeapons.length} sur {weapons.length} armes
        </div>

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
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {weaponTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button type="submit" disabled={createWeaponMutation.isPending}>
                  {createWeaponMutation.isPending ? 'Création...' : 'Créer'}
                </Button>
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
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {weaponTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button type="submit" disabled={updateWeaponMutation.isPending}>
                  {updateWeaponMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Assign Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assigner une arme</DialogTitle>
              <DialogDescription>
                Sélectionnez la personne à qui vous voulez assigner "{selectedWeapon?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="assignUser">Utilisateur</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleAssignWeapon}
                disabled={!selectedUserId || assignWeaponMutation.isPending}
              >
                {assignWeaponMutation.isPending ? 'Assignment...' : 'Assigner'}
              </Button>
            </DialogFooter>
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
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteWeaponMutation.isPending}
              >
                {deleteWeaponMutation.isPending ? 'Suppression...' : 'Supprimer'}
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
