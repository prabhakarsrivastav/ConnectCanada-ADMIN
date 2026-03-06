import React, { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, ShoppingCart, User, MoreVertical, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface Order {
    _id: string;
    userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    itemType: string;
    itemId: string;
    price: number;
    quantity: number;
    status: string;
    createdAt: string;
    serviceDetails?: {
        title: string;
        category: string;
        consultant: string;
        price: string;
    };
}

const OrderCalendar = () => {
    const { isDarkMode } = useDarkMode();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [currentMonth]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/purchases/orders/services?limit=1000`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.success) {
                setOrders(data.data.orders || []);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Failed to load orders for calendar");
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/purchases/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Order status updated to ${newStatus}`);
                setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
                fetchOrders(); // Refresh to ensure sync
            }
        } catch (error) {
            toast.error("Error updating order status");
        }
    };

    const dayRange = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth));
        const end = endOfWeek(endOfMonth(currentMonth));
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const ordersByDate = useMemo(() => {
        const map: Record<string, Order[]> = {};
        orders.forEach(order => {
            const dateStr = format(new Date(order.createdAt), "yyyy-MM-dd");
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(order);
        });
        return map;
    }, [orders]);

    const selectedDateOrders = useMemo(() => {
        return ordersByDate[format(selectedDate, "yyyy-MM-dd")] || [];
    }, [selectedDate, ordersByDate]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-500';
            case 'confirmed': return 'bg-blue-500';
            case 'pending': return 'bg-amber-500';
            case 'cancelled': return 'bg-red-500';
            case 'refunded': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <Card className="lg:col-span-2 shadow-2xl overflow-hidden border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20">
                            <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">{format(currentMonth, "MMMM yyyy")}</CardTitle>
                            <CardDescription>Service order distribution</CardDescription>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {dayRange.map((day, idx) => {
                            const dayOrders = ordersByDate[format(day, "yyyy-MM-dd")] || [];
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, currentMonth);

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedDate(day)}
                                    className={`min-h-[120px] p-2 border-r border-b border-gray-50 dark:border-gray-800 cursor-pointer transition-all duration-300 relative group
                    ${!isCurrentMonth ? 'bg-gray-50/30 dark:bg-gray-950/20' : ''}
                    ${isSelected ? 'bg-blue-500/5 dark:bg-blue-500/10' : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/30'}
                  `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center transition-colors
                      ${isSelected ? 'bg-blue-600 text-white' : isSameDay(day, new Date()) ? 'bg-red-500 text-white' : 'text-gray-600 dark:text-gray-400'}
                    `}>
                                            {format(day, "d")}
                                        </span>
                                        {dayOrders.length > 0 && (
                                            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-0 text-[10px] px-1.5 min-w-[18px] justify-center">
                                                {dayOrders.length}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="space-y-1 overflow-hidden h-16">
                                        {dayOrders.slice(0, 2).map((order) => (
                                            <div
                                                key={order._id}
                                                className="text-[10px] px-2 py-1 rounded-md flex items-center gap-1.5 truncate border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-800/80 shadow-sm"
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(order.status)}`} />
                                                <span className="truncate text-gray-700 dark:text-gray-300">
                                                    {order.userId?.firstName} • {order.serviceDetails?.title || 'Service'}
                                                </span>
                                            </div>
                                        ))}
                                        {dayOrders.length > 2 && (
                                            <div className="text-[10px] text-center text-gray-500 font-medium pt-0.5">
                                                +{dayOrders.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                    {isSelected && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 transition-all" />}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Selected Day View */}
            <Card className="shadow-2xl flex flex-col border-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                <CardHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Orders for {format(selectedDate, "MMM d, yyyy")}</CardTitle>
                        <Badge className="bg-blue-600">{selectedDateOrders.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden">
                    <ScrollArea className="h-[600px] p-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                                <div className="animate-spin h-6 w-6 border-b-2 border-blue-500 rounded-full" />
                                <p>Loading orders...</p>
                            </div>
                        ) : selectedDateOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-60 text-center space-y-3">
                                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800/50">
                                    <ShoppingCart className="h-8 w-8 text-gray-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold text-gray-600 dark:text-gray-300">No orders</p>
                                    <p className="text-sm text-gray-400">Nothing scheduled for this day</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedDateOrders.map(order => (
                                    <div
                                        key={order._id}
                                        className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 hover:shadow-lg transition-all transform hover:-translate-y-1 group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="space-y-1">
                                                <Badge variant="outline" className={`${getStatusColor(order.status)} bg-opacity-10 text-white border-0 capitalize`}>
                                                    {order.status}
                                                </Badge>
                                                <h4 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{order.serviceDetails?.title || 'Unknown Service'}</h4>
                                            </div>
                                            <Button variant="ghost" size="icon" className="-mr-2" onClick={() => { setSelectedOrder(order); setDetailsOpen(true); }}>
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="space-y-2 mb-4 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <User className="h-3.5 w-3.5" />
                                                <span className="truncate">{order.userId?.firstName} {order.userId?.lastName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{format(new Date(order.createdAt), "hh:mm a")}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-3 border-t border-gray-50 dark:border-gray-800">
                                            <Select value={order.status} onValueChange={(val) => updateOrderStatus(order._id, val)}>
                                                <SelectTrigger className="h-8 text-xs flex-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="confirmed">Confirmed</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    <SelectItem value="refunded">Refunded</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button size="sm" variant="outline" className="h-8 aspect-square p-0" onClick={() => window.open(`/admin/orders?search=${order._id}`, '_blank')}>
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-gray-950">
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>Order ID: {selectedOrder?._id}</DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Customer</p>
                                    <p className="font-semibold">{selectedOrder.userId?.firstName} {selectedOrder.userId?.lastName}</p>
                                    <p className="text-sm text-gray-400 truncate">{selectedOrder.userId?.email}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                                    <Badge className={`${getStatusColor(selectedOrder.status)} text-white`}>{selectedOrder.status}</Badge>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Service</p>
                                <p className="font-bold text-lg mb-1">{selectedOrder.serviceDetails?.title}</p>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">{selectedOrder.serviceDetails?.category}</span>
                                    <span className="font-bold text-blue-600">${(selectedOrder.price / 100).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button className="flex-1" variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => {
                                    window.open(`/admin/orders?search=${selectedOrder?._id}`, '_blank');
                                    setDetailsOpen(false);
                                }}>Full Records</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OrderCalendar;
