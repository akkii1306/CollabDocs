import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileText, Plus, Folder, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-full flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Manage your workspaces and documents.</p>
        </div>
        
        <Dialog open={wsDialogOpen} onOpenChange={setWsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-lg shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> New Workspace</Button>
          </DialogTrigger>
          <DialogContent className="glass-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Create Workspace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ws-name">Name</Label>
                <Input id="ws-name" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="Engineering Team" className="bg-background/50 border-white/10 focus:border-primary transition-colors" />
              </div>
              <Button onClick={handleCreateWorkspace} className="w-full bg-gradient-to-r from-primary to-purple-600">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 flex flex-col gap-3">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2"><Folder className="h-4 w-4"/> Workspaces</h3>
          {workspaces.map((ws) => (
            <motion.button 
              whileHover={{ x: 4 }}
              key={ws.id} 
              className={`flex items-center text-left px-4 py-3 rounded-xl transition-all ${ws.id === workspaceId ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'}`}
              onClick={() => navigate(`/dashboard/workspace/${ws.id}`)}
            >
              <div className={`w-2 h-2 rounded-full mr-3 ${ws.id === workspaceId ? 'bg-primary' : 'bg-transparent'}`} />
              <span className="font-medium">{ws.name}</span>
            </motion.button>
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
                      <Button className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-lg shadow-primary/20"><Plus className="h-4 w-4 mr-2" /> New Document</Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Create Document</DialogTitle>
                      </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="doc-title">Title</Label>
                        <Input id="doc-title" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="Project Proposal" className="bg-background/50 border-white/10 focus:border-primary transition-colors"/>
                      </div>
                      <Button onClick={handleCreateDocument} className="w-full bg-gradient-to-r from-primary to-purple-600">Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
              ) : documents.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-12 glass-card rounded-2xl border-dashed border-2 border-white/10 text-muted-foreground gap-4">
                  <FileText className="h-12 w-12 text-muted-foreground/30" />
                  <p>No documents found in this workspace. Create one!</p>
                </motion.div>
              ) : (
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {documents.map((doc) => (
                    <motion.div key={doc.id} variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                      <Card 
                        className="cursor-pointer glass border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 h-full flex flex-col" 
                        onClick={() => navigate(`/document/${doc.id}`)}
                      >
                        <CardHeader className="p-5 pb-2">
                          <CardTitle className="text-lg flex justify-between items-center font-semibold">
                            <span className="truncate">{doc.title}</span>
                            {doc.isStarred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 flex-1">
                          <div className="flex justify-center p-6 bg-secondary/30 rounded-xl group transition-colors">
                            <FileText className="h-14 w-14 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                          </div>
                        </CardContent>
                        <CardFooter className="p-5 pt-0 text-xs text-muted-foreground flex items-center justify-between">
                          <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
