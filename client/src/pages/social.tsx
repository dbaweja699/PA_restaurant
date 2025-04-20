import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type SocialMedia } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { MessageSquare, Share2, ThumbsUp, ThumbsDown, Plus, Loader2, Undo2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function SocialPlatformIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case "facebook":
      return <i className="ri-facebook-circle-fill text-[#1877F2] text-xl"></i>;
    case "instagram":
      return <i className="ri-instagram-fill text-[#E4405F] text-xl"></i>;
    case "twitter":
    case "x":
      return <i className="ri-twitter-x-fill text-black text-xl"></i>;
    case "tiktok":
      return <i className="ri-tiktok-fill text-[#000000] text-xl"></i>;
    case "yelp":
      return <i className="ri-yelp-fill text-[#FF1A1A] text-xl"></i>;
    case "tripadvisor":
      return <i className="ri-tripadvisor-fill text-[#00AF87] text-xl"></i>;
    default:
      return <i className="ri-global-line text-neutral-600 text-xl"></i>;
  }
}

// Helper function to safely access social media data with database field name fallbacks
const getSocialData = (post: any) => {
  return {
    platform: post.platform || '',
    author: post.author || '',
    content: post.content || '',
    status: post.status || 'pending',
    postTime: post.postTime || post.post_time || new Date(),
    aiResponse: post.aiResponse || post.ai_response,
    aiRespondedAt: post.aiRespondedAt || post.ai_responded_at
  };
};

function SocialCard({ post }: { post: SocialMedia | any }) {
  const [expanded, setExpanded] = useState(false);
  
  // Handle both snake_case from direct DB and camelCase from schema
  const { platform, author, content, status, postTime, aiResponse, aiRespondedAt } = getSocialData(post);
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "responded":
        return <Badge className="bg-green-100 text-green-800">Responded</Badge>;
      case "flagged":
        return <Badge className="bg-red-100 text-red-800">Flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3 bg-neutral-100">
              <SocialPlatformIcon platform={platform} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center">
                {author}
                <Badge variant="outline" className="ml-2 capitalize">{platform}</Badge>
              </CardTitle>
              <div className="text-xs text-neutral-500 mt-1">
                {postTime && format(new Date(postTime), "MMMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          </div>
          {getStatusBadge(status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-neutral-700 mb-4">
          {content}
        </div>
        
        {expanded && aiResponse && (
          <div className="mt-4 bg-neutral-50 p-3 rounded-md text-sm">
            <p className="font-medium mb-1 flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" /> AI Response 
              <span className="text-xs text-neutral-500 ml-2">
                {aiRespondedAt && format(new Date(aiRespondedAt), "MMM d, h:mm a")}
              </span>
            </p>
            <p className="italic">{aiResponse}</p>
          </div>
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
          <Button size="sm" variant="outline" className="flex items-center">
            <ThumbsUp className="h-4 w-4 mr-1" /> Approve
          </Button>
          <Button size="sm">Respond Manually</Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function Social() {
  // All hooks must be at the top in the same order
  const [activeTab, setActiveTab] = useState("all");
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPostId, setGeneratedPostId] = useState<number | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{ imageUrl: string, caption: string } | null>(null);
  const [showSuggestionInput, setShowSuggestionInput] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  
  // Hooks
  const { toast } = useToast();
  const { data: socialPosts, isLoading } = useQuery<SocialMedia[]>({ 
    queryKey: ['/api/social'],
  });
  
  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await apiRequest("POST", "/api/social", postData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/social'] });
      return data;
    },
    onError: (error) => {
      toast({
        title: "Error creating post",
        description: "There was a problem creating your post.",
        variant: "destructive",
      });
    }
  });
  
  // Webhook interaction mutation using local proxy
  const sendWebhookMutation = useMutation({
    mutationFn: async (webhookData: any) => {
      const response = await apiRequest("POST", "/api/proxy/socialmedia", webhookData);
      
      if (!response.ok) {
        throw new Error("Failed to send webhook request");
      }
      
      return await response.json();
    },
    onError: (error) => {
      toast({
        title: "Error processing request",
        description: "There was a problem connecting to the webhook service.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  });
  
  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <Skeleton className="h-12 w-full mb-4" />
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  // Group posts by platform
  const platforms = socialPosts ? 
    Array.from(new Set(socialPosts.map(post => getSocialData(post).platform))) : 
    [];
  
  const filteredPosts = socialPosts?.filter(post => {
    const { status, platform } = getSocialData(post);
    
    if (activeTab === "all") return true;
    if (activeTab === "pending") return status.toLowerCase() === "pending";
    if (activeTab === "responded") return status.toLowerCase() === "responded";
    return platform.toLowerCase() === activeTab.toLowerCase();
  }) || [];
  
  const pendingCount = socialPosts?.filter(post => 
    getSocialData(post).status.toLowerCase() === "pending"
  ).length || 0;
  
  const respondedCount = socialPosts?.filter(post => 
    getSocialData(post).status.toLowerCase() === "responded"
  ).length || 0;
  
  // Fetch a specific post
  const fetchPost = async (id: number) => {
    try {
      const response = await apiRequest("GET", `/api/social/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching post:", error);
      return null;
    }
  };
  
  // Handle generating a post
  const handleGeneratePost = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a prompt to generate a post.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Create the initial post
      const newPost = await createPostMutation.mutateAsync({
        platform: "AI Generated",
        content: "AI generated post (in progress)",
        author: "AI Assistant",
        status: "generation",
        prompt: prompt,
        postTime: new Date().toISOString(),
      });
      
      setGeneratedPostId(newPost.id);
      
      // Send webhook
      await sendWebhookMutation.mutateAsync({
        id: newPost.id,
        status: "generation",
        prompt: prompt,
      });
      
      // Wait for 15 seconds
      setTimeout(async () => {
        // Fetch the updated post
        const updatedPost = await fetchPost(newPost.id);
        
        if (updatedPost && updatedPost.post_content) {
          // Parse the post_content
          const parts = updatedPost.post_content.split('%');
          if (parts.length >= 2) {
            setGeneratedContent({
              imageUrl: parts[0],
              caption: parts[1],
            });
          } else {
            toast({
              title: "Invalid response format",
              description: "The generated content is not in the expected format.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Generation incomplete",
            description: "The post was not generated successfully. Please try again.",
            variant: "destructive",
          });
        }
        
        setIsGenerating(false);
      }, 15000);
      
    } catch (error) {
      console.error("Error generating post:", error);
      toast({
        title: "Error generating post",
        description: "There was a problem generating your post.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };
  
  // Handle retry
  const handleRetry = async () => {
    if (!generatedPostId) return;
    
    if (showSuggestionInput && !suggestion.trim()) {
      toast({
        title: "Empty suggestion",
        description: "Please enter a suggestion for improving the post.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedContent(null);
    
    try {
      // Send webhook for retry
      await sendWebhookMutation.mutateAsync({
        id: generatedPostId,
        status: "retry",
        suggestion: suggestion,
      });
      
      // Wait for 15 seconds
      setTimeout(async () => {
        // Fetch the updated post
        const updatedPost = await fetchPost(generatedPostId);
        
        if (updatedPost && updatedPost.post_content) {
          // Parse the post_content
          const parts = updatedPost.post_content.split('%');
          if (parts.length >= 2) {
            setGeneratedContent({
              imageUrl: parts[0],
              caption: parts[1],
            });
          } else {
            toast({
              title: "Invalid response format",
              description: "The generated content is not in the expected format.",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Generation incomplete",
            description: "The post was not regenerated successfully. Please try again.",
            variant: "destructive",
          });
        }
        
        setIsGenerating(false);
        setShowSuggestionInput(false);
        setSuggestion("");
      }, 15000);
      
    } catch (error) {
      console.error("Error retrying post:", error);
      toast({
        title: "Error retrying post",
        description: "There was a problem regenerating your post.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };
  
  // Handle approve
  const handleApprove = async () => {
    if (!generatedPostId) return;
    
    try {
      // Send webhook for approval
      await sendWebhookMutation.mutateAsync({
        id: generatedPostId,
        status: "post",
      });
      
      toast({
        title: "Post approved",
        description: "Your post has been approved and will be published soon.",
      });
      
      // Close dialog and reset states
      setIsGenerateOpen(false);
      setPrompt("");
      setGeneratedPostId(null);
      setGeneratedContent(null);
      setShowSuggestionInput(false);
      setSuggestion("");
      
      // Refetch social posts
      queryClient.invalidateQueries({ queryKey: ['/api/social'] });
      
    } catch (error) {
      console.error("Error approving post:", error);
      toast({
        title: "Error approving post",
        description: "There was a problem approving your post.",
        variant: "destructive",
      });
    }
  };
  
  // Reset the dialog when it's closed
  const handleDialogClose = () => {
    if (isGenerating) {
      toast({
        title: "Generation in progress",
        description: "Please wait for the generation to complete before closing.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerateOpen(false);
    setPrompt("");
    setGeneratedPostId(null);
    setGeneratedContent(null);
    setShowSuggestionInput(false);
    setSuggestion("");
  };
  
  // Generated Post Card Component
  function GeneratedPostCard({ content }: { content: { imageUrl: string; caption: string } }) {
    return (
      <Card className="mb-4 overflow-hidden">
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          <img 
            src={content.imageUrl} 
            alt="Generated post" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Available";
            }}
          />
        </div>
        <CardContent className="p-4">
          <p className="text-neutral-700">{content.caption}</p>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-neutral-900">Social Media</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Monitor and respond to social media interactions with AI assistance
          </p>
        </div>
        
        <Button 
          onClick={() => setIsGenerateOpen(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Generate Post
        </Button>
        
        {/* Generate Post Dialog */}
        <Dialog open={isGenerateOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Generate Social Media Post</DialogTitle>
              <DialogDescription>
                Use AI to create engaging social media content for your restaurant.
              </DialogDescription>
            </DialogHeader>
            
            {!generatedContent ? (
              <>
                {!isGenerating ? (
                  <div className="space-y-4 py-4">
                    {!showSuggestionInput ? (
                      <div className="space-y-2">
                        <Label htmlFor="prompt">What kind of post would you like to create?</Label>
                        <Textarea 
                          id="prompt" 
                          placeholder="e.g., Create a post promoting our weekend brunch special with eggs benedict and mimosas" 
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="suggestion">How would you like to improve the post?</Label>
                        <Textarea 
                          id="suggestion" 
                          placeholder="e.g., Make it more casual and add emojis" 
                          value={suggestion}
                          onChange={(e) => setSuggestion(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                    )}
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={handleDialogClose}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={showSuggestionInput ? handleRetry : handleGeneratePost}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                      >
                        Generate
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-center text-sm text-neutral-600">
                      Generating your post... This may take up to 15 seconds.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="py-4">
                  <GeneratedPostCard content={generatedContent} />
                  
                  <div className="flex justify-between mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSuggestionInput(true)}
                      disabled={isGenerating}
                      className="flex items-center"
                    >
                      <Undo2 className="mr-2 h-4 w-4" /> Retry
                    </Button>
                    
                    <Button 
                      onClick={handleApprove}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      <Check className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card 
          className={cn(
            "cursor-pointer hover:border-primary/50 transition-colors",
            activeTab === "all" ? "border-primary" : ""
          )}
          onClick={() => setActiveTab("all")}
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-neutral-500">All Platforms</p>
              <p className="text-xl font-semibold">{socialPosts?.length || 0}</p>
            </div>
            <Share2 className="h-6 w-6 text-neutral-400" />
          </CardContent>
        </Card>
        
        <Card 
          className={cn(
            "cursor-pointer hover:border-yellow-400/50 transition-colors",
            activeTab === "pending" ? "border-yellow-400" : ""
          )}
          onClick={() => setActiveTab("pending")}
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-neutral-500">Pending</p>
              <p className="text-xl font-semibold">{pendingCount}</p>
            </div>
            <Badge className="bg-yellow-100 text-yellow-800">{pendingCount}</Badge>
          </CardContent>
        </Card>
        
        <Card 
          className={cn(
            "cursor-pointer hover:border-green-400/50 transition-colors",
            activeTab === "responded" ? "border-green-400" : ""
          )}
          onClick={() => setActiveTab("responded")}
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-neutral-500">Responded</p>
              <p className="text-xl font-semibold">{respondedCount}</p>
            </div>
            <Badge className="bg-green-100 text-green-800">{respondedCount}</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <Tabs defaultValue="platforms" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="platforms">Platforms</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>
              <TabsContent value="platforms" className="pt-2">
                <div className="text-sm flex flex-wrap gap-2">
                  {platforms.map(platform => (
                    <Badge 
                      key={platform}
                      variant="outline" 
                      className={cn(
                        "cursor-pointer flex items-center",
                        activeTab === platform.toLowerCase() ? "border-primary" : ""
                      )}
                      onClick={() => setActiveTab(platform.toLowerCase())}
                    >
                      <SocialPlatformIcon platform={platform} />
                      <span className="ml-1 capitalize">{platform}</span>
                    </Badge>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="stats" className="pt-2">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Response Rate:</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Response Time:</span>
                    <span className="font-medium">5.2 min</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="text-lg font-medium mb-4">
          {activeTab === "all" ? "All Social Media Interactions" : 
           activeTab === "pending" ? "Pending Interactions" :
           activeTab === "responded" ? "Responded Interactions" :
           `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Interactions`}
        </h2>
        
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-neutral-500">No social media posts matching the selected filter.</p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map(post => <SocialCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
