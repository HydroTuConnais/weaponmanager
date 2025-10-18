'use client';

import { useSession } from '@/lib/auth-client';
import { useState, useMemo } from 'react';
import { Activity, Filter, X, Plus, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { translateLogAction } from '@/lib/translations';
import type { DateRange } from 'react-day-picker';
import { useLogs } from '@/lib/hooks/use-queries';

interface Log {
  id: string;
  action: string;
  timestamp: string;
  notes?: string;
  weapon: {
    id: string;
    name: string;
    serialNumber: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface FilterType {
  id: string;
  type: 'action' | 'user' | 'weapon' | 'dateRange';
  value: string;
  endDate?: string; // For date range filters
}

export default function AdminLogsPage() {
  const { data: session } = useSession();

  // TanStack Query avec refetch automatique toutes les 10 secondes
  const { data: logs = [], isLoading } = useLogs();

  const [filters, setFilters] = useState<FilterType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Compute filtered logs using useMemo to avoid infinite loops
  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    // Apply filters
    filters.forEach((filter) => {
      filtered = filtered.filter((log) => {
        switch (filter.type) {
          case 'action':
            return log.action === filter.value;
          case 'user':
            return log.user.id === filter.value;
          case 'weapon':
            return log.weapon.id === filter.value;
          case 'dateRange':
            const logDate = new Date(log.timestamp);
            const startDate = new Date(filter.value);
            const endDate = filter.endDate ? new Date(filter.endDate) : new Date();
            return logDate >= startDate && logDate <= endDate;
          default:
            return true;
        }
      });
    });

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.weapon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.weapon.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [logs, filters, searchTerm]);

  const addFilter = (type: 'action' | 'user' | 'weapon' | 'dateRange', value: string, endDate?: string) => {
    setFilters([...filters, { id: Date.now().toString(), type, value, endDate }]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const addDateRangeFilter = () => {
    if (dateRange?.from) {
      addFilter(
        'dateRange',
        dateRange.from.toISOString(),
        dateRange.to?.toISOString() || undefined
      );
      setDateRange(undefined);
    }
  };

  const getActionColorClass = (action: string) => {
    switch (action) {
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300'; // Bleu - assignation
      case 'RETURNED':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300'; // Vert - retour
      case 'CREATED':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300'; // Violet - création
      case 'MAINTENANCE_START':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-300'; // Orange - début maintenance
      case 'MAINTENANCE_END':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-300'; // Cyan - fin maintenance
      case 'UPDATED':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300'; // Gris - mise à jour
      case 'DELETED':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300'; // Rouge - suppression
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getUniqueActions = () => {
    return Array.from(new Set(logs.map((log) => log.action)));
  };

  const getUniqueUsers = () => {
    const uniqueUsers = Array.from(
      new Map(logs.map((log) => [log.user.id, log.user])).values()
    );
    return uniqueUsers;
  };

  const getUniqueWeapons = () => {
    const uniqueWeapons = Array.from(
      new Map(logs.map((log) => [log.weapon.id, log.weapon])).values()
    );
    return uniqueWeapons;
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
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Logs d'activité</h1>
        </div>

        {/* Search and Filters */}
        <Card className="p-4 mb-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher dans les logs..."
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
                    Filtrer par action
                  </div>
                  {getUniqueActions().map((action) => (
                    <DropdownMenuItem
                      key={action}
                      onClick={() => addFilter('action', action)}
                    >
                      {translateLogAction(action)}
                    </DropdownMenuItem>
                  ))}

                  <div className="my-1 h-px bg-border" />

                  <div className="p-2 text-xs font-medium text-muted-foreground">
                    Filtrer par utilisateur
                  </div>
                  {getUniqueUsers().map((user) => (
                    <DropdownMenuItem
                      key={user.id}
                      onClick={() => addFilter('user', user.id)}
                    >
                      {user.name || user.email}
                    </DropdownMenuItem>
                  ))}

                  <div className="my-1 h-px bg-border" />

                  <div className="p-2 text-xs font-medium text-muted-foreground">
                    Filtrer par arme
                  </div>
                  {getUniqueWeapons().map((weapon) => (
                    <DropdownMenuItem
                      key={weapon.id}
                      onClick={() => addFilter('weapon', weapon.id)}
                    >
                      <div className="flex flex-col">
                        <span>{weapon.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Numéro de Série: {weapon.serialNumber}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Période:
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`min-w-[240px] justify-start text-left font-normal ${
                      !dateRange?.from && 'text-muted-foreground'
                    }`}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd MMM', { locale: fr })} -{' '}
                          {format(dateRange.to, 'dd MMM yyyy', { locale: fr })}
                        </>
                      ) : (
                        format(dateRange.from, 'dd MMM yyyy', { locale: fr })
                      )
                    ) : (
                      <span>Sélectionner une période</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    locale={fr}
                    captionLayout="dropdown-months"
                    fromYear={2020}
                    toYear={new Date().getFullYear()}
                  />
                  <div className="p-3 border-t flex justify-between items-center bg-muted/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange(undefined)}
                    >
                      Effacer
                    </Button>
                    <Button
                      size="sm"
                      onClick={addDateRangeFilter}
                      disabled={!dateRange?.from}
                    >
                      Appliquer
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Active Filters */}
            {filters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => {
                  let displayValue = filter.value;
                  let displayType: string = filter.type;

                  // Format display based on filter type
                  if (filter.type === 'user') {
                    const user = logs.find((log) => log.user.id === filter.value)?.user;
                    displayValue = user?.name || user?.email || filter.value;
                    displayType = 'utilisateur';
                  } else if (filter.type === 'weapon') {
                    const weapon = logs.find((log) => log.weapon.id === filter.value)?.weapon;
                    displayValue = weapon?.name || filter.value;
                    displayType = 'arme';
                  } else if (filter.type === 'dateRange') {
                    const start = new Date(filter.value).toLocaleDateString('fr-FR');
                    const end = filter.endDate
                      ? new Date(filter.endDate).toLocaleDateString('fr-FR')
                      : "aujourd'hui";
                    displayValue = `${start} - ${end}`;
                    displayType = 'période';
                  } else if (filter.type === 'action') {
                    displayValue = translateLogAction(filter.value);
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

        {/* Table */}
        <Card>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Arme</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Aucun log trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getActionColorClass(log.action)}`}>
                          {translateLogAction(log.action)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.weapon.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Numéro de Série: {log.weapon.serialNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.user.name || log.user.email}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {log.notes || '-'}
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
          Affichage de {filteredLogs.length} sur {logs.length} logs
        </div>
      </div>
    </div>
  );
}
