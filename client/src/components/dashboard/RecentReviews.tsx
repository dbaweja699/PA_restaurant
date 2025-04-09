import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { type Review } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

// Extended type to handle both camelCase and snake_case fields
interface ReviewWithSnakeCase extends Review {
  customer_name?: string;
  ai_response?: string | null;
  ai_responded_at?: Date | null;
  posted_response?: string | null;
  response_type?: string;
}

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
  const { data: reviews, isLoading } = useQuery<ReviewWithSnakeCase[]>({ 
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
          {sortedReviews.map((review) => {
            // Type assertion to fix TypeScript errors
            const reviewData = review as ReviewWithSnakeCase;
            return (
              <div key={reviewData.id} className="border-b border-neutral-200 pb-3 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center mr-2">
                      <span>
                        {/* Handle both camelCase and snake_case field names */}
                        {((reviewData.customerName || reviewData.customer_name) || "").charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-neutral-800">
                      {/* Prefer the actual customer name over placeholder */}
                      {reviewData.customerName || reviewData.customer_name || "Customer"}
                    </span>
                  </div>
                  <StarRating rating={reviewData.rating} />
                </div>
                <p className="mt-2 text-sm text-neutral-600">
                  "{reviewData.comment}"
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {reviewData.status === "responded" ? (
                    <>
                      <i className="ri-checkbox-circle-line text-accent"></i> 
                      {(reviewData.postedResponse || reviewData.posted_response) ? (
                        <>
                          <span className="font-medium">
                            {(reviewData.responseType || reviewData.response_type) === 'manual' 
                              ? 'Manually responded' 
                              : 'AI response approved'}
                          </span> {
                            (() => {
                              const respondedDate = reviewData.aiRespondedAt || reviewData.ai_responded_at;
                              if (respondedDate) {
                                return formatDistanceToNow(new Date(respondedDate), { addSuffix: true });
                              }
                              return "";
                            })()
                          }
                        </>
                      ) : (
                        <>
                          AI responded {
                            (() => {
                              const respondedDate = reviewData.aiRespondedAt || reviewData.ai_responded_at;
                              if (respondedDate) {
                                return formatDistanceToNow(new Date(respondedDate), { addSuffix: true });
                              }
                              return "";
                            })()
                          }
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-accent">
                      <i className="ri-time-line"></i> Awaiting AI response
                    </span>
                  )}
                </p>
              </div>
            );
          })}
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
