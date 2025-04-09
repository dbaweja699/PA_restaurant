import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Review } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
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

// Helper function to safely access review data with database field name fallbacks
const getReviewData = (review: any) => {
  console.log("Processing review:", review);

  return {
    id: review.id,
    source: review.source || '',
    comment: review.comment || '',
    rating: review.rating || 0,
    status: review.status || 'new',
    customerName: review.customerName || review.customer_name || 'Anonymous',
    date: review.date || new Date(),
    aiResponse: review.aiResponse || review.ai_response,
    aiRespondedAt: review.aiRespondedAt || review.ai_responded_at,
    postedResponse: review.postedResponse || review.posted_response,
    responseType: review.responseType || review.response_type || 'ai_approved'
  };
};

function ReviewCard({ review }: { review: Review | any }) {
  const [expanded, setExpanded] = useState(false);

  // Handle both snake_case from direct DB and camelCase from schema
  const { 
    id, source, comment, rating, status, customerName, date, 
    aiResponse, aiRespondedAt, postedResponse, responseType 
  } = getReviewData(review);

  // Function to approve AI response
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveAIResponse = async () => {
    try {
      console.log(`Approving AI response for review ID: ${id}`);

      const updateData = {
        status: 'responded',
        posted_response: aiResponse,
        response_type: 'ai_approved'
      };

      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Error updating review: ${response.statusText}`);
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      toast({
        title: "Success",
        description: "AI response approved and posted successfully!",
        variant: "default",
      });
    } catch (err) {
      console.error('Error approving AI response:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Function to submit manual response
  const submitManualResponse = async (manualResponse: string) => {
    try {
      console.log(`Submitting manual response for review ID: ${id}`);

      const updateData = {
        status: 'responded',
        posted_response: manualResponse,
        response_type: 'manual'
      };

      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Error updating review: ${response.statusText}`);
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      alert('Manual response posted successfully!');
    } catch (err) {
      console.error('Error posting manual response:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('Failed to post manual response: ' + message);
    }
  };

  const getSourceIcon = (source: string) => {
    if (!source) return <i className="ri-star-line mr-1"></i>;

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
    if (!status) return <Badge variant="outline">Unknown</Badge>;

    switch (status.toLowerCase()) {
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
              {customerName.charAt(0) || '?'}
            </div>
            <div>
              <CardTitle className="text-base">
                {customerName}
              </CardTitle>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center text-xs text-neutral-500">
                  {getSourceIcon(source)}
                  {source && source.charAt(0).toUpperCase() + source.slice(1)}
                  <span className="mx-2">•</span>
                  {date && format(new Date(date), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <StarRating rating={rating} />
            <div className="mt-1">
              {getStatusBadge(status)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-neutral-700">
          "{comment}"
        </p>

        {expanded && (
          <>
            {aiResponse && (
              <div className="mt-4 bg-neutral-50 p-3 rounded-md text-sm">
                <p className="font-medium mb-1 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" /> AI Suggested Response 
                  <span className="text-xs text-neutral-500 ml-2">
                    {aiRespondedAt && formatDistanceToNow(new Date(aiRespondedAt), { addSuffix: true })}
                  </span>
                </p>
                <p className="italic">"{aiResponse}"</p>
              </div>
            )}

            {postedResponse && (
              <div className="mt-4 bg-green-50 p-3 rounded-md text-sm">
                <p className="font-medium mb-1 flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-1" /> Posted Response 
                  <Badge className="ml-2" variant="outline">
                    {responseType === 'manual' ? 'Manual' : 'AI Approved'}
                  </Badge>
                </p>
                <p className="italic">"{postedResponse}"</p>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-3">
        {aiResponse ? (
          <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Hide Response" : "Show Response"}
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Awaiting AI Response
          </Button>
        )}

        <div className="flex gap-2">
          {aiResponse && !postedResponse && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center"
                onClick={approveAIResponse}
              >
                <ThumbsUp className="h-4 w-4 mr-1" /> Approve AI Response
              </Button>
              <Button 
                size="sm"
                onClick={() => {
                  const manualResponse = prompt('Enter your manual response:', aiResponse);
                  if (manualResponse) {
                    submitManualResponse(manualResponse);
                  }
                }}
              >
                Respond Manually
              </Button>
            </>
          )}
          {postedResponse && (
            <Button 
              size="sm" 
              variant="outline"
              disabled
            >
              {responseType === 'manual' ? 'Manually Responded' : 'AI Response Approved'}
            </Button>
          )}
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