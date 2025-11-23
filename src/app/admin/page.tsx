
'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, DollarSign, Users, ShoppingCart, Package, TrendingUp, TrendingDown, UserPlus } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis } from "recharts";
import { getProducts } from "@/lib/products";
import type { Product, Order } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@supabase/supabase-js";
import { getAdminDashboardData } from "@/app/actions/get-admin-dashboard-data";
import {
  startOfWeek,
  subDays,
  subMonths,
  subYears,
  format as formatDate,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfMonth,
} from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))", icon: DollarSign },
  orders: { label: "Orders", color: "hsl(var(--chart-2))", icon: ShoppingCart },
  items: { label: "Items Sold", color: "hsl(var(--chart-3))", icon: Package },
  customers: { label: "New Customers", color: "hsl(var(--chart-4))", icon: UserPlus },
  issues: { label: "Cancellations/Refunds", color: "hsl(var(--destructive))", icon: TrendingDown },
} satisfies ChartConfig;

type ChartMetric = keyof typeof chartConfig;

const timeRangeOptions = [
    { label: "This Week", value: "7d" },
    { label: "1 Month", value: "30d" },
    { label: "6 Months", value: "6m" },
    { label: "1 Year", value: "1y" },
    { label: "Overall", value: "all" },
];

function AdminDashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-1/2" /></CardTitle>
                            <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold"><Skeleton className="h-8 w-3/4" /></div>
                            <div className="text-xs text-muted-foreground mt-1">
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle><Skeleton className="h-6 w-1/3" /></CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Skeleton className="h-[250px] w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
                        <div className="text-sm text-muted-foreground">
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-1/4" /></CardTitle>
                     <div className="text-sm text-muted-foreground">
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="font-medium"><Skeleton className="h-5 w-32" /></div>
                                        <div className="text-sm text-muted-foreground mt-1"><Skeleton className="h-4 w-24" /></div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [activeChart, setActiveChart] = useState<ChartMetric>("revenue");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [productsData, adminData] = await Promise.all([
            getProducts(),
            getAdminDashboardData()
        ]);
        
        setProducts(productsData);
        setOrders(adminData.orders);
        setUsers(adminData.users);
    } catch (error) {
        console.error("Failed to fetch admin dashboard data:", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dashboardStats = useMemo(() => {
    if (isLoading) return { totalRevenue: 0, totalOrders: 0, totalProductsSold: 0, chartData: [], sortedTopProducts: [] };

    const validOrders = orders.filter(o => o.order_status !== 'Cancelled' && o.order_status !== 'Refunded' && o.order_status !== 'Cancellation Pending');
    
    const totalRevenue = validOrders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = orders.length;
    const totalProductsSold = validOrders.reduce((acc, order) => acc + (order.cart_items || []).reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0);
    
    // Chart Data Calculation
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        break;
      case '30d':
        startDate = subDays(now, 29);
        break;
      case '6m':
        startDate = startOfMonth(subMonths(now, 5));
        break;
      case '1y':
        startDate = startOfMonth(subYears(now, 1));
        break;
      default: // 'all'
        startDate = orders.length > 0 ? new Date(orders[orders.length - 1].order_date) : now;
    }
    
    const filteredOrders = orders.filter(o => new Date(o.order_date) >= startDate);
    const filteredValidOrders = validOrders.filter(o => new Date(o.order_date) >= startDate);
    const filteredUsers = users.filter(u => u.created_at && new Date(u.created_at) >= startDate);
    const filteredIssueOrders = filteredOrders.filter(o => ['Cancelled', 'Refunded', 'Cancellation Pending'].includes(o.order_status));

    const getAggregator = (grouping: 'day' | 'month') => (date: Date) => grouping === 'day' ? formatDate(date, 'MMM d') : formatDate(date, 'MMM yyyy');

    const aggregateData = (data: any[], dateField: string, valueField?: string) => {
        const isMonthly = timeRange === '6m' || timeRange === '1y' || timeRange === 'all';
        const getGroupKey = getAggregator(isMonthly ? 'month' : 'day');
        
        const aggregated = data.reduce((acc, item) => {
            const groupKey = getGroupKey(new Date(item[dateField]));
            acc[groupKey] = (acc[groupKey] || 0) + (valueField ? item[valueField] : 1);
            return acc;
        }, {} as Record<string, number>);

        const range = isMonthly ? eachMonthOfInterval({ start: startDate, end: now }) : eachDayOfInterval({ start: startDate, end: now });

        return range.map(date => {
            const key = getGroupKey(date);
            return { name: key, value: aggregated[key] || 0 };
        });
    };
    
    const aggregateItemsSold = () => {
       const isMonthly = timeRange === '6m' || timeRange === '1y' || timeRange === 'all';
       const getGroupKey = getAggregator(isMonthly ? 'month' : 'day');

       const aggregated = filteredValidOrders.reduce((acc, order) => {
           const groupKey = getGroupKey(new Date(order.order_date));
           const itemsInOrder = order.cart_items.reduce((sum, item) => sum + item.quantity, 0);
           acc[groupKey] = (acc[groupKey] || 0) + itemsInOrder;
           return acc;
       }, {} as Record<string, number>);
       
       const range = isMonthly ? eachMonthOfInterval({ start: startDate, end: now }) : eachDayOfInterval({ start: startDate, end: now });

        return range.map(date => {
            const key = getGroupKey(date);
            return { name: key, value: aggregated[key] || 0 };
        });
    };

    const chartData = {
        revenue: aggregateData(filteredValidOrders, 'order_date', 'total'),
        orders: aggregateData(filteredOrders, 'order_date'),
        items: aggregateItemsSold(),
        customers: aggregateData(filteredUsers, 'created_at'),
        issues: aggregateData(filteredIssueOrders, 'order_date'),
    };

    const topSellingProducts = validOrders
        .flatMap(o => o.cart_items || [])
        .reduce((acc, item) => {
            const productId = item.productId || item.product?.productId;
            if (productId) {
                acc[productId] = (acc[productId] || 0) + item.quantity;
            }
            return acc;
        }, {} as { [key: string]: number });
    
    const sortedTopProducts = Object.entries(topSellingProducts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([productId, quantity]) => ({
            product: products.find(p => p.productId === productId),
            quantity
        }));


    return {
        totalRevenue,
        totalOrders,
        totalProductsSold,
        chartData,
        sortedTopProducts
    }
  }, [orders, products, users, isLoading, timeRange]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
      .slice(0, 5);
  }, [orders]);
  

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  const chartFormatter = (value: number) => {
    if (activeChart === 'revenue') return formatPrice(value);
    return value.toLocaleString();
  }
  
  const ActiveIcon = chartConfig[activeChart].icon || TrendingUp;


  return (
    <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatPrice(dashboardStats.totalRevenue)}</div>
                    <div className="text-xs text-muted-foreground">
                        From {dashboardStats.totalOrders} valid orders
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalOrders}</div>
                     <div className="text-xs text-muted-foreground">
                        {orders.filter(o => new Date(o.order_date).getMonth() === new Date().getMonth()).length} this month
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dashboardStats.totalProductsSold}</div>
                    <div className="text-xs text-muted-foreground">
                        In valid orders
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                    <div className="text-xs text-muted-foreground">
                        Registered users
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                         <Select value={activeChart} onValueChange={(val) => setActiveChart(val as ChartMetric)}>
                            <SelectTrigger className="w-[200px] h-auto p-0 border-none text-2xl font-bold font-headline focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(chartConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <CardDescription>
                            Showing {chartConfig[activeChart].label} for the selected period.
                        </CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                        {timeRangeOptions.map((option) => (
                            <Button
                                key={option.value}
                                size="sm"
                                variant={timeRange === option.value ? 'default' : 'outline'}
                                onClick={() => setTimeRange(option.value)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                      <AreaChart
                        accessibilityLayer
                        data={dashboardStats.chartData[activeChart]}
                        margin={{
                          left: 12,
                          right: 12,
                        }}
                      >
                        <defs>
                            <linearGradient id={`color-${activeChart}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartConfig[activeChart].color} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={chartConfig[activeChart].color} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={chartFormatter}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent 
                                indicator="dot" 
                                formatter={chartFormatter}
                                icon={ActiveIcon}
                                labelClassName="capitalize"
                                name={activeChart}
                            />}
                        />
                        <Area
                          dataKey="value"
                          type="natural"
                          fill={`url(#color-${activeChart})`}
                          fillOpacity={0.4}
                          stroke={chartConfig[activeChart].color}
                          stackId="a"
                        />
                      </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                    <CardDescription>Top 5 products by quantity sold.</CardDescription>
                </CardHeader>
                <CardContent>
                    {dashboardStats.sortedTopProducts.map(({ product, quantity }) => (
                       product && <div key={product.productId} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                            <span className="truncate pr-4">{product.productName}</span>
                            <span className="font-semibold">{quantity} sold</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>A quick look at the latest 5 orders.</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/admin/orders">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentOrders.map(order => (
                            <TableRow key={order.order_id}>
                                <TableCell>
                                    <div className="font-medium">{order.shipping_details?.name}</div>
                                    <div className="text-sm text-muted-foreground">{order.shipping_details?.city}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge>{order.order_status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{formatPrice(order.total)}</TableCell>
                                <TableCell className="text-right">{new Date(order.order_date).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
