'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Shield, AlertCircle, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { translateWeaponStatus } from '@/lib/translations';
import Image from 'next/image';

interface Weapon {
  id: string;
  serialNumber: string;
  name: string;
  weaponType: {
    id: string;
    name: string;
    image: string;
    category?: string;
  };
  description?: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'RETIRED';
  ammunition?: number;
}

interface WeaponCardProps {
  weapon: Weapon;
  isDraggable?: boolean;
}

export function WeaponCard({ weapon, isDraggable = false }: WeaponCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: weapon.id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusConfig = {
    AVAILABLE: { variant: 'default' as const, icon: Shield, className: '' },
    ASSIGNED: { variant: 'secondary' as const, icon: Shield, className: '' },
    MAINTENANCE: { variant: 'outline' as const, icon: Wrench, className: 'bg-[#800020] text-white border-[#800020] hover:bg-[#6b001a]' },
    RETIRED: { variant: 'outline' as const, icon: AlertCircle, className: '' },
  };

  const { variant, icon: StatusIcon, className } = statusConfig[weapon.status];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="transition-all hover:shadow-md relative"
    >
      {/* Badge du statut en haut à droite */}
      <div className="absolute top-3 right-3 z-10">
        <Badge variant={variant} className={className}>
          {translateWeaponStatus(weapon.status)}
        </Badge>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Image de l'arme */}
          {weapon.weaponType.image && (
            <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              <Image
                src={weapon.weaponType.image}
                alt={weapon.weaponType.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            </div>
          )}

          <div className="flex-1 space-y-2 min-w-0 pr-20">
            <div className="flex items-center gap-2">
              <StatusIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-medium truncate">{weapon.name}</h3>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Numéro de Série: {weapon.serialNumber}</p>
              <p>Type: {weapon.weaponType.name}</p>
              <p>Munitions: {weapon.ammunition ?? 0} balles</p>
              {weapon.description && (
                <p className="text-xs line-clamp-2">{weapon.description}</p>
              )}
            </div>
          </div>

          {isDraggable && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0 absolute bottom-3 right-3">
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
