import React from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetAdminStats, useGetRevenueStats } from "@workspace/api-client-react";
import { Users, Activity, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: revenue, isLoading: revenueLoading } = useGetRevenueStats();

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Network overview and revenue metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Active Terminals" 
          value={stats?.activeSubscriptions} 
          icon={Activity} 
          loading={statsLoading}
          trend="+12% from last month"
        />
        <StatCard 
          title="Total Subscriptions" 
          value={stats?.totalSubscriptions} 
          icon={Users} 
          loading={statsLoading} 
        />
        <StatCard 
          title="Monthly MRR" 
          value={stats?.monthlyRevenue ? `$${stats.monthlyRevenue.toLocaleString()}` : undefined} 
          icon={DollarSign} 
          loading={statsLoading}
          trend="+8% from last month" 
        />
        <StatCard 
          title="New This Month" 
          value={stats?.newThisMonth} 
          icon={TrendingUp} 
          loading={statsLoading} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Revenue Trajectory</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[350px]">
            {revenueLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue?.monthly || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[350px]">
            {statsLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.planBreakdown || []} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="planName" type="category" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))', opacity: 0.2}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon: Icon, loading, trend }: { title: string, value?: number | string, icon: any, loading: boolean, trend?: string }) {
  return (
    <Card className="bg-card border-border overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-16 h-16 text-primary" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-24" />
        ) : (
          <div>
            <div className="text-3xl font-bold tracking-tighter text-white">{value ?? 0}</div>
            {trend && <div className="text-xs text-primary mt-2 font-medium">{trend}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
