import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Review } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import { Star, MessageSquare, ThumbsUp } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`h-4 w-4 ${i < rating ? 'text-secondary fill-secondary' : 'text-neutral-300'}`} 
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case "google":
        return <i className="ri-google-line mr-1"></i>;
      case "yelp":
        return <i className="ri-yelp-line mr-1"></i>;
      case "tripadvisor":
        return <i className="ri-tripadvisor-line mr-1"></i>;
      case "facebook":
        return <i className="ri-facebook-circle-line mr-1"></i>;
      case "website":
        return <i className="ri-global-line mr-1"></i>;
      default:
        return <i className="ri-star-line mr-1"></i>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary">New</Badge>;
      case "responded":
        return <Badge variant="default" className="bg-accent">Responded</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-neutral-100 rounded-full flex items-center justify-center mr-3">
              {review.customer_name?.charAt(0) || '?'}
            </div>
            <div>
              <CardTitle className="text-base">
                {review.customer_name || 'Anonymous'}
              </CardTitle>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center text-xs text-neutral-500">
                  {getSourceIcon(review.source)}
                  {review.source.charAt(0).toUpperCase() + review.source.slice(1)}
                  <span className="mx-2">•</span>
                  {format(new Date(review.date), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <StarRating rating={review.rating} />
            <div className="mt-1">
              {getStatusBadge(review.status)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-neutral-700">
          "{review.comment}"
        </p>

        {expanded && review.aiResponse && (
          <div className="mt-4 bg-neutral-50 p-3 rounded-md text-sm">
            <p className="font-medium mb-1 flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" /> AI Response 
              <span className="text-xs text-neutral-500 ml-2">
                {review.aiRespondedAt && formatDistanceToNow(new Date(review.aiRespondedAt), { addSuffix: true })}
              </span>
            </p>
            <p className="italic">"{review.aiResponse}"</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-3">
        {review.aiResponse ? (
          <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Hide Response" : "Show Response"}
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Awaiting AI Response
          </Button>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1" /> Approve
          </Button>
          <Button size="sm">Respond Manually</Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function Reviews() {
  const { data: reviews, isLoading } = useQuery<Review[]>({ 
    queryKey: ['/api/reviews'],
  });

  const [filter, setFilter] = useState<"all" | "new" | "responded" | "archived">("all");

  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="flex gap-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const filteredReviews = reviews?.filter(review => {
    if (filter === "all") return true;
    return review.status === filter;
  }) || [];

  const newCount = reviews?.filter(r => r.status === "new").length || 0;
  const respondedCount = reviews?.filter(r => r.status === "responded").length || 0;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-neutral-900">Reviews</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Monitor customer reviews and AI-generated responses
        </p>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Reviews
        </Button>
        <Button
          variant={filter === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("new")}
        >
          New
          {newCount > 0 && (
            <Badge variant="secondary" className="ml-2">{newCount}</Badge>
          )}
        </Button>
        <Button
          variant={filter === "responded" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("responded")}
        >
          Responded
          {respondedCount > 0 && (
            <Badge variant="secondary" className="ml-2">{respondedCount}</Badge>
          )}
        </Button>
        <Button
          variant={filter === "archived" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("archived")}
        >
          Archived
        </Button>
      </div>

      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-neutral-500">No reviews matching the selected filter.</p>
          </CardContent>
        </Card>
      ) : (
        filteredReviews.map(review => <ReviewCard key={review.id} review={review} />)
      )}
    </div>
  );
}