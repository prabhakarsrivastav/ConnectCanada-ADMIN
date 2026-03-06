import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Star, Trash2, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface PendingReview {
    _id: string;
    name: string;
    rating: number;
    comment: string;
    date: string;
    serviceIdMongo: {
        _id: string;
        title: string;
        category: string;
    };
    createdAt: string;
}

interface PendingReviewsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRefresh: () => void;
}

const PendingReviewsDialog = ({ open, onOpenChange, onRefresh }: PendingReviewsDialogProps) => {
    const { isDarkMode } = useDarkMode();
    const [reviews, setReviews] = useState<PendingReview[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPendingReviews = async () => {
        setLoading(true);
        try {
            const response = await api.admin.services.getPendingReviews();
            if (response.success) {
                setReviews(response.data || []);
            }
        } catch (error: any) {
            toast.error(error.message || "Error fetching pending reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchPendingReviews();
        }
    }, [open]);

    const handleApprove = async (reviewId: string) => {
        try {
            const response = await api.admin.services.approveReview(reviewId);
            if (response.success) {
                toast.success("Review approved and published!");
                setReviews(reviews.filter(r => r._id !== reviewId));
                onRefresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Error approving review");
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;
        try {
            const response = await api.admin.services.deleteReview(reviewId);
            if (response.success) {
                toast.success("Review deleted successfully");
                setReviews(reviews.filter(r => r._id !== reviewId));
                onRefresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Error deleting review");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-4xl max-h-[85vh] flex flex-col ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/20">
                            <MessageSquare className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <DialogTitle className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Pending Review Approvals
                            </DialogTitle>
                            <DialogDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                Moderate incoming feedback before it goes live.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 mt-4 p-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="animate-spin h-8 w-8 border-b-2 border-amber-500 rounded-full"></div>
                            <p className="text-gray-500">Fetching reviews...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="p-6 rounded-full bg-gray-100 dark:bg-gray-800 mb-4 text-gray-400">
                                <CheckCircle className="h-12 w-12" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
                            <p className="text-gray-500">No reviews are currently awaiting approval.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            {reviews.map((review) => (
                                <Card key={review._id} className={`${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                                    <CardContent className="p-5">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <Badge variant="outline" className="mb-2 bg-blue-500/10 text-blue-500 border-blue-500/30 truncate max-w-full">
                                                    {review.serviceIdMongo?.title || 'Unknown Service'}
                                                </Badge>
                                                <div className="flex items-center gap-2">
                                                    <p className={`font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{review.name}</p>
                                                    <div className="flex shrink-0">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 ml-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleApprove(review._id)}
                                                    className="h-9 w-9 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl"
                                                    title="Approve"
                                                >
                                                    <CheckCircle className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(review._id)}
                                                    className="h-9 w-9 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 mb-3`}>
                                            <p className={`text-sm italic line-clamp-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                "{review.comment}"
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{review.date}</span>
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">ID: {review._id.slice(-6)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {reviews.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800 text-center">
                        <p className="text-sm text-gray-500">You have {reviews.length} pending moderation items</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PendingReviewsDialog;
