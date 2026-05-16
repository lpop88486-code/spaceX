import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  useListSubscriptions, 
  useUpdateSubscription,
  getListSubscriptionsQueryKey,
  ListSubscriptionsStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban } from "lucide-react";

export default function AdminSubscriptions() {
  const [statusFilter, setStatusFilter] = useState<ListSubscriptionsStatus>("all");
  
  const { data, isLoading } = useListSubscriptions({ 
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 50 
  });
  
  const subscriptions = data?.subscriptions || [];
  
  const updateSub = useUpdateSubscription();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleCancel = (id: number) => {
    if (confirm("Are you sure you want to cancel this subscription?")) {
      updateSub.mutate(
        { id, data: { status: "cancelled" } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
            toast({ title: "Subscription cancelled" });
          }
        }
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-green-400 border-green-400/30 bg-green-400/10";
      case "cancelled": return "text-red-400 border-red-400/30 bg-red-400/10";
      case "past_due": return "text-orange-400 border-orange-400/30 bg-orange-400/10";
      default: return "text-muted-foreground border-border";
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-white">Subscriptions</h1>
          <p className="text-muted-foreground mt-2">Manage customer accounts and terminals.</p>
        </div>
        
        <div className="w-[200px]">
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="past_due">Past Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="uppercase tracking-widest text-xs font-bold">Customer</TableHead>
              <TableHead className="uppercase tracking-widest text-xs font-bold">Plan</TableHead>
              <TableHead className="uppercase tracking-widest text-xs font-bold">Value</TableHead>
              <TableHead className="uppercase tracking-widest text-xs font-bold">Created</TableHead>
              <TableHead className="uppercase tracking-widest text-xs font-bold">Status</TableHead>
              <TableHead className="uppercase tracking-widest text-xs font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading subscriptions...</TableCell>
              </TableRow>
            ) : subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No subscriptions found.</TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub.id} className="border-border hover:bg-white/5">
                  <TableCell>
                    <div className="font-medium text-white">{sub.name || "N/A"}</div>
                    <div className="text-xs text-muted-foreground">{sub.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{sub.planName}</div>
                    <div className="text-xs text-muted-foreground capitalize">{sub.planCategory}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    ${sub.priceMonthly}/mo
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(sub.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`uppercase tracking-wider text-[10px] ${getStatusColor(sub.status)}`}>
                      {sub.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {sub.status === 'active' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs uppercase tracking-wider"
                        onClick={() => handleCancel(sub.id)}
                        disabled={updateSub.isPending}
                        data-testid={`button-cancel-sub-${sub.id}`}
                      >
                        <Ban className="w-3 h-3 mr-2" /> Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </AdminLayout>
  );
}
