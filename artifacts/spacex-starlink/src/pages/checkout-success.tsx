import React, { useEffect } from "react";
import { Link } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useCheckoutSuccess } from "@workspace/api-client-react";
import { getCheckoutSuccessQueryKey } from "@workspace/api-client-react";
import { CheckCircle2, Package, MapPin, Calendar, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutSuccess() {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get("session_id") || undefined;

  const { data, isLoading, isError } = useCheckoutSuccess(
    { session_id: sessionId },
    {
      query: {
        enabled: !!sessionId,
        queryKey: getCheckoutSuccessQueryKey({ session_id: sessionId })
      }
    }
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-24 max-w-3xl flex items-center justify-center min-h-[70vh]">
        <Card className="w-full bg-background border-primary/30 shadow-[0_0_50px_rgba(0,212,255,0.05)] overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          
          <CardHeader className="text-center pt-10 pb-6">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold uppercase tracking-widest mb-2">Order Confirmed</CardTitle>
            <p className="text-muted-foreground text-lg">Welcome to the future of connectivity.</p>
          </CardHeader>
          
          <CardContent className="px-8 pb-10">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : isError || !data?.success ? (
              <div className="text-center py-8 text-destructive">
                There was an error retrieving your order details, but your payment may have been successful. 
                Please check your email for confirmation.
              </div>
            ) : data.subscription ? (
              <div className="space-y-6 bg-card rounded-lg p-6 border border-border">
                <h3 className="font-bold uppercase tracking-wider text-sm text-muted-foreground border-b border-border pb-2 mb-4">Subscription Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Plan</p>
                      <p className="font-medium">{data.subscription.planName}</p>
                      <p className="text-sm text-muted-foreground">${data.subscription.priceMonthly}/mo</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Service Address</p>
                      <p className="font-medium text-sm">{data.subscription.address || "No address provided"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Status</p>
                      <p className="font-medium capitalize text-green-500">{data.subscription.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-10 space-y-4 text-center">
              <h4 className="font-bold uppercase tracking-widest text-sm">Next Steps</h4>
              <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto list-disc pl-5">
                <li>Your hardware kit will ship within 1-2 weeks.</li>
                <li>You will receive a tracking number via email once shipped.</li>
                <li>Download the SpaceXStarlink app to prepare for setup.</li>
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="bg-card/50 border-t border-border px-8 py-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="outline" className="uppercase tracking-widest text-xs font-bold w-full sm:w-auto h-12 px-8">
                Return Home
              </Button>
            </Link>
            <Button className="uppercase tracking-widest text-xs font-bold w-full sm:w-auto h-12 px-8">
              Download App <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
