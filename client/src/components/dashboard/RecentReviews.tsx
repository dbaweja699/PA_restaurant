import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { type Review } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex text-secondary">
      {[...Array(5)].map((_, i) => (
        <i key={i} className={`${i < rating ? 'ri-star-fill' : 'ri-star-line'}`}></i>
      ))}
    </div>
  );
}

export function RecentReviews() {
  const { data: reviews, isLoading } = useQuery<Review[]>({ 
    queryKey: ['/api/reviews'],
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-neutral-900">
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="w-full h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-neutral-900">
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-neutral-500 py-8">
            No reviews available.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Sort by date, newest first
  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 3);
  
  const getNewCount = () => {
    return reviews.filter(review => review.status === "new").length;
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium text-neutral-900">
          Recent Reviews
        </CardTitle>
        {getNewCount() > 0 && (
          <span className="text-xs font-medium px-2 py-1 bg-primary-light text-white rounded-full">
            {getNewCount()} new today
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-hide">
          {sortedReviews.map((review) => (
            <div key={review.id} className="border-b border-neutral-200 pb-3 last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center mr-2">
                    <span>{review.customerName.charAt(0)}</span>
                  </div>
                  <span className="font-medium text-neutral-800">
                    {review.customerName}
                  </span>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                "{review.comment}"
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {review.status === "responded" ? (
                  <>
                    <i className="ri-checkbox-circle-line text-accent"></i> AI responded {formatDistanceToNow(new Date(review.aiRespondedAt!), { addSuffix: true })}
                  </>
                ) : (
                  <span className="text-accent">
                    <i className="ri-time-line"></i> Awaiting AI response
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Button variant="link" asChild>
          <Link href="/reviews" className="text-accent hover:text-accent-dark text-sm font-medium">
            View All Reviews
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
