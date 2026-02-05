
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  sendEmailVerification,
  signOut,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { Zap, Mail, Lock, User as UserIcon, LogIn, ChevronRight, AlertCircle, CheckCircle2, Globe, ArrowLeft, Loader2 } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: (user: User) => void;
  onBackToLanding: () => void;
  theme: 'dark' | 'light';
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onBackToLanding, theme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleError = (err: any) => {
    console.error(err);
    const code = err.code;
    if (code === 'auth/email-already-in-use') setError('Cet email est déjà utilisé.');
    else if (code === 'auth/wrong-password') setError('Mot de passe incorrect.');
    else if (code === 'auth/user-not-found') setError('Utilisateur non trouvé.');
    else if (code === 'auth/weak-password') setError('Mot de passe trop faible.');
    else setError(err.message || 'Une erreur est survenue.');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
          setError("Veuillez vérifier votre email avant de vous connecter.");
          await signOut(auth);
          setLoading(false);
          return;
        }
        onAuthSuccess(user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setVerificationSent(true);
        await signOut(auth); // Déconnexion forcée jusqu'à vérification
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onAuthSuccess(result.user);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 auth-gradient">
        <div className={`w-full max-w-md p-10 rounded-[3rem] border animate-in zoom-in duration-500 ${theme === 'dark' ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'} backdrop-blur-3xl shadow-2xl text-center`}>
          <div className="w-20 h-20 bg-emerald-600/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-4">Vérification Requise</h2>
          <p className="text-sm opacity-70 leading-relaxed mb-8 font-medium">
            On vous a envoyé un email de vérification. Allez dans votre boîte mail pour pouvoir confirmer et pour pouvoir vous enregistrer ou du moins logger.
          </p>
          <button 
            onClick={() => { setVerificationSent(false); setIsLogin(true); }}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 auth-gradient">
      <div className={`w-full max-w-md p-10 rounded-[3rem] border transition-all duration-700 animate-in slide-in-from-bottom-8 ${theme === 'dark' ? 'bg-slate-900/50 border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'} backdrop-blur-3xl overflow-hidden relative`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <button onClick={onBackToLanding} className="p-3 rounded-xl hover:bg-white/5 text-slate-500 transition-all flex items-center gap-2">
            <ArrowLeft size={18} />
          </button>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Zap className="text-white fill-current" size={24} />
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-2">
            {isLogin ? 'Login' : 'Sign Up'}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">
            Aether Nexus Authentication
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-in fade-in duration-300">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-red-500 leading-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className={`w-full pl-12 pr-6 py-5 rounded-2xl border outline-none transition-all font-bold text-sm ${theme === 'dark' ? 'bg-slate-950/50 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="email" 
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full pl-12 pr-6 py-5 rounded-2xl border outline-none transition-all font-bold text-sm ${theme === 'dark' ? 'bg-slate-950/50 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full pl-12 pr-6 py-5 rounded-2xl border outline-none transition-all font-bold text-sm ${theme === 'dark' ? 'bg-slate-950/50 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? <><LogIn size={18}/> Access Nexus</> : <><UserIcon size={18}/> Initialize Core</>)}
          </button>
        </form>

        <div className="my-10 flex items-center gap-4 opacity-20">
          <div className="h-px flex-1 bg-current" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">OR</span>
          <div className="h-px flex-1 bg-current" />
        </div>

        <button 
          onClick={handleGoogleAuth}
          disabled={loading}
          className={`w-full py-5 rounded-2xl border flex items-center justify-center gap-4 transition-all active:scale-95 ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900'}`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Connect with Google</span>
        </button>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-500 transition-colors"
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
