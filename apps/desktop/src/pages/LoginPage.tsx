/**
 * MY-DOGE-MACRO Login Page
 * GitHub OAuth login page with modern design
 * Version: v2.0.0
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useAuthStore, authApi } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, isLoading, setLoading, setError, error } = useAuthStore();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  
  // Check for OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      if (code) {
        setLoading(true);
        try {
          const result = await authApi.handleGitHubCallback(code, state || undefined);
          login(result.user, result.tokens);
          navigate('/');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'OAuth authentication failed');
        } finally {
          setLoading(false);
        }
      }
    };
    
    handleOAuthCallback();
  }, [searchParams, login, navigate, setLoading, setError]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      const { login_url } = await authApi.getGitHubLoginUrl();
      window.location.href = login_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start GitHub login');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'login') {
        const result = await authApi.login(username, password);
        login(result.user, result.tokens);
        navigate('/');
      } else {
        const result = await authApi.register(email, username, password);
        login(result.user, result.tokens);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--accent-primary)]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[var(--status-success)]/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo and Title */}
        <motion.div 
          className="text-center mb-8"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-6xl mb-4">🐕</div>
          <h1 className="text-3xl font-bold text-white">MY-DOGE-MACRO</h1>
          <p className="mt-2 text-[var(--text-secondary)]">量化交易分析系统</p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[var(--status-error)]/10 border border-[var(--status-error)]/50 text-[var(--status-error)] px-4 py-3 rounded-lg mb-4"
          >
            {error}
          </motion.div>
        )}

        {/* Login Card */}
        <Card className="bg-[var(--bg-secondary)]/50 backdrop-blur-sm border-[var(--border-primary)]">
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-center text-white text-lg">
              {mode === 'login' ? '欢迎回来' : '创建账户'}
            </CardTitle>
            <CardDescription className="text-center text-[var(--text-secondary)]">
              {mode === 'login' ? '登录您的账户继续' : '填写信息注册新账户'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {/* GitHub OAuth Button */}
            <Button
              onClick={handleGitHubLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full bg-[var(--bg-tertiary)] hover:bg-[var(--border-secondary)] border-[var(--border-secondary)] text-[var(--text-inverse)] mb-4"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Github className="w-5 h-5" />
              )}
              <span className="ml-2">
                {isLoading ? 'Processing...' : 'Continue with GitHub'}
              </span>
            </Button>

            {/* Divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-secondary)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)]">or continue with email</span>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex rounded-lg bg-[var(--bg-tertiary)]/50 p-1 mb-4">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-inverse)]'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === 'register'
                    ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-inverse)]'
                }`}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--text-inverse)] placeholder-[var(--text-secondary)]"
                    placeholder="you@example.com"
                  />
                </div>
              )}

              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--text-inverse)] placeholder-[var(--text-secondary)]"
                  placeholder="Enter username"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-10 bg-[var(--bg-tertiary)] border-[var(--border-secondary)] text-[var(--text-inverse)] placeholder-[var(--text-secondary)]"
                  placeholder="Enter password (min 8 characters)"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {isLoading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-[var(--text-secondary)] text-sm mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}