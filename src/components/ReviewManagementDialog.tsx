import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Service } from "@/pages/admin/ManageServices";
import { api } from "@/lib/api";
import { Star, Trash2, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface Review {
    _id: string;
    name: string;
    rating: number;
    comment: string;
    date: string;
    isApproved: boolean;
    createdAt: string;
}

interface ReviewManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    service: Service | null;
    onRefresh: () => void;
}

const ReviewManagementDialog = ({ open, onOpenChange, service, onRefresh }: ReviewManagementDialogProps) => {
    const { isDarkMode } = useDarkMode();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        rating: 5,
        comment: "",
    });

    const fetchReviews = async () => {
        if (!service) return;
        setLoading(true);
        try {
            const response = await api.admin.services.getReviews(service._id);
            if (response.success) {
                setReviews(response.data || []);
            }
        } catch (error: any) {
            toast.error(error.message || "Error fetching reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && service) {
            fetchReviews();
        }
    }, [open, service]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!service) return;
        setSubmitting(true);
        try {
            const response = await api.admin.services.addReview(service._id, formData);
            if (response.success) {
                toast.success("Review added successfully");
                setFormData({ name: "", rating: 5, comment: "" });
                fetchReviews();
                onRefresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Error adding review");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm("Are you sure you want to delete this review?")) return;
        try {
            const response = await api.admin.services.deleteReview(reviewId);
            if (response.success) {
                toast.success("Review deleted successfully");
                fetchReviews();
                onRefresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Error deleting review");
        }
    };

    const handleApprove = async (reviewId: string) => {
        try {
            const response = await api.admin.services.approveReview(reviewId);
            if (response.success) {
                toast.success("Review approved and published!");
                fetchReviews();
                onRefresh();
            }
        } catch (error: any) {
            toast.error(error.message || "Error approving review");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-4xl max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                <DialogHeader className="pb-4 border-b border-gray-200 dark:border-gray-800">
                    <DialogTitle className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Manage Reviews: {service?.title}
                    </DialogTitle>
                    <DialogDescription className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        View, add, or delete client reviews for this service.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 flex-1 min-h-0">
                    {/* Add Review Form */}
                    <div className="space-y-4">
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Add Dummy Review</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Client Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. John Doe"
                                    required
                                    className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rating" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Rating (1-5)</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="rating"
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                                        required
                                        className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                                    />
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`h-5 w-5 ${star <= formData.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`}
                                                onClick={() => setFormData({ ...formData, rating: star })}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="comment" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Comment</Label>
                                <Textarea
                                    id="comment"
                                    value={formData.comment}
                                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                    placeholder="Write a dummy review comment..."
                                    rows={4}
                                    required
                                    className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
                                <Plus className="h-4 w-4 mr-2" />
                                {submitting ? "Adding..." : "Add Review"}
                            </Button>
                        </form>
                    </div>

                    {/* Review List */}
                    <div className="flex flex-col min-h-0">
                        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Existing Reviews ({reviews.length})</h3>
                        <ScrollArea className="flex-1 rounded-md border border-gray-200 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-950/20">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin h-6 w-6 border-b-2 border-blue-500 rounded-full"></div>
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No reviews found for this service.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <Card key={review._id} className={isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{review.name}</p>
                                                        <div className="flex gap-1 mt-1">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!review.isApproved && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleApprove(review._id)}
                                                                className="h-8 w-8 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                                title="Approve Review"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(review._id)}
                                                            className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            title="Delete Review"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className={`text-sm italic ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>"{review.comment}"</p>
                                                    {!review.isApproved && (
                                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/50 text-[10px] h-5">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                    {review.isApproved && (
                                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50 text-[10px] h-5">
                                                            Published
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">{review.date}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReviewManagementDialog;
