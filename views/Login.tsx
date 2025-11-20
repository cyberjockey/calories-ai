
import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Loader2, AlertCircle, Mail, Lock, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    
    performAuth(async () => {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    });
  };

  const handleGoogleSignIn = () => {
    performAuth(async () => {
      await signInWithPopup(auth, googleProvider);
    });
  };

  const performAuth = async (authAction: () => Promise<void>) => {
    setIsLoading(true);
    setError(null);

    try {
      await authAction();
    } catch (err: any) {
      console.error("Auth failed", err);
      let msg = "Authentication failed. Please try again.";
      const code = err.code;
      
      if (code === 'auth/invalid-email') msg = "Invalid email address.";
      else if (code === 'auth/user-disabled') msg = "This account has been disabled.";
      else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') msg = "Invalid email or password.";
      else if (code === 'auth/email-already-in-use') msg = "Email is already registered.";
      else if (code === 'auth/weak-password') msg = "Password must be at least 6 characters.";
      else if (code === 'auth/popup-closed-by-user') msg = "Sign-in cancelled.";
      else if (code === 'auth/too-many-requests') msg = "Too many failed attempts. Try again later.";
      
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-900 px-6 pb-10 animate-fade-in text-slate-50">
      
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg shadow-blue-500/20">
          AI
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Calories AI</h1>
        <p className="text-slate-400 max-w-xs text-sm">
          {isSignUp ? "Create an account to start tracking." : "Welcome back. Please sign in."}
        </p>
      </div>

      {/* Google Login Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full max-w-sm bg-white hover:bg-gray-100 text-slate-900 font-semibold py-3.5 px-6 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 mb-6"
      >
        {isLoading ? (
           <Loader2 className="animate-spin text-slate-600" size={20} />
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>{isSignUp ? 'Sign up with Google' : 'Sign in with Google'}</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="w-full max-w-sm flex items-center gap-4 mb-6">
        <div className="h-px bg-slate-700 flex-1"></div>
        <span className="text-slate-500 text-sm font-medium">OR</span>
        <div className="h-px bg-slate-700 flex-1"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        
        <div className="space-y-4">
            {/* Email Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="text-slate-500" size={20} />
                </div>
                <input 
                    type="email" 
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition-all"
                />
            </div>

            {/* Password Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-slate-500" size={20} />
                </div>
                <input 
                    type="password" 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none transition-all"
                />
            </div>
        </div>

        {/* Error Message */}
        {error && (
           <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 text-left animate-fade-in">
               <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
               <p className="text-red-400 text-sm">{error}</p>
           </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
                {isSignUp ? 'Create Account' : 'Sign In with Email'}
                <ArrowRight size={20} />
            </>
          )}
        </button>
      </form>

      {/* Toggle Sign Up / Sign In */}
      <div className="mt-8 text-center">
        <p className="text-slate-400 text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="ml-2 text-blue-400 font-semibold hover:text-blue-300 transition-colors"
            >
                {isSignUp ? "Sign In" : "Sign Up"}
            </button>
        </p>
      </div>

    </div>
  );
};

export default Login;
