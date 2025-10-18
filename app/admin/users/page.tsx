'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { Users, MoreVertical, Trash2, Shield, UserCog, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataSync } from '@/lib/hooks/use-data-sync';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { translateWeaponStatus } from '@/lib/translations';

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'USER' | 'ADMIN';
  weapons: any[];
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');
  const [editName, setEditName] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((session?.user as any)?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [session]);

  // Real-time sync DÉSACTIVÉ pour économiser la base de données
  // Utilisez le bouton de refresh manuel à la place

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setEditName(user.name || '');
    setNewRole(user.role);
    setShowDetailsDialog(true);
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, role: newRole }),
      });
      setShowDetailsDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleUnassignWeapon = async (weaponId: string) => {
    try {
      await fetch('/api/weapons/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weaponId, userId: session?.user.id }),
      });
      fetchUsers();
      // Refresh selected user data
      if (selectedUser) {
        const response = await fetch('/api/users');
        const data = await response.json();
        const updatedUser = data.find((u: User) => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error unassigning weapon:', error);
    }
  };

  const handleChangeWeaponStatus = async (weaponId: string, newStatus: string) => {
    try {
      await fetch(`/api/weapons/${weaponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUsers();
      // Refresh selected user data
      if (selectedUser) {
        const response = await fetch('/api/users');
        const data = await response.json();
        const updatedUser = data.find((u: User) => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error changing weapon status:', error);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      setShowEditDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });
      setShowDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleVariant = (role: string) => {
    return role === 'ADMIN' ? 'destructive' : 'default';
  };

  const getRoleLabel = (role: string) => {
    return role === 'ADMIN' ? 'Administrateur' : 'Utilisateur';
  };

  const getWeaponStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
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
        return 'secondary';
    }
  };

  const getWeaponStatusClassName = (status: string) => {
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
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          </div>
        </div>

        <Card>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Armes assignées</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="cursor-pointer hover:bg-accent/50" onClick={() => handleViewDetails(user)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.image} alt={user.name || user.email} />
                            <AvatarFallback>
                              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name || 'Sans nom'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleVariant(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {user.weapons.length} arme{user.weapons.length > 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditRole(user)}>
                              <UserCog className="h-4 w-4 mr-2" />
                              Modifier le rôle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteDialog(true);
                              }}
                              className="text-destructive"
                              disabled={user.id === session.user.id}
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

        {/* User Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de l'utilisateur</DialogTitle>
              <DialogDescription>
                Consultez et modifiez les informations de l'utilisateur
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* User Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser?.image} alt={selectedUser?.name || selectedUser?.email || ''} />
                    <AvatarFallback className="text-lg">
                      {selectedUser?.name?.[0]?.toUpperCase() || selectedUser?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor="userName">Nom</Label>
                    <Input
                      id="userName"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nom de l'utilisateur"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <Input value={selectedUser?.email || ''} disabled className="mt-1" />
                </div>
              </div>

              {/* Weapons Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Armes assignées</h3>
                  <Badge variant="outline">{selectedUser?.weapons.length || 0} arme{(selectedUser?.weapons.length || 0) > 1 ? 's' : ''}</Badge>
                </div>

                {(!selectedUser?.weapons || selectedUser.weapons.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune arme assignée
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.weapons.map((weapon: any) => (
                      <Card key={weapon.id} className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-medium">{weapon.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Numéro de Série: {weapon.serialNumber} • Type: {weapon.type} • {weapon.ammunition ?? 0} balles
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={weapon.status}
                              onValueChange={(value) => handleChangeWeaponStatus(weapon.id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-8">
                                <Badge
                                  variant={getWeaponStatusVariant(weapon.status)}
                                  className={getWeaponStatusClassName(weapon.status)}
                                >
                                  {translateWeaponStatus(weapon.status)}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AVAILABLE">{translateWeaponStatus('AVAILABLE')}</SelectItem>
                                <SelectItem value="ASSIGNED">{translateWeaponStatus('ASSIGNED')}</SelectItem>
                                <SelectItem value="MAINTENANCE">{translateWeaponStatus('MAINTENANCE')}</SelectItem>
                                <SelectItem value="RETIRED">{translateWeaponStatus('RETIRED')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnassignWeapon(weapon.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateUser}>Enregistrer les modifications</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le rôle de l'utilisateur</DialogTitle>
              <DialogDescription>
                Changez le rôle de {selectedUser?.name || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="role">Rôle</Label>
              <Select value={newRole} onValueChange={(value: 'USER' | 'ADMIN') => setNewRole(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Utilisateur</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateRole}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir supprimer l'utilisateur "{selectedUser?.name || selectedUser?.email}" ?
                Cette action est irréversible et supprimera toutes les données associées.
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
          {users.length} utilisateur{users.length > 1 ? 's' : ''} au total
        </div>
      </div>
    </div>
  );
}
