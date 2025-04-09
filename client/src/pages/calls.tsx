import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronDown, ChevronUp, Play, Pause, Volume2 } from "lucide-react";
import { useState, useRef, useEffect, Fragment } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Call } from "@shared/schema";
import { useLocation } from "wouter";

// TypeScript interface to handle both camelCase and snake_case formats
interface CallData extends Partial<Call> {
  // Handle snake_case variations
  phone_number?: string;
  start_time?: string | Date;
  ai_handled?: boolean;
  call_recording_url?: string;
}

export default function Calls() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, params] = useLocation();

  useEffect(() => {
    // Extract call ID from URL parameters
    const urlParams = new URLSearchParams(params);
    const callId = urlParams.get('id');
    if (callId) {
      // Set searchQuery to the call ID
      setSearchQuery(callId);
    }
  }, [params]);

  const [expandedCallIds, setExpandedCallIds] = useState<Set<number>>(new Set());
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: calls = [] } = useQuery<CallData[]>({
    queryKey: ["/api/calls"],
    queryFn: async () => {
      const response = await fetch("/api/calls");
      if (!response.ok) {
        throw new Error("Failed to fetch calls");
      }
      return response.json();
    },
  });

  // Mutation to update call status
  const updateCallStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/calls/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update call status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
      toast({
        title: "Success",
        description: "Call status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update call status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const formatPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return '-';
    try {
      // Different phone formats might need different regex
      if (phone.length === 10) {
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      } else if (phone.startsWith('+')) {
        return phone.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
      }
      return phone;
    } catch (e) {
      return phone;
    }
  };

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '-';
    try {
      const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      if (isNaN(date.getTime())) return String(dateStr);
      return format(date, "MMM d, h:mm a");
    } catch (e) {
      return String(dateStr);
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;

    switch(status.toLowerCase()) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-500 text-white hover:bg-green-600">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedCallIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handlePlayAudio = (id: number, url: string) => {
    if (playingAudioId === id) {
      // If already playing this audio, pause it
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play();
        } else {
          audioRef.current.pause();
        }
      }
    } else {
      // If playing a different audio, stop the current one and play the new one
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Create a new audio element
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setPlayingAudioId(id);
      audio.onpause = () => setPlayingAudioId(null);
      audio.onended = () => setPlayingAudioId(null);

      audio.play().catch(error => {
        console.error("Error playing audio:", error);
        toast({
          title: "Error",
          description: "Could not play audio. The URL may be invalid or the audio file is not accessible.",
          variant: "destructive",
        });
      });
    }
  };

  // Stop audio playback when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Since we get data from API in snake_case but our schema is in camelCase,
  // we need to handle both formats to avoid type errors
  const filteredCalls = calls?.filter((call) => {
    const phoneNum = (call.phone_number || call.phoneNumber || '').toString().toLowerCase();
    const topicText = (call.topic || '').toString().toLowerCase();
    const summaryText = (call.summary || '').toString().toLowerCase();
    const idString = (call.id || '').toString().toLowerCase();

    return phoneNum.includes(searchQuery.toLowerCase()) ||
      topicText.includes(searchQuery.toLowerCase()) ||
      summaryText.includes(searchQuery.toLowerCase()) ||
      idString.includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <div className="p-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>AI Handled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map((call) => (
                <Fragment key={call.id}>
                  <TableRow className={expandedCallIds.has(call.id!) ? "border-b-0" : ""}>
                    <TableCell>{formatPhoneNumber(call.phone_number || call.phoneNumber)}</TableCell>
                    <TableCell>{formatDate(call.start_time || call.startTime)}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={call.status || "pending"}
                        onValueChange={(value) => updateCallStatus.mutate({ id: call.id!, status: value })}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue>{getStatusBadge(call.status)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{call.topic || '-'}</TableCell>
                    <TableCell>{(call.ai_handled || call.aiHandled) ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleExpand(call.id!)}
                      >
                        {expandedCallIds.has(call.id!) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {expandedCallIds.has(call.id!) ? 'Hide Details' : 'View Details'}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {expandedCallIds.has(call.id!) && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-muted/30 px-4 pb-4">
                        <div className="grid gap-4 py-2">
                          {(call.summary) && (
                            <div>
                              <h4 className="font-medium mb-1">Call Summary</h4>
                              <p className="text-sm text-muted-foreground">{call.summary}</p>
                            </div>
                          )}

                          {(call.call_recording_url || call.callRecordingUrl) && (
                            <div>
                              <h4 className="font-medium mb-1">Call Recording</h4>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex items-center gap-1"
                                  onClick={() => handlePlayAudio(call.id!, call.call_recording_url || call.callRecordingUrl!)}
                                >
                                  {playingAudioId === call.id ? (
                                    <>
                                      <Pause size={16} />
                                      Pause Audio
                                    </>
                                  ) : (
                                    <>
                                      <Play size={16} />
                                      Play Audio
                                    </>
                                  )}
                                </Button>

                                {playingAudioId === call.id && (
                                  <span className="text-sm font-medium text-primary animate-pulse">
                                    <Volume2 size={16} className="inline mr-1" />
                                    Playing...
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}

              {filteredCalls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No calls found matching your search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}