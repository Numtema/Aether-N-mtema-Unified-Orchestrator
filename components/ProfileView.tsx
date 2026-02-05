
import React, { useState, useEffect } from 'react';
import { User as FirebaseUser, updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { StorageService } from '../services/storageService';
import { User, Mail, Lock, Shield, Layout, Save, RefreshCw, AlertCircle, CheckCircle2, Database, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { Project, ThemeMode } from '../types';

interface ProfileViewProps {
  user: FirebaseUser;
  theme: ThemeMode;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, theme }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'warning' } | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const p = await StorageService.getProjects(user.uid);
      setProjects(p);
    } catch (err: any) {
      if (err.message.includes("INDEX_REQUIRED")) {
        setMessage({ text: "Des index Firestore sont en cours de création ou manquants. Rafraîchissez dans quelques minutes.", type: 'warning' });
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
      }
      if (email !== user.email) {
        await updateEmail(user, email);
      }
      if (newPassword) {
        await updatePassword(user, newPassword);
      }
      await StorageService.updateProfile(user.uid, { displayName, email });
      setMessage({ text: 'Profil mis à jour avec succès.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const project: Project = {
        id: `proj-${Date.now()}`,
        ownerId: user.uid,
        name: newProjectName,
        description: 'Nouveau projet Aether',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await StorageService.saveProject(project);
      setNewProjectName('');
      loadProjects();
    } catch (err: any) {
      setMessage({ text: "Impossible de créer le projet. Vérifiez la console pour l'index manquant.", type: 'error' });
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Supprimer ce projet ?")) return;
    await StorageService.deleteProject(id);
    loadProjects();
  };

  return (
    <div className="h-full overflow-y-auto p-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 custom-scrollbar">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-4xl font-black italic tracking-tighter uppercase flex items-center gap-4">
            <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-2xl shadow-blue-500/30 text-white">
              <User size={32} />
            </div>
            Nexus Command Center
          </h2>
          <p className="text-xs opacity-50 font-bold uppercase tracking-[0.3em] ml-20">Identity & Infrastructure Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Profile Card */}
        <div className={`p-10 rounded-[3.5rem] border flex flex-col space-y-10 transition-all ${theme === 'dark' ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="flex items-center justify-between">
             <h3 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
               <Shield className="text-blue-500" /> Identity Core
             </h3>
             <span className="text-[9px] font-black uppercase tracking-widest opacity-40">UID: {user.uid.substring(0, 8)}...</span>
          </div>

          {message && (
            <div className={`p-5 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : message.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
              <p className="text-[12px] font-bold leading-tight">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Display Name</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full pl-14 pr-6 py-5 rounded-2xl border outline-none font-bold text-sm transition-all ${theme === 'dark' ? 'bg-slate-950/50 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Email Nexus</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-14 pr-6 py-5 rounded-2xl border outline-none font-bold text-sm transition-all ${theme === 'dark' ? 'bg-slate-950/50 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-4">Secure Key Update</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  placeholder="New Password (optional)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-14 pr-6 py-5 rounded-2xl border outline-none font-bold text-sm transition-all ${theme === 'dark' ? 'bg-slate-950/50 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'}`}
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <><Save size={18}/> Synchronize Core</>}
            </button>
          </form>
        </div>

        {/* Projects Card */}
        <div className={`p-10 rounded-[3.5rem] border flex flex-col space-y-10 transition-all ${theme === 'dark' ? 'bg-slate-900 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
           <div className="flex items-center justify-between">
             <h3 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
               <FolderOpen className="text-emerald-500" /> Project Registry
             </h3>
             <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{projects.length} Registered</span>
          </div>

          <div className="space-y-4">
             <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Initiate new project..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={`flex-1 p-5 rounded-2xl border outline-none font-bold text-sm transition-all ${theme === 'dark' ? 'bg-slate-950/50 border-white/10 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500'}`}
                />
                <button 
                  onClick={handleCreateProject}
                  className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all active:scale-95"
                >
                  <Plus size={24}/>
                </button>
             </div>

             <div className="space-y-2 h-[300px] overflow-y-auto custom-scrollbar pr-2">
               {projects.map(p => (
                 <div key={p.id} className={`p-5 rounded-2xl border flex items-center justify-between group hover:border-emerald-500/30 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <Database size={18}/>
                      </div>
                      <div>
                        <p className="text-sm font-black italic uppercase tracking-tighter">{p.name}</p>
                        <p className="text-[9px] opacity-40 font-bold uppercase tracking-widest">Active Missions: 0</p>
                      </div>
                   </div>
                   <button 
                    onClick={() => handleDeleteProject(p.id)}
                    className="p-2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                   >
                      <Trash2 size={16}/>
                   </button>
                 </div>
               ))}
               {projects.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-12">
                   <FolderOpen size={48} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">No projects registered</p>
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
