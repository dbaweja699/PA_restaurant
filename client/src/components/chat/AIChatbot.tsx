import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, MinusSquare, Maximize2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Import logo
import LogoImage from '@assets/logoo.png';

// Define message interface
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
}

// n8n API integration
// Get user info for session management
const getUserInfo = () => {
  const userInfo = {
    id: localStorage.getItem('userId') || undefined,
    name: localStorage.getItem('customerName') || localStorage.getItem('fullName') || 'Guest'
  };
  return userInfo;
};

// Create or retrieve session ID for chat continuity 
const getChatSessionId = (): string => {
  let sessionId = localStorage.getItem('chatSessionId');
  
  // Create a new session ID if one doesn't exist
  if (!sessionId) {
    const user = getUserInfo();
    sessionId = `user-${user.id || 'guest'}-${Date.now()}`;
    localStorage.setItem('chatSessionId', sessionId);
  }
  
  return sessionId;
};

const getAIResponse = async (message: string, chatHistory: ChatMessage[]): Promise<{ content: string, model?: string, sessionId?: string }> => {
  try {
    // Filter out system messages and only keep the most recent messages (max 10)
    const recentMessages = chatHistory
      .filter(msg => msg.role !== 'system')
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    const userInfo = getUserInfo();
    const sessionId = getChatSessionId();

    // Call our backend API with the exact format needed for n8n webhook
    const response = await apiRequest('POST', '/api/chatbot', {
      message,
      chatHistory: recentMessages,
      sessionId: sessionId,
      userId: userInfo.id,
      customerName: userInfo.name,
      timestamp: new Date().toISOString(),
      source: "Website"
    });

    // Get the response directly as JSON
    const data = await response.json();

    if (!response.ok) {
      return {
        content: data.content || "The server responded with an error. Please try again later.",
        model: data.model || "error_api"
      };
    }

    return {
      content: data.content,
      model: data.model || "n8n"
    };
  } catch (error) {
    console.error('Error getting AI response:', error);
    
    // Error response if API call fails
    return {
      content: "Unable to connect to the AI service. Please ensure n8n is running and properly configured.",
      model: "error_connection"
    };
  }
};

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Dblytics Restaurant AI Assistant. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus the input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      // Get AI response
      const response = await getAIResponse(message, messages);
      
      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        model: response.model
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Show toast for missing API key
      if (response.model === 'fallback') {
        toast({
          title: 'Using Fallback Responses',
          description: 'OpenAI API key is not configured. Using pre-defined responses.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Handle error
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        timestamp: new Date(),
        model: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Communication Error',
        description: 'Failed to get a response from the AI. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const minimizeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(true);
  };

  const closeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  // Format timestamp to user-friendly format
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={toggleChat}
        className="fixed right-5 bottom-5 p-3 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <div
        onClick={toggleChat}
        className="fixed right-5 bottom-5 p-3 rounded-full shadow-lg bg-primary text-white cursor-pointer z-50 flex items-center"
      >
        <Bot className="h-5 w-5 mr-2" />
        <span className="font-medium">AI Assistant</span>
      </div>
    );
  }

  return (
    <Card className="fixed right-5 bottom-5 w-80 sm:w-96 shadow-lg z-50 border-primary/10">
      <CardHeader className="p-3 flex flex-row items-center justify-between bg-primary text-primary-foreground">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2 bg-white">
            <AvatarImage src={LogoImage} alt="Dblytics Logo" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs opacity-90">Dblytics Restaurant Helper</p>
          </div>
        </div>
        <div className="flex">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full" 
            onClick={minimizeChat}
          >
            <MinusSquare className="h-4 w-4 text-primary-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full ml-1" 
            onClick={closeChat}
          >
            <X className="h-4 w-4 text-primary-foreground" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[320px] p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div 
                    className="text-sm"
                    dangerouslySetInnerHTML={{ 
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br />')
                        .replace(/\* (.*?)(?=(\n|$))/g, '<li>$1</li>')
                        .replace(/<li>/g, '<ul class="list-disc ml-5"><li>')
                        .replace(/<\/li>(?!\s*<li>)/g, '</li></ul>')
                    }}
                  />
                  <p className="text-xs mt-1 opacity-70 text-right">
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 bg-muted">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-3 border-t">
        <div className="flex w-full items-center space-x-2">
          <Textarea
            ref={inputRef}
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 min-h-10 resize-none"
            maxLength={500}
            rows={1}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            disabled={!message.trim() || isTyping}
            className="h-9 w-9"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}