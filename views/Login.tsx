import React, { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Loader2, AlertCircle, Globe, Copy, ExternalLink, RefreshCw } from 'lucide-react';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>('');

  useEffect(() => {
    // Robust domain detection
    const hostname = window.location.hostname;
    const host = window.location.host; // Includes port
    
    // Handle file protocol or empty hostname scenarios
    if (window.location.protocol === 'file:') {
        setHostName('file:// (Local File)');
    } else {
        // Prefer hostname (no port) for Firebase whitelist, but fall back to host if needed
        setHostName(hostname || host || 'Could not detect domain');
    }
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed", err);
      
      let errorMessage = err.message || "Failed to sign in";
      const errorCode = err.code || '';
      const errorString = String(err);
      
      // Broad check for unauthorized domain to ensure we catch it
      if (
          errorCode === 'auth/unauthorized-domain' || 
          errorMessage.includes('unauthorized-domain') || 
          errorString.includes('unauthorized-domain')
      ) {
         errorMessage = "Domain Not Authorized";
      } else if (errorCode === 'auth/popup-closed-by-user') {
         errorMessage = "Sign in cancelled.";
      } else if (errorCode === 'auth/popup-blocked') {
         errorMessage = "Popup blocked. Allow popups for this site.";
      } else if (errorCode === 'auth/operation-not-supported-in-this-environment') {
         errorMessage = "This environment does not support Google Sign-In (e.g. HTTP instead of HTTPS).";
      }
      
      // File protocol check
      if (window.location.protocol === 'file:') {
          errorMessage = "Local File Error";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
      if (hostName && !hostName.includes('Could not detect')) {
          navigator.clipboard.writeText(hostName);
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-900 px-6 text-center pb-10 animate-fade-in">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg shadow-blue-500/20">
          AI
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Calories AI</h1>
        <p className="text-slate-400 max-w-xs">
            The world's most advanced AI-powered calorie and macro tracker.
        </p>
      </div>

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full max-w-xs bg-white text-slate-900 font-bold py-4 px-6 rounded-xl shadow-lg hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="w-5 h-5"
          />
        )}
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </button>
      
      {error && (
           <div className="mt-8 w-full max-w-sm animate-fade-in">
               <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-left">
                   <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                   <div className="flex-1">
                       <h3 className="text-red-400 font-bold text-sm mb-1">Login Failed</h3>
                       <p className="text-slate-300 text-xs break-words leading-relaxed">
                           {error === "Domain Not Authorized" 
                               ? "Firebase has blocked this request because the domain is not whitelisted." 
                               : error}
                       </p>
                   </div>
               </div>

               {error === "Domain Not Authorized" && (
                   <div className="mt-4 bg-slate-800 rounded-xl p-5 border border-slate-700 text-left shadow-xl">
                       <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">
                           Action Required: Add Domain
                       </p>
                       
                       <div className="flex items-center gap-2 bg-black/30 p-3 rounded-lg border border-slate-600 mb-4 group relative">
                           <Globe size={14} className="text-blue-400 shrink-0" />
                           <code className="flex-1 text-white font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap select-all">
                               {hostName}
                           </code>
                           {hostName && !hostName.includes('Could not detect') && (
                               <button 
                                   onClick={handleCopy}
                                   className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 flex items-center gap-1"
                                   title="Copy Domain"
                               >
                                   <Copy size={12} /> Copy
                               </button>
                           )}
                       </div>

                       <div className="space-y-3 border-t border-slate-700/50 pt-3">
                           <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Instructions</h4>
                           <ol className="list-decimal list-outside ml-4 text-[12px] text-slate-300 space-y-2">
                               <li>
                                   Open <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-0.5 font-medium">Firebase Console <ExternalLink size={10}/></a>
                               </li>
                               <li>Go to <strong>Authentication</strong> → <strong>Settings</strong></li>
                               <li>Click the <strong>Authorized Domains</strong> tab</li>
                               <li>Click <strong>Add Domain</strong> and paste the value above</li>
                           </ol>
                       </div>
                        
                       {hostName.includes('Could not detect') && (
                           <p className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-[11px] text-yellow-200">
                               ⚠️ We couldn't detect the domain automatically. Please copy the domain from your browser's address bar.
                           </p>
                       )}
                   </div>
               )}

               {error === "Local File Error" && (
                   <div className="mt-4 bg-slate-800 rounded-xl p-4 border border-slate-700 text-left">
                       <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                           Google Sign-In is disabled for files opened directly from your computer (file://).
                       </p>
                       <p className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-700/50 font-mono">
                           Please use a local server:<br/>
                           <span className="text-blue-400">npx serve</span> or <span className="text-blue-400">python -m http.server</span>
                       </p>
                   </div>
               )}
               
               <div className="mt-6 text-center">
                   <button onClick={() => window.location.reload()} className="text-slate-500 text-xs flex items-center justify-center gap-1 mx-auto hover:text-white transition-colors">
                       <RefreshCw size={10} /> Reload Page
                   </button>
               </div>
           </div>
       )}

      <div className="fixed bottom-4 text-slate-700 text-[10px] font-mono select-all opacity-50 hover:opacity-100 transition-opacity">
         Domain: {hostName}
      </div>
    </div>
  );
};

export default Login;