import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { useAuthStore } from "../store/auth.store";
import api from "../lib/api";
import { io, Socket } from "socket.io-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, History, Edit2, Trash2, Star, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function DocumentEditor() {
  const { documentId } = useParams();
  const [docTitle, setDocTitle] = useState("Loading...");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<{ userId: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState("VIEWER");
  const [ydoc] = useState(() => new Y.Doc());
  const [isYdocReady, setIsYdocReady] = useState(false);
  const [initialContent, setInitialContent] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [isStarred, setIsStarred] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyVersions, setHistoryVersions] = useState<any[]>([]);
  const isDirtyRef = useRef(false);
  const editorRef = useRef<any>(null);
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!documentId) return;

    // Fetch initial doc metadata
    const fetchDoc = async () => {
      try {
        const res = await api.get(`/documents/${documentId}`);
        setDocTitle(res.data.title);
        setTempTitle(res.data.title);
        setUserRole(res.data.userRole);
        setAuthorId(res.data.authorId);
        setIsStarred(res.data.isStarred);
        return res.data.content || "";
      } catch (error) {
        console.error(error);
        return "";
      }
    };
    fetchDoc();

    // Setup Socket.io connection and manual Yjs sync
    const token = localStorage.getItem("auth-storage") 
      ? JSON.parse(localStorage.getItem("auth-storage")!).state.accessToken 
      : null;

    if (!token) {
      navigate("/login");
      return;
    }

    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      auth: { token }
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("join-document", documentId);
    });

    // Handle initial Yjs sync from backend
    newSocket.on("yjs-sync", async ({ state, isFirst }) => {
      Y.applyUpdate(ydoc, new Uint8Array(state));
      
      if (isFirst) {
        // If we are the first person in the room, load HTML from DB to populate Y.Doc
        const initialHtml = await fetchDoc();
        if (initialHtml) {
          setInitialContent(initialHtml);
        }
      } else {
        // Just fetch metadata (title, role) without overwriting editor
        await fetchDoc();
      }
      setIsYdocReady(true);
    });

    // Handle incoming Yjs updates from others
    newSocket.on("yjs-update", (updateArray: number[]) => {
      Y.applyUpdate(ydoc, new Uint8Array(updateArray), newSocket);
    });

    // Handle user joined/left for active users list
    newSocket.on("user-joined", (data) => {
      setActiveUsers((prev) => [...prev, data]);
    });

    newSocket.on("user-left", (data) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    newSocket.on("save-success", () => {
      setSaving(false);
    });

    return () => {
      if (isDirtyRef.current && editorRef.current) {
        newSocket.emit("save-snapshot", {
          documentId,
          content: editorRef.current.getHTML(),
        });
      }
      newSocket.emit("leave-document", documentId);
      newSocket.disconnect();
    };
  }, [documentId, navigate, ydoc]);

  // Handle outgoing Yjs updates
  useEffect(() => {
    if (!socket || !isYdocReady) return;

    const handleYjsUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== socket) {
        isDirtyRef.current = true; // Mark as modified locally
        socket.emit("yjs-update", {
          documentId,
          update: Array.from(update),
        });
      }
    };

    ydoc.on("update", handleYjsUpdate);
    return () => {
      ydoc.off("update", handleYjsUpdate);
    };
  }, [socket, ydoc, isYdocReady, documentId]);

  // TipTap Editor setup
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // History handled by Yjs
      } as any),
      Collaboration.configure({
        document: ydoc,
      }),
    ],
    content: "<p>Loading document...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4",
      },
    },
    // We don't use onUpdate here to broadcast HTML anymore. Yjs handles it natively.
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Handle tab close for snapshots
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirtyRef.current && socket && editorRef.current) {
        socket.emit("save-snapshot", {
          documentId,
          content: editorRef.current.getHTML(),
        });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [socket, documentId]);

  useEffect(() => {
    if (editor && initialContent !== null) {
      editor.commands.setContent(initialContent);
      setInitialContent(null);
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (editor && userRole !== null) {
      if (userRole === "VIEWER") {
        editor.setEditable(false);
      } else {
        editor.setEditable(true);
      }
    }
  }, [editor, userRole]);

  const handleSave = () => {
    if (!socket || !editor || userRole === "VIEWER") return;
    setSaving(true);
    socket.emit("save-document", {
      documentId,
      content: editor.getHTML(),
    });
  };

  const handleTitleUpdate = async () => {
    if (!tempTitle.trim() || tempTitle === docTitle) {
      setIsEditingTitle(false);
      setTempTitle(docTitle);
      return;
    }
    try {
      await api.patch(`/documents/${documentId}`, { title: tempTitle });
      setDocTitle(tempTitle);
      setIsEditingTitle(false);
    } catch (error) {
      console.error(error);
      setTempTitle(docTitle);
      setIsEditingTitle(false);
    }
  };

  const handleToggleStar = async () => {
    try {
      const newStarredStatus = !isStarred;
      setIsStarred(newStarredStatus); // Optimistic UI update
      await api.patch(`/documents/${documentId}`, { isStarred: newStarredStatus });
    } catch (error) {
      console.error(error);
      setIsStarred(isStarred); // Revert on failure
      alert("Failed to update star status");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/documents/${documentId}`);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Failed to delete document");
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/documents/${documentId}/history`);
      setHistoryVersions(res.data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const restoreVersion = (version: any) => {
    if (!editor || userRole === "VIEWER") return;
    if (window.confirm("Restore this version? This will overwrite the current document for everyone.")) {
      editor.commands.setContent(version.contentSnapshot);
      setHistoryOpen(false);
      isDirtyRef.current = true; // Force snapshot on next close since we changed the document
      handleSave(); // Automatically save the restored version main content
    }
  };

  const canDelete = userRole === "OWNER" || currentUser?.id === authorId;

  if (!editor) return <div>Loading editor...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex items-center justify-between bg-background z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleToggleStar}
            className={`h-8 w-8 ${isStarred ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground"}`}
          >
            <Star className={`h-5 w-5 ${isStarred ? "fill-yellow-500" : ""}`} />
          </Button>
          {isEditingTitle ? (
            <Input 
              value={tempTitle} 
              onChange={(e) => setTempTitle(e.target.value)} 
              className="h-8 w-64 text-xl font-bold"
              autoFocus
              onBlur={handleTitleUpdate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleUpdate();
                if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                  setTempTitle(docTitle);
                }
              }}
            />
          ) : (
            <h2 
              className={`text-xl font-bold flex items-center gap-2 ${userRole !== "VIEWER" ? "cursor-pointer hover:text-muted-foreground transition-colors" : ""}`}
              onClick={() => {
                if (userRole !== "VIEWER") setIsEditingTitle(true);
              }}
              title={userRole !== "VIEWER" ? "Click to rename" : ""}
            >
              {docTitle}
              {userRole !== "VIEWER" && <Edit2 className="h-4 w-4 opacity-50" />}
            </h2>
          )}
          <div className="flex -space-x-2">
            {/* Active Users Avatars */}
            {activeUsers.map((u, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground border-2 border-background text-xs" title={`User ${u.userId}`}>
                U
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          
          <Dialog open={historyOpen} onOpenChange={(open) => {
            setHistoryOpen(open);
            if (open) fetchHistory();
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Version History</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {historyVersions.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">No saved versions yet. Click 'Save' to create a snapshot.</div>
                ) : (
                  historyVersions.map((v) => (
                    <div key={v.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 border rounded-md gap-3">
                      <div>
                        <div className="font-semibold text-sm">{new Date(v.createdAt).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mt-1">Snapshot</div>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => restoreVersion(v)} disabled={userRole === "VIEWER"}>
                        <Clock className="h-4 w-4 mr-2" /> Restore
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {userRole !== "VIEWER" && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-muted/30 p-8">
        <div className="max-w-4xl mx-auto bg-background border shadow-sm min-h-full p-12">
          <EditorContent editor={editor} className="prose prose-stone dark:prose-invert max-w-none min-h-[500px] outline-none" />
        </div>
      </div>
    </div>
  );
}
