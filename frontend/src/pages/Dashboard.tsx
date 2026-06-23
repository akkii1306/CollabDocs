import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileText, Plus, Folder, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Workspace {
  id: string;
  name: string;
  description: string;
}

interface Document {
  id: string;
  title: string;
  updatedAt: string;
  isStarred: boolean;
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [wsDialogOpen, setWsDialogOpen] = useState(false);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EDITOR");
  const [inviteMessage, setInviteMessage] = useState({ type: "", text: "" });
  const [inviting, setInviting] = useState(false);

  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get("/workspaces");
      setWorkspaces(res.data);
      if (res.data.length > 0 && !workspaceId) {
        navigate(`/dashboard/workspace/${res.data[0].id}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDocuments = async (wsId: string) => {
    try {
      const res = await api.get(`/documents?workspaceId=${wsId}`);
      setDocuments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (workspaceId) {
      fetchDocuments(workspaceId);
    }
  }, [workspaceId]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName) return;
    try {
      const res = await api.post("/workspaces", { name: newWorkspaceName });
      setWorkspaces([...workspaces, res.data]);
      setNewWorkspaceName("");
      setWsDialogOpen(false);
      navigate(`/dashboard/workspace/${res.data.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateDocument = async () => {
    if (!newDocTitle || !workspaceId) return;
    try {
      const res = await api.post("/documents", { title: newDocTitle, workspaceId });
      setDocuments([res.data, ...documents]);
      setNewDocTitle("");
      setDocDialogOpen(false);
      navigate(`/document/${res.data.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !workspaceId) return;
    setInviting(true);
    setInviteMessage({ type: "", text: "" });
    try {
      await api.post(`/workspaces/${workspaceId}/invite`, { email: inviteEmail, role: inviteRole });
      setInviteMessage({ type: "success", text: "Invitation sent successfully!" });
      setTimeout(() => {
        setInviteDialogOpen(false);
        setInviteEmail("");
        setInviteRole("EDITOR");
        setInviteMessage({ type: "", text: "" });
      }, 1500);
    } catch (error: any) {
      setInviteMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to invite member." 
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        
        <Dialog open={wsDialogOpen} onOpenChange={setWsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Workspace</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ws-name">Name</Label>
                <Input id="ws-name" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} />
              </div>
              <Button onClick={handleCreateWorkspace}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 flex flex-col gap-2">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Folder className="h-5 w-5"/> Workspaces</h3>
          {workspaces.map((ws) => (
            <Button 
              key={ws.id} 
              variant={ws.id === workspaceId ? "secondary" : "ghost"} 
              className="justify-start"
              onClick={() => navigate(`/dashboard/workspace/${ws.id}`)}
            >
              {ws.name}
            </Button>
          ))}
        </div>
        
        <div className="md:col-span-3">
          {workspaceId && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-xl">Documents</h3>
                <div className="flex gap-2">
                  <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Invite Member</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Member</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {inviteMessage.text && (
                          <div className={`p-3 rounded-md text-sm ${inviteMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-destructive/15 text-destructive'}`}>
                            {inviteMessage.text}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input id="invite-email" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@example.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invite-role">Role</Label>
                          <select 
                            id="invite-role" 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={inviteRole} 
                            onChange={(e) => setInviteRole(e.target.value)}
                          >
                            <option value="VIEWER">Viewer</option>
                            <option value="EDITOR">Editor</option>
                          </select>
                        </div>
                        <Button onClick={handleInviteMember} disabled={inviting}>
                          {inviting ? "Sending..." : "Send Invite"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="h-4 w-4 mr-2" /> New Document</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a Document</DialogTitle>
                      </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="doc-title">Title</Label>
                        <Input id="doc-title" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} />
                      </div>
                      <Button onClick={handleCreateDocument}>Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </div>

              {loading ? (
                <div>Loading documents...</div>
              ) : documents.length === 0 ? (
                <div className="text-center p-12 border rounded-lg border-dashed text-muted-foreground">
                  No documents found in this workspace. Create one!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/document/${doc.id}`)}>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg flex justify-between items-center">
                          <span className="truncate">{doc.title}</span>
                          {doc.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-center p-4 bg-muted/30 rounded-md">
                          <FileText className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
                        Updated {new Date(doc.updatedAt).toLocaleDateString()}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
