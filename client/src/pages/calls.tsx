import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import { useState, useRef, useEffect, Fragment } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get id from URL query params
    const params = new URLSearchParams(window.location.search);
    const callId = params.get("id");
    if (callId) {
      // Set searchQuery to the call ID
      setSearchQuery(callId);
      // Load specific call data if needed
    }
  }, []);

  const [expandedCallIds, setExpandedCallIds] = useState<Set<number>>(
    new Set(),
  );
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [transcriptDialogOpen, setTranscriptDialogOpen] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState("");
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioPlayerOpen, setAudioPlayerOpen] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState("");
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
    if (!phone) return "-";
    try {
      // Different phone formats might need different regex
      if (phone.length === 10) {
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
      } else if (phone.startsWith("+")) {
        return phone.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, "$1 ($2) $3-$4");
      }
      return phone;
    } catch (e) {
      return phone;
    }
  };

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return "-";
    try {
      const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
      if (isNaN(date.getTime())) return String(dateStr);
      return format(date, "MMM d, h:mm a");
    } catch (e) {
      return String(dateStr);
    }
  };

  const getStatusBadge = (status: string | null | undefined) => {
    if (!status) return <Badge variant="outline" className="bg-gray-200 text-gray-800">Unknown</Badge>;

    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-black text-white hover:bg-gray-800"
          >
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-gray-700 text-white hover:bg-gray-600">
            In Progress
          </Badge>
        );
      case "pending":
        return <Badge variant="outline" className="bg-gray-200 text-gray-800 hover:bg-gray-300">Pending</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-200 text-gray-800">{status}</Badge>;
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedCallIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // State to track download progress
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handlePlayAudio = async (id: number, url: string) => {
    setCurrentAudioUrl(url);
    setAudioPlayerOpen(true);

    // If the same audio is already loaded and we're just toggling play/pause
    if (playingAudioId === id && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current
          .play()
          .then(() => setPlayingAudioId(id))
          .catch((error) => {
            console.error("Error playing audio:", error);
            setPlayingAudioId(null);
          });
      } else {
        audioRef.current.pause();
        setPlayingAudioId(null);
      }
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
    }

    try {
      // Show downloading state
      setIsDownloading(true);
      setDownloadProgress(0);

      // Fetch the audio file
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the total size for progress calculation
      const contentLength = response.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      // Use a ReadableStream to track download progress
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to get reader from response");

      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      // Read the stream chunks
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Update download progress
        if (total > 0) {
          setDownloadProgress(Math.round((receivedLength / total) * 100));
        }
      }

      // Combine chunks into a single Uint8Array
      const allChunks = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
      }

      // Convert to blob with correct MIME type
      const blob = new Blob([allChunks], { type: "audio/mpeg" });

      // Create a local URL for the blob
      const blobUrl = URL.createObjectURL(blob);

      // Create and set up the audio element
      const audio = new Audio(blobUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.addEventListener("loadedmetadata", () => {
        setAudioDuration(audio.duration);
        setIsDownloading(false);
      });

      audio.addEventListener("timeupdate", () => {
        setAudioProgress(audio.currentTime);
      });

      audio.addEventListener("play", () => setPlayingAudioId(id));
      audio.addEventListener("pause", () => setPlayingAudioId(null));
      audio.addEventListener("ended", () => {
        setPlayingAudioId(null);
        setAudioProgress(0);
        // Clean up blob URL when done
        URL.revokeObjectURL(blobUrl);
      });

      // Play the audio
      await audio.play();
      setPlayingAudioId(id);
    } catch (error) {
      console.error("Error handling audio:", error);
      setIsDownloading(false);
      toast({
        title: "Error",
        description:
          "Could not play audio. The file may be invalid or inaccessible.",
        variant: "destructive",
      });
    }
  };

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      // Only update the current time if within valid range and audio is loaded
      if (
        value >= 0 &&
        value <= audioRef.current.duration &&
        !isNaN(audioRef.current.duration)
      ) {
        // Set the current time
        audioRef.current.currentTime = value;

        // Update progress state immediately for responsive UI
        setAudioProgress(value);

        // Sometimes the timeupdate event doesn't fire immediately after seeking
        // Force a UI update to match the actual position
        setTimeout(() => {
          if (audioRef.current) {
            setAudioProgress(audioRef.current.currentTime);
          }
        }, 50);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Audio cleanup and event handling
  // Track blob URLs to properly clean them up
  const [activeBlobUrl, setActiveBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup function to remove event listeners, stop playback, and release blob URLs
    return () => {
      if (audioRef.current) {
        const audio = audioRef.current;

        // Remove all event listeners
        audio.removeEventListener("loadedmetadata", () => {});
        audio.removeEventListener("timeupdate", () => {});
        audio.removeEventListener("play", () => {});
        audio.removeEventListener("pause", () => {});
        audio.removeEventListener("ended", () => {});
        audio.removeEventListener("seeking", () => {});
        audio.removeEventListener("seeked", () => {});

        // Stop playback
        audio.pause();
        audioRef.current = null;

        // Clean up any blob URLs
        if (activeBlobUrl) {
          URL.revokeObjectURL(activeBlobUrl);
          setActiveBlobUrl(null);
        }
      }
    };
  }, [activeBlobUrl]);

  // Dialog close handler to pause audio and clean up when dialog is closed
  useEffect(() => {
    if (!audioPlayerOpen && audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);

      // Clean up blob URL if dialog is closed
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
        setActiveBlobUrl(null);
      }
    }
  }, [audioPlayerOpen, activeBlobUrl]);

  // Since we get data from API in snake_case but our schema is in camelCase,
  // we need to handle both formats to avoid type errors
  const filteredCalls =
    calls?.filter((call) => {
      const phoneNum = (call.phone_number || call.phoneNumber || "")
        .toString()
        .toLowerCase();
      const topicText = (call.topic || "").toString().toLowerCase();
      const summaryText = (call.summary || "").toString().toLowerCase();
      const idString = (call.id || "").toString().toLowerCase();

      return (
        phoneNum.includes(searchQuery.toLowerCase()) ||
        topicText.includes(searchQuery.toLowerCase()) ||
        summaryText.includes(searchQuery.toLowerCase()) ||
        idString.includes(searchQuery.toLowerCase())
      );
    }) || [];

  return (
    <div className="p-6">
      <Dialog open={audioPlayerOpen} onOpenChange={setAudioPlayerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Audio Player</DialogTitle>
            <DialogDescription>Listen to the call recording</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isDownloading ? (
              <div className="space-y-2 py-4">
                <div className="text-center mb-2">Loading audio file...</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all"
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (audioRef.current && !isNaN(audioRef.current.duration)) {
                      // Go back 5 seconds
                      const newTime = Math.max(
                        0,
                        audioRef.current.currentTime - 5,
                      );
                      audioRef.current.currentTime = newTime;
                      setAudioProgress(newTime);
                    }
                  }}
                  disabled={!audioRef.current}
                  title="Back 5 seconds"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 17l-5-5 5-5" />
                    <path d="M18 17l-5-5 5-5" />
                  </svg>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (audioRef.current) {
                      if (audioRef.current.paused) {
                        audioRef.current
                          .play()
                          .then(() => {
                            if (currentAudioUrl) {
                              // Find the call ID with this URL
                              const call = calls.find(
                                (c) =>
                                  (c.call_recording_url ||
                                    c.callRecordingUrl) === currentAudioUrl,
                              );
                              if (call) {
                                setPlayingAudioId(call.id!);
                              }
                            }
                          })
                          .catch((err) => console.error("Play error:", err));
                      } else {
                        audioRef.current.pause();
                        setPlayingAudioId(null);
                      }
                    }
                  }}
                  disabled={!audioRef.current}
                >
                  {playingAudioId ? <Pause size={16} /> : <Play size={16} />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (audioRef.current && !isNaN(audioRef.current.duration)) {
                      // Go forward 5 seconds
                      const newTime = Math.min(
                        audioRef.current.duration,
                        audioRef.current.currentTime + 5,
                      );
                      audioRef.current.currentTime = newTime;
                      setAudioProgress(newTime);
                    }
                  }}
                  disabled={!audioRef.current}
                  title="Forward 5 seconds"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 17l5-5-5-5" />
                    <path d="M6 17l5-5-5-5" />
                  </svg>
                </Button>

                <span className="text-sm w-12 text-right">
                  {formatTime(audioProgress)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={audioDuration || 100}
                  value={audioProgress}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                  step="0.1"
                  disabled={!audioRef.current}
                />
                <span className="text-sm w-12">
                  {formatTime(audioDuration)}
                </span>
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              {/* Hidden audio element */}
              <audio
                className="hidden"
                controls
                preload="auto"
                ref={audioRef}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={transcriptDialogOpen}
        onOpenChange={setTranscriptDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call Transcript</DialogTitle>
            <DialogDescription>
              Complete conversation between agent and customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="border rounded-md p-4 bg-muted/20">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {activeTranscript}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
                <TableHead>ID</TableHead>
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
                  <TableRow
                    className={
                      expandedCallIds.has(call.id!) ? "border-b-0" : ""
                    }
                  >
                    <TableCell>{call.id}</TableCell>
                    <TableCell>
                      {formatPhoneNumber(call.phone_number || call.phoneNumber)}
                    </TableCell>
                    <TableCell>
                      {formatDate(call.start_time || call.startTime)}
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={call.status || "pending"}
                        onValueChange={(value) =>
                          updateCallStatus.mutate({
                            id: call.id!,
                            status: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue>
                            {getStatusBadge(call.status)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{call.topic || "-"}</TableCell>
                    <TableCell>
                      {call.ai_handled || call.aiHandled ? "Yes" : "No"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(call.id!)}
                      >
                        {expandedCallIds.has(call.id!) ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                        {expandedCallIds.has(call.id!)
                          ? "Hide Details"
                          : "View Details"}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {expandedCallIds.has(call.id!) && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/30 px-4 pb-4">
                        <div className="grid gap-4 py-2">
                          {call.summary && (
                            <div>
                              <h4 className="font-medium mb-1">Call Summary</h4>
                              <p className="text-sm text-muted-foreground">
                                {call.summary.includes("%")
                                  ? call.summary.split("%")[0].trim()
                                  : call.summary}
                              </p>
                              {call.summary.includes("%") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => {
                                    // Extract transcript portion after the % symbol
                                    const transcript = call.summary
                                      .split("%")[1]
                                      ?.trim();
                                    if (transcript) {
                                      // Format transcript for dialog display
                                      const formattedTranscript = transcript
                                        .split(";")
                                        .map((line) => line.trim())
                                        .join("\n");

                                      setActiveTranscript(formattedTranscript);
                                      setTranscriptDialogOpen(true);
                                    }
                                  }}
                                >
                                  <Search className="h-3 w-3 mr-1" />
                                  Show Transcript
                                </Button>
                              )}
                            </div>
                          )}

                          {(call.call_recording_url ||
                            call.callRecordingUrl) && (
                            <div>
                              <h4 className="font-medium mb-1">
                                Call Recording
                              </h4>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-1"
                                  onClick={() =>
                                    handlePlayAudio(
                                      call.id!,
                                      call.call_recording_url ||
                                        call.callRecordingUrl!,
                                    )
                                  }
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
                                    <Volume2
                                      size={16}
                                      className="inline mr-1"
                                    />
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
                  <TableCell colSpan={7} className="text-center py-8">
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
