import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-900 px-6 text-center">
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
        <p className="mt-4 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
};

export default Login;