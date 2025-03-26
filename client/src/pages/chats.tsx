import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Chat } from "@shared/schema";
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
import { formatDistanceToNow, format } from "date-fns";
import { MessageSquare, Users, Clock } from "lucide-react";

function ChatCard({ chat }: { chat: Chat }) {
  const [expanded, setExpanded] = useState(false);

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case "website":
        return <i className="ri-chrome-line mr-1"></i>;
      case "facebook":
        return <i className="ri-facebook-circle-line mr-1"></i>;
      case "instagram":
        return <i className="ri-instagram-line mr-1"></i>;
      case "whatsapp":
        return <i className="ri-whatsapp-line mr-1"></i>;
      default:
        return <i className="ri-message-2-line mr-1"></i>;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-primary-light text-white rounded-full flex items-center justify-center mr-3">
              {chat.customerName ? chat.customerName.charAt(0) : <Users size={16} />}
            </div>
            <div>
              <CardTitle className="text-base">
                {chat.customer_name || "Unknown Customer"}
              </CardTitle>
              <div className="text-xs text-neutral-500 flex items-center mt-1">
                {getSourceIcon(chat.source || 'website')}
                {(chat.source || 'website').charAt(0).toUpperCase() + (chat.source || 'website').slice(1)} Chat
              </div>
            </div>
          </div>
          <Badge 
            variant={chat.status === "active" ? "default" : "secondary"}
            className={chat.status === "active" ? "animate-pulse" : ""}
          >
            {chat.status || 'unknown'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center text-sm text-neutral-600 mb-2">
          <div className="flex items-center">
            <Clock size={14} className="mr-1" />
            {chat.start_time ? 
              formatDistanceToNow(new Date(chat.start_time), { addSuffix: true }) 
              : 'Unknown time'
            }
          </div>
          <div>
            Topic: <span className="font-medium">{chat.topic || "General Inquiry"}</span>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 bg-neutral-50 p-3 rounded-md text-sm">
            <p className="font-medium mb-1">Summary</p>
            <p>{chat.summary || "No summary available"}</p>
            <div className="mt-2 space-y-1 text-sm">
              <p>AI Handled: {chat.ai_handled ? 'Yes' : 'No'}</p>
              <p>Transferred to Human: {chat.transferred_to_human ? 'Yes' : 'No'}</p>
              {chat.user_id && <p>User ID: {chat.user_id}</p>}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-3">
        <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show Less" : "Show More"}
        </Button>
        <Button size="sm">View Details</Button>
      </CardFooter>
    </Card>
  );
}

export default function Chats() {
  const { data: chats = [], isLoading } = useQuery<Chat[]>({
    queryKey: ['/api/chats'],
    queryFn: async () => {
      const response = await fetch("/api/chats");
      return response.json();
    },
  });

  const [activeTab, setActiveTab] = useState("active");

  if (isLoading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <Skeleton className="h-12 w-64 mb-4" />

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const activeChatCount = chats?.filter(chat => chat.status === "active").length || 0;
  const completedChatCount = chats?.filter(chat => chat.status !== "active").length || 0;

  const activeChats = chats?.filter(chat => chat.status === "active") || [];
  const completedChats = chats?.filter(chat => chat.status !== "active") || [];

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-neutral-900">Chat Interactions</h1>
        <p className="mt-1 text-sm text-neutral-600">Monitor and manage AI-handled customer chats</p>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="active" className="flex items-center">
            <MessageSquare className="mr-2 h-4 w-4" />
            Active Chats
            {activeChatCount > 0 && (
              <Badge variant="secondary" className="ml-2">{activeChatCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed Chats
            {completedChatCount > 0 && (
              <Badge variant="secondary" className="ml-2">{completedChatCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          {activeChats.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-neutral-500">No active chats at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            activeChats.map(chat => <ChatCard key={chat.id} chat={chat} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {completedChats.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-neutral-500">No completed chats available.</p>
              </CardContent>
            </Card>
          ) : (
            completedChats.map(chat => <ChatCard key={chat.id} chat={chat} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}