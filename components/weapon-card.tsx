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
      <div className="absolute top-2 right-2 z-10">
        <Badge variant={variant} className={`text-xs ${className}`}>
          {translateWeaponStatus(weapon.status)}
        </Badge>
      </div>

      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Image de l'arme */}
          {weapon.weaponType.image && (
            <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-muted">
              <Image
                src={weapon.weaponType.image}
                alt={weapon.weaponType.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          )}

          <div className="flex-1 space-y-1 min-w-0 pr-16">
            <div className="flex items-center gap-1.5">
              <StatusIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <h3 className="font-medium text-sm truncate">{weapon.name}</h3>
            </div>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <p>S/N: {weapon.serialNumber}</p>
              <p className="flex items-center gap-1">
                <span className="font-medium">{weapon.weaponType.name}</span>
                <span className="text-xs">• {weapon.ammunition ?? 0} balles</span>
              </p>
            </div>
          </div>

          {isDraggable && (
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0 absolute bottom-2 right-2">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
