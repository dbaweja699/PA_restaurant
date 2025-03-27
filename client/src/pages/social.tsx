import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { MessageSquare, Share2, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { data: socialPosts, isLoading } = useQuery<SocialMedia[]>({ 
    queryKey: ['/api/social'],
  });
  
  const [activeTab, setActiveTab] = useState("all");
  
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
    [...new Set(socialPosts.map(post => getSocialData(post).platform))] : 
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
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-neutral-900">Social Media</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Monitor and respond to social media interactions with AI assistance
        </p>
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
