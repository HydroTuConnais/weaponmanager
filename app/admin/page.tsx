'use client';

import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { Users, Shield, Activity, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWeapons: 0,
    assignedWeapons: 0,
    availableWeapons: 0,
  });

  useEffect(() => {
    if ((session?.user as any)?.role === 'ADMIN') {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const [usersRes, weaponsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/weapons'),
      ]);

      const users = await usersRes.json();
      const weapons = await weaponsRes.json();

      setStats({
        totalUsers: users.length,
        totalWeapons: weapons.length,
        assignedWeapons: weapons.filter((w: any) => w.status === 'ASSIGNED').length,
        availableWeapons: weapons.filter((w: any) => w.status === 'AVAILABLE').length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Veuillez vous connecter pour accéder au dashboard admin</p>
      </div>
    );
  }

  if ((session.user as any).role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Accès refusé. Réservé aux administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total d'armes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.totalWeapons}</div>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Armes assignées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.assignedWeapons}</div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Armes disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.availableWeapons}</div>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Link href="/admin/users" className="block">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">Gestion des utilisateurs</h3>
                    <p className="text-sm text-muted-foreground">
                      Voir et gérer tous les utilisateurs
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Link href="/admin/weapons" className="block">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">Gestion des armes</h3>
                    <p className="text-sm text-muted-foreground">
                      Voir et gérer toutes les armes
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <Link href="/admin/logs" className="block">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">Logs d'activité</h3>
                    <p className="text-sm text-muted-foreground">
                      Voir l'historique des actions
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
