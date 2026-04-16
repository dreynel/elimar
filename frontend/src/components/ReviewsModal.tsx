import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import { API_URL } from '@/lib/utils';
import Swal from 'sweetalert2';

interface Review {
  id: number;
  rating: number;
  comment: string;
  user_name: string | null;
  created_at: string;
}

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accommodationId: number;
  accommodationName: string;
}

export default function ReviewsModal({ isOpen, onClose, accommodationId, accommodationName }: ReviewsModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isOpen && accommodationId) {
      fetchReviews();
    }
  }, [isOpen, accommodationId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/reviews/${accommodationId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.data.reviews || []);
        setAverage(data.data.average || 0);
        setTotal(data.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      Swal.fire({ title: 'Error', text: 'Please select a star rating.', icon: 'error' });
      return;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) {
      Swal.fire({ title: 'Login Required', text: 'Please log in to leave a review.', icon: 'warning' });
      return;
    }
    const user = JSON.parse(userStr);

    try {
      setSubmitting(true);
      const payload = { rating, comment, user_id: user.id };
      const res = await fetch(`${API_URL}/api/reviews/${accommodationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        onClose();
        setTimeout(() => {
          Swal.fire({ title: 'Success', text: 'Review added successfully!', icon: 'success' });
          setRating(0);
          setHoverRating(0);
          setComment('');
        }, 100);
      } else {
        Swal.fire({ title: 'Error', text: data.message || 'Failed to add review.', icon: 'error' });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ title: 'Error', text: 'An unexpected error occurred.', icon: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (ratingValue: number) => {
    return Array.from({ length: 5 }).map((_, idx) => {
      const isFilled = idx < Math.floor(ratingValue);
      return (
        <Star
          key={idx}
          className={`w-4 h-4 ${isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Reviews for {accommodationName}</DialogTitle>
          <DialogDescription>
            See what others are saying, or leave your own review!
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          {/* Summary Section */}
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg">
            <div className="text-4xl font-bold text-primary">{average}</div>
            <div>
              <div className="flex">{renderStars(average)}</div>
              <div className="text-sm text-muted-foreground mt-1">Based on {total} reviews</div>
            </div>
          </div>

          {/* New Review Form */}
          <div className="border rounded-lg p-4 bg-card">
            <h4 className="font-semibold mb-3">Leave a Review</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="Tell us about your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Submit Review
              </Button>
            </form>
          </div>

          {/* Reviews List */}
          <div>
            <h4 className="font-semibold mb-3">All Comments</h4>
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-primary w-6 h-6" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 italic text-sm">
                No reviews yet. Be the first to review!
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">
                          {rev.user_name || 'Anonymous Guest'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(rev.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex mb-2 ml-9">
                      {renderStars(rev.rating)}
                    </div>
                    {rev.comment && (
                      <p className="text-sm text-gray-700 ml-9">{rev.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
