import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  Grid2X2,
  Info,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  MoreVertical,
  PenLine,
  Send,
  University,
  XCircle,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import type React from "react";
import { useEffect, useState, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Screen = "landing" | "login" | "register" | "dashboard" | "createProject" | "tasks" | "files" | "meetings" | "profile";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Grid2X2 },
  { id: "tasks", label: "Timeline", icon: ClipboardList },
  { id: "files", label: "Manuscript", icon: FileText },
  { id: "meetings", label: "Collaboration", icon: MessageSquare },
] as const;

const meetings: MeetingEntry[] = [];

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
};

type MeetingEntry = {
  id: string;
  title: string;
  date: string;
  person: string;
  status: "Approved" | "Completed" | "Pending";
  icon: React.ComponentType<{ className?: string }>;
};

function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  function addNotification(title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") {
    const notification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date(),
    };
    setNotifications((prev) => [notification, ...prev]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 5000);
  }

  function removeNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setScreen("login");
  }

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      if (!isSupabaseConfigured) {
        if (isMounted) setIsAuthChecked(true);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (isMounted) {
        if (data?.session?.user) {
          setScreen((current) =>
            current === "landing" || current === "login" || current === "register"
              ? "dashboard"
              : current,
          );
        }
        setIsAuthChecked(true);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <MobileFrame>
          <div className="mx-auto mt-20 max-w-[430px] rounded-3xl border border-[#c4c6cf] bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-[#475569]">Checking authentication...</p>
          </div>
        </MobileFrame>
      </div>
    );
  }

  if (screen === "landing") {
    return (
      <LandingScreen
        onRegister={() => setScreen("register")}
        onSignIn={() => setScreen("login")}
      />
    );
  }

  if (screen === "login") {
    return (
      <LoginScreen
        onRegister={() => setScreen("register")}
        onSignIn={() => setScreen("dashboard")}
        onBack={() => setScreen("landing")}
      />
    );
  }

  if (screen === "register") {
    return (
      <RegisterScreen
        onBackToLogin={() => setScreen("login")}
        onRegistered={() => setScreen("dashboard")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <MobileFrame>
        {screen === "dashboard" && (
          <DashboardScreen
            createdProjectId={createdProjectId}
            onNavigate={setScreen}
            onProfileClick={() => setScreen("profile")}
            onNotification={addNotification}
            notifications={notifications}
            showNotifications={showNotifications}
            onShowNotifications={setShowNotifications}
          />
        )}
        {screen === "createProject" && (
          <CreateProjectScreen
            onCancel={() => setScreen("dashboard")}
            onCreated={(projectId) => {
              setCreatedProjectId(projectId);
              setScreen("dashboard");
            }}
            onLogout={handleLogout}
            onProfileClick={() => setScreen("profile")}
            onNotification={addNotification}
            notifications={notifications}
            showNotifications={showNotifications}
            onShowNotifications={setShowNotifications}
          />
        )}
        {screen === "tasks" && <TasksScreen onLogout={handleLogout} onProfileClick={() => setScreen("profile")} onNotification={addNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={setShowNotifications} />}
        {screen === "files" && <FilesScreen onLogout={handleLogout} onProfileClick={() => setScreen("profile")} onNotification={addNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={setShowNotifications} />}
        {screen === "meetings" && <MeetingsScreen onLogout={handleLogout} onProfileClick={() => setScreen("profile")} onNotification={addNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={setShowNotifications} />}
        {screen === "profile" && <ProfileScreen onBack={() => setScreen("dashboard")} onLogout={handleLogout} onNotification={addNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={setShowNotifications} />}
        <BottomNav current={screen} onChange={setScreen} />
      </MobileFrame>
    </div>
  );
}

function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-slate-50 md:max-w-[1280px]">
      {children}
    </main>
  );
}

function Header({
  compact,
  title = "ThesiSync",
  userName,
  onLogout,
  onProfileClick,
  onNotification,
  notifications = [],
  showNotifications,
  onShowNotifications,
}: {
  compact?: boolean;
  title?: string;
  userName?: string;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onNotification?: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void;
  notifications?: Notification[];
  showNotifications?: boolean;
  onShowNotifications?: (show: boolean) => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#c4c6cf] bg-[#f7fafc] px-5 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        {compact ? <Menu className="size-5 shrink-0 text-[#0f172a]" /> : null}

        {/* App icon for ThesiSync (left of the title) */}
        <div className="flex shrink-0 items-center justify-center rounded-lg bg-[#002045] text-white p-2">
          <BookOpen className="size-5" />
        </div>

        <h1
          className={cn(
            "truncate font-bold leading-tight text-[#0f172a]",
            compact ? "text-base" : "text-xl",
          )}
        >
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button 
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffffff] text-[#0f172a] shadow-sm transition hover:bg-[#e2e8f0]" 
            type="button"
            onClick={() => onShowNotifications?.(!showNotifications)}
          >
            <Bell className="size-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {notifications.length > 9 ? "9+" : notifications.length}
              </span>
            )}
          </button>
          {showNotifications && (
            <NotificationsPanel notifications={notifications} onClose={() => onShowNotifications?.(false)} />
          )}
        </div>
        {/* Logout moved into Profile screen */}
        {compact ? (
          <Avatar name={userName ?? "User"} className="size-8 bg-[#0f172a] text-white" />
        ) : userName || onProfileClick ? (
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f172a] text-white outline-none transition hover:ring-2 hover:ring-[#bfdbfe] md:h-12 md:w-12"
            onClick={onProfileClick}
            type="button"
            aria-label={onProfileClick ? "Open profile" : "User profile"}
          >
            <Avatar name={userName ?? "User"} className="size-10 md:size-12" />
          </button>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e2e8f0] ring-1 ring-[#c4c6cf] md:h-12 md:w-12" />
        )}
      </div>
    </header>
  );
}

function NotificationsPanel({ notifications, onClose }: { notifications: Notification[]; onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 top-20 z-50 mx-auto w-[min(90vw,20rem)] rounded-lg border border-[#c4c6cf] bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-[#e0e3e5] px-4 py-3">
        <h3 className="font-semibold text-[#002045]">Notifications</h3>
        <button
          onClick={onClose}
          className="text-[#64748b] hover:text-[#0f172a]"
          type="button"
        >
          ✕
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[#64748b]">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "border-b border-[#e0e3e5] px-4 py-3 last:border-b-0",
                notification.type === "success" && "bg-emerald-50",
                notification.type === "error" && "bg-red-50",
                notification.type === "warning" && "bg-amber-50",
                notification.type === "info" && "bg-blue-50",
              )}
            >
              <p className="font-semibold text-[#002045]">{notification.title}</p>
              <p className="mt-1 text-sm text-[#43474e]">{notification.message}</p>
              <p className="mt-2 text-xs text-[#64748b]">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LandingScreen({
  onRegister,
  onSignIn,
}: {
  onRegister: () => void;
  onSignIn: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#181c1e]">
      {!isSupabaseConfigured && (
        <div className="mx-auto mt-4 max-w-[430px] rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5" />
            <span>Supabase not configured — add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your `.env`.</span>
          </div>
        </div>
      )}
      <section className="mx-auto min-h-screen max-w-[430px] overflow-hidden bg-white">
        <div className="border-b border-[#e0e3e5] bg-white px-5 pb-6 pt-6">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[#002045] text-white shadow-sm">
                  <BookOpen className="size-6" />
                </div>
                <div>
                  <p className="text-lg font-bold leading-5 text-[#002045]">ThesiSync</p>
                  <p className="text-xs font-semibold text-[#74777f]">Version 1.0.0</p>
                </div>
              </div>
            </div>

            <div className="pt-10">
              <p className="mb-3 w-fit rounded-full border border-[#d6e3ff] bg-[#f4f8ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#1960a3]">
                Mobile thesis command center
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-normal text-[#002045]">
                Keep every thesis requirement moving.
              </h1>
              <p className="mt-4 text-base font-medium leading-6 text-[#43474e]">
                Plan milestones, submit manuscripts, request consultations, and track your
                group's progress from one focused mobile workspace.
              </p>
            </div>

            <div className="mt-7 grid gap-3">
              <Button
                className="h-12 rounded-lg bg-[#002045] text-base font-bold text-white hover:bg-[#1a365d]"
                onClick={onRegister}
              >
                Create Account
                <ArrowRight className="size-5" />
              </Button>
              <Button
                className="h-12 rounded-lg border-[#c4c6cf] bg-white text-base font-bold text-[#002045] hover:bg-[#f1f4f6]"
                onClick={onSignIn}
                variant="outline"
              >
                Continue to Sign In
              </Button>
            </div>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="mt-4 grid gap-3">
            <LandingFeature
              icon={ClipboardList}
              label="Assign tasks"
              text="Balance chapter work and deadline ownership."
            />
            <LandingFeature
              icon={FileText}
              label="Review manuscripts"
              text="Keep versions, comments, and approvals together."
            />
            <LandingFeature
              icon={CalendarCheck}
              label="Schedule consultations"
              text="Request adviser meetings and track history."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function LandingFeature({
  icon: Icon,
  label,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#d6e3ff] bg-white p-3 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f4f8ff] text-[#1960a3]">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#002045]">{label}</p>
        <p className="mt-0.5 text-xs font-medium leading-4 text-[#43474e]">{text}</p>
      </div>
    </div>
  );
}

function LoginScreen({
  onRegister,
  onSignIn,
  onBack,
}: {
  onRegister: () => void;
  onSignIn: () => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");

    if (!isSupabaseConfigured) {
      onSignIn();
      return;
    }

    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSigningIn(false);

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    if (!remember) {
      await supabase.auth.updateUser({});
    }

    onSignIn();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7fafc] p-4 text-[#181c1e]">
      <div className="fixed left-0 top-0 h-1 w-full bg-gradient-to-r from-[#002045] via-[#1960a3] to-[#1a365d] opacity-50" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,32,69,0.04)_1px,transparent_1px),linear-gradient(rgba(0,32,69,0.04)_1px,transparent_1px)] bg-[size:36px_36px]" />

      {!isSupabaseConfigured && (
        <div className="absolute top-14 left-1/2 z-20 w-[92%] -translate-x-1/2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5" />
            <span>Supabase not configured — add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your `.env`.</span>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-[420px]">
        <section className="mb-12 text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-[#002045] text-white shadow-sm">
            <BookOpen className="size-8" strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold leading-8 text-[#002045] md:text-[32px] md:leading-10">
            ThesiSync
          </h1>
          <p className="mt-2 text-xl font-semibold leading-7 text-[#43474e]">
            Welcome Back
          </p>
          <p
            className={cn(
              "mt-3 text-xs font-semibold",
              isSupabaseConfigured ? "text-emerald-700" : "text-amber-700",
            )}
          >
            {isSupabaseConfigured ? "Supabase connected" : "Add your Supabase keys in .env"}
          </p>
        </section>

        <Card className="rounded-lg border-[#c4c6cf] bg-white shadow-sm transition-all duration-300">
          <CardContent className="p-2 md:p-6">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="block text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                  Email Address
                </span>
                <Input
                  className="h-12 rounded-t-lg border-0 border-b border-[#c4c6cf] bg-[#f1f4f6] px-4 text-base shadow-none transition-all focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="e.g. researcher@university.edu"
                  type="email"
                  value={email}
                />
              </label>

              <label className="block space-y-2">
                <span className="block text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                  Password
                </span>
                <div className="relative">
                  <Input
                    className="h-12 rounded-t-lg border-0 border-b border-[#c4c6cf] bg-[#f1f4f6] px-4 pr-12 text-base shadow-none transition-all focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                    id="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#74777f] transition hover:text-[#43474e]"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
                <button
                  className="ml-auto block text-right text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#1960a3] transition hover:underline"
                  type="button"
                >
                  Forgot Password?
                </button>
              </label>

              <label className="flex items-center gap-2 text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                <input
                  checked={remember}
                  className="size-4 rounded border-[#74777f] text-[#002045] focus:ring-[#d6e3ff]"
                  id="remember"
                  onChange={(event) => setRemember(event.target.checked)}
                  type="checkbox"
                />
                Remember for 30 days
              </label>

              {authMessage && (
                <p className="rounded bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {authMessage}
                </p>
              )}

              <Button
                className="h-12 w-full rounded-lg bg-[#1a365d] text-xl font-semibold text-white transition hover:bg-[#1a365d]/90 active:scale-[0.98]"
                disabled={isSigningIn}
                type="submit"
              >
                {isSigningIn ? "Signing In..." : "Sign In"}
                <LogIn className="size-5" />
              </Button>

              <div className="mt-4 flex justify-center">
                <button
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#1960a3] transition hover:text-[#002045]"
                  onClick={onBack}
                  type="button"
                >
                  <ArrowLeft className="size-4" />
                  Back to Home
                </button>
              </div>
            </form>

            <div className="my-6 flex items-center">
              <div className="h-px flex-1 bg-[#c4c6cf]" />
              <span className="mx-4 text-xs font-semibold uppercase leading-4 tracking-widest text-[#c4c6cf]">
                Or continue with
              </span>
              <div className="h-px flex-1 bg-[#c4c6cf]" />
            </div>

            <Button
              className="mb-3 h-12 w-full rounded-lg border-[#c4c6cf] text-sm font-medium tracking-[0.01em] text-[#1960a3] transition hover:bg-[#ebeef0]"
              variant="outline"
            >
              <University className="size-5" />
              University Portal
            </Button>
          </CardContent>
        </Card>

        <footer className="mt-12 text-center">
          <p className="text-base leading-6 text-[#43474e]">
            New to the platform?{" "}
            <button
              className="ml-1 font-bold text-[#1960a3] hover:underline"
              onClick={onRegister}
              type="button"
            >
              Option to register
            </button>
          </p>
          <div className="mt-6 flex justify-center gap-6 text-xs font-semibold leading-4 tracking-[0.05em] text-[#74777f]">
            <button className="hover:text-[#181c1e]">Privacy Policy</button>
            <button className="hover:text-[#181c1e]">Academic Terms</button>
            <button className="hover:text-[#181c1e]">Support</button>
          </div>
        </footer>
      </div>
    </main>
  );
}

function RegisterScreen({
  onBackToLogin,
  onRegistered,
}: {
  onBackToLogin: () => void;
  onRegistered: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [message, setMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setMessage("Please accept the academic terms to continue.");
      return;
    }

    if (!isSupabaseConfigured) {
      onRegistered();
      return;
    }

    setIsRegistering(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          name: fullName,
          display_name: fullName,
          role,
          student_id: studentId,
        },
      },
    });
    setIsRegistering(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Registration successful. Check your email for verification.");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7fafc] p-4 text-[#181c1e]">
      <div className="fixed left-0 top-0 h-1 w-full bg-gradient-to-r from-[#002045] via-[#1960a3] to-[#1a365d] opacity-50" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,32,69,0.04)_1px,transparent_1px),linear-gradient(rgba(0,32,69,0.04)_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-2 py-6">
        <section className="mb-6 text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-[#002045] text-white shadow-sm">
            <UserPlus className="size-8" strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold leading-8 text-[#002045]">
            Create Account
          </h1>
          <p className="mt-2 text-base font-medium leading-6 text-[#43474e]">
            Join your thesis workspace and start tracking progress.
          </p>
        </section>

        <Card className="rounded-lg border-[#c4c6cf] bg-white shadow-sm">
          <CardContent className="p-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="block text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                  Full Name
                </span>
                <Input
                  className="h-11 rounded-t-lg border-0 border-b border-[#c4c6cf] bg-[#f1f4f6] px-4 text-base shadow-none focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="e.g. John Dela Cruz"
                  required
                  value={fullName}
                />
              </label>

              <div className="grid gap-4">
                <label className="block space-y-2">
                  <span className="block text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                    Student / Faculty ID
                  </span>
                  <Input
                    className="h-11 rounded-t-lg border-0 border-b border-[#c4c6cf] bg-[#f1f4f6] px-4 text-base shadow-none focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                    onChange={(event) => setStudentId(event.target.value)}
                    placeholder="2024-0001"
                    value={studentId}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="block text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                    Role
                  </span>
                  <select
                    className="h-11 w-full rounded-t-lg border-0 border-b border-[#c4c6cf] bg-[#f1f4f6] px-4 text-base outline-none transition focus:bg-white"
                    onChange={(event) => setRole(event.target.value)}
                    value={role}
                  >
                    <option value="student">Student</option>
                    <option value="adviser">Adviser</option>
                    <option value="coordinator">Coordinator</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="block text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                  Email Address
                </span>
                <Input
                  className="h-11 rounded-t-lg border-0 border-b border-[#c4c6cf] bg-[#f1f4f6] px-4 text-base shadow-none focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="e.g. researcher@university.edu"
                  required
                  type="email"
                  value={email}
                />
              </label>

              <div className="grid gap-4">
                <label className="block space-y-2">
                  <span className="block text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                    Password
                  </span>
                  <div className="relative">
                    <Input
                      className="h-11 rounded-t-lg border-0 border-b border-[#c4c6cf] bg-[#f1f4f6] px-4 pr-11 text-base shadow-none focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] transition hover:text-[#0f172a]"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="block text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                    Confirm Password
                  </span>
                  <div className="relative">
                    <Input
                      className="h-11 rounded-t-lg border-0 border-b border-[#c4c6cf] bg-[#f1f4f6] px-4 pr-11 text-base shadow-none focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Repeat password"
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] transition hover:text-[#0f172a]"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </label>
              </div>

              <label className="flex items-start gap-2 text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                <input
                  checked={acceptedTerms}
                  className="mt-1 size-4 rounded border-[#74777f] text-[#002045] focus:ring-[#d6e3ff]"
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  type="checkbox"
                />
                I agree to the Privacy Policy and Academic Terms.
              </label>

              {message && (
                <p
                  className={cn(
                    "rounded px-3 py-2 text-sm font-medium",
                    message.includes("successful")
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700",
                  )}
                >
                  {message}
                </p>
              )}

              <Button
                className="h-12 w-full rounded-lg bg-[#1a365d] text-lg font-semibold text-white transition hover:bg-[#1a365d]/90 active:scale-[0.98]"
                disabled={isRegistering}
                type="submit"
              >
                {isRegistering ? "Creating Account..." : "Create Account"}
                <UserPlus className="size-5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <footer className="mt-6 text-center">
          <p className="text-base leading-6 text-[#43474e]">
            Already have an account?{" "}
            <button
              className="font-bold text-[#1960a3] hover:underline"
              onClick={onBackToLogin}
              type="button"
            >
              Sign in
            </button>
          </p>
        </footer>
      </div>
    </main>
  );
}

type DatabaseRecord = Record<string, unknown>;

type DashboardProject = {
  id: string;
  title: string;
  description: string;
  progress: number | null;
};

type DashboardMilestone = {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  active: boolean;
};

type DashboardDeadline = {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  daysLeft: number;
};

type DashboardFeedback = {
  id: string;
  message: string;
  author: string;
};

type ManuscriptFile = {
  id: string;
  name: string;
  path: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  size: number | null;
};

type DiscussionEntry = {
  id: string;
  author: string;
  message: string;
  time: string;
};

type TimelineItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  date: Date | null;
  dateLabel: string;
  accent: string;
  kind: "milestone" | "task";
};

function getTimelineAccent(status: string) {
  const normalized = status.toLowerCase();
  if (/(done|completed)/i.test(normalized)) {
    return "bg-[#dcfce7] text-[#166534]";
  }
  if (/(in progress|ongoing|active)/i.test(normalized)) {
    return "bg-[#dbeafe] text-[#1d4ed8]";
  }
  if (/(pending|review|awaiting)/i.test(normalized)) {
    return "bg-[#fef3c7] text-[#92400e]";
  }
  return "bg-[#f8fafc] text-[#475569]";
}

function formatTimelineDate(date?: Date) {
  if (!date) {
    return "No date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function normalizeTimelineItem(row: DatabaseRecord, kind: "milestone" | "task", index: number): TimelineItem {
  const status = getString(row, ["status", "state"], kind === "milestone" ? "Pending" : "Planned");
  const date = getDate(row, ["due_date", "deadline", "target_date", "scheduled_at", "created_at"]);
  const title = getString(row, ["title", "name", "task_name", "milestone_name"], kind === "milestone" ? "Untitled milestone" : "Untitled task");
  const description = getString(row, ["description", "notes", "summary", "details"], kind === "milestone" ? "No milestone details available." : "No task details available.");

  return {
    id: getString(row, ["id"], `${kind}-${index}`),
    title,
    description,
    status,
    date,
    dateLabel: date ? formatTimelineDate(date) : `${kind === "milestone" ? "Milestone" : "Task"} ${index + 1}`,
    accent: getTimelineAccent(status),
    kind,
  };
}

type DashboardData = {
  userName: string;
  fullName: string;
  project: DashboardProject | null;
  milestones: DashboardMilestone[];
  deadlines: DashboardDeadline[];
  feedback: DashboardFeedback | null;
  avatarUrl?: string | null;
};

type DashboardLoadState =
  | { status: "loading" }
  | { status: "ready"; data: DashboardData }
  | { status: "empty"; message: string; userId?: string; userName?: string }
  | { status: "error"; message: string };

function getString(row: DatabaseRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function getNumber(row: DatabaseRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return null;
}

function getDate(row: DatabaseRecord, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value !== "string" || !value.trim()) {
      continue;
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

async function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Supabase request timed out. Please refresh.")), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function asRecord(value: unknown): DatabaseRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as DatabaseRecord;
}

function formatRelativeDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getDaysLeft(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function normalizeProject(row: DatabaseRecord): DashboardProject {
  const id = getString(row, ["id"]);

  return {
    id,
    title: getString(row, ["title", "name", "project_title"], "Untitled thesis project"),
    description: getString(row, ["description", "abstract", "summary"]),
    progress: getNumber(row, ["progress", "progress_percent", "completion", "completion_percentage"]),
  };
}

function normalizeMilestone(row: DatabaseRecord, index: number): DashboardMilestone {
  const status = getString(row, ["status", "state"], "Pending");
  const progress = getNumber(row, ["progress", "progress_percent", "completion"]);

  return {
    id: getString(row, ["id"], `milestone-${index}`),
    title: getString(row, ["title", "name"], "Untitled milestone"),
    subtitle: getString(row, ["subtitle", "description", "notes"]),
    status,
    active:
      ["ongoing", "in progress", "active"].includes(status.toLowerCase()) ||
      (progress !== null && progress > 0 && progress < 100),
  };
}

function normalizeTaskAsMilestone(row: DatabaseRecord, index: number): DashboardMilestone {
  const status = getString(row, ["status", "state"], "Pending");

  return {
    id: getString(row, ["id"], `task-milestone-${index}`),
    title: getString(row, ["title", "name"], "Untitled task"),
    subtitle: getString(row, ["description", "notes", "assignee"]),
    status,
    active: ["ongoing", "in progress", "active"].includes(status.toLowerCase()),
  };
}

function normalizeDeadline(row: DatabaseRecord, index: number): DashboardDeadline | null {
  const dueDate = getDate(row, ["due_date", "deadline", "target_date", "scheduled_at"]);

  if (!dueDate) {
    return null;
  }

  return {
    id: getString(row, ["id"], `deadline-${index}`),
    title: getString(row, ["title", "name"], "Untitled deadline"),
    description: getString(row, ["description", "notes"]),
    dueDate,
    daysLeft: getDaysLeft(dueDate),
  };
}

function normalizeFeedback(row: DatabaseRecord): DashboardFeedback {
  return {
    id: getString(row, ["id"], "latest-feedback"),
    message: getString(row, ["message", "comment", "content", "body"], "No feedback text available."),
    author: getString(row, ["author_name", "reviewer_name", "created_by_name"], "Adviser"),
  };
}

function deriveProgress(project: DashboardProject, taskRows: DatabaseRecord[]) {
  if (project.progress !== null) {
    return Math.round(Math.min(100, Math.max(0, project.progress)));
  }

  if (!taskRows.length) {
    return 0;
  }

  const completed = taskRows.filter((task) =>
    ["done", "complete", "completed"].includes(getString(task, ["status", "state"]).toLowerCase()),
  ).length;

  return Math.round((completed / taskRows.length) * 100);
}

function compactRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ) as Record<string, unknown>;
}

function isSchemaIssue(message: string) {
  return /relation .* does not exist|table .* does not exist|column .* does not exist|on conflict target does not exist/i.test(message);
}

async function ensureUserProfile(userId: string, metadata: DatabaseRecord = {}, email?: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) {
    return;
  }

  const fullName = getString(metadata, ["full_name", "name", "display_name", "fullName"]);
  const role = getString(metadata, ["role"]);
  const studentId = getString(metadata, ["student_id", "studentId"]);
  const emailAddress = email ?? getString(metadata, ["email"]);

  const profileCandidates = [
    {
      key: "id",
      data: {
        id: userId,
        email: emailAddress,
        full_name: fullName,
        name: fullName,
        display_name: fullName,
        role,
        student_id: studentId,
      },
    },
    {
      key: "user_id",
      data: {
        user_id: userId,
        email: emailAddress,
        full_name: fullName,
        name: fullName,
        display_name: fullName,
        role,
        student_id: studentId,
      },
    },
  ];

  for (const candidate of profileCandidates) {
    const payload = compactRecord(candidate.data);
    if (!payload[candidate.key]) {
      continue;
    }

    try {
      const upsertResult = await supabase
        .from("users")
        .upsert(payload as any, { onConflict: candidate.key })
        .select("*")
        .maybeSingle();

      if (!upsertResult.error) {
        return;
      }

      const message = String((upsertResult.error as any)?.message || upsertResult.error);
      if (isSchemaIssue(message)) {
        continue;
      }

      console.warn("ensureUserProfile failed with unexpected error:", upsertResult.error, payload);
      return;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (isSchemaIssue(message)) {
        continue;
      }
      console.warn("ensureUserProfile unexpected error:", error, payload);
      return;
    }
  }
}

async function createProjectForUser(
  userId: string,
  title: string,
  description: string,
): Promise<DashboardProject | null> {
  // Resolve effective user id from argument or current auth session
  let effectiveUserId = userId;
  try {
    if (!effectiveUserId) {
      const u = await supabase.auth.getUser();
      effectiveUserId = u.data?.user?.id ?? "";
    }
  } catch (err) {
    console.warn("createProjectForUser: unable to read auth user, proceeding without user id", err);
    effectiveUserId = effectiveUserId ?? "";
  }

  // Try to create a matching profile row first so backend triggers can resolve the auth user.
  try {
    const userInfo = await supabase.auth.getUser();
    await ensureUserProfile(
      effectiveUserId,
      asRecord(userInfo.data?.user?.user_metadata ?? {}) ?? {},
      userInfo.data?.user?.email ?? undefined,
    );
  } catch (error: unknown) {
    console.warn("Failed to ensure user profile row before project creation:", error);
  }

  // Try inserting with multiple common owner columns, retrying if the schema differs
  const candidateInserts: Record<string, any>[] = [];
  if (effectiveUserId) {
    candidateInserts.push({ title, description, owner_id: effectiveUserId, created_by: effectiveUserId, student_id: effectiveUserId });
    candidateInserts.push({ title, description, created_by: effectiveUserId, student_id: effectiveUserId });
    candidateInserts.push({ title, description, student_id: effectiveUserId });
  }
  candidateInserts.push({ title, description });

  let lastError: unknown = null;
  for (const payload of candidateInserts) {
    console.debug("createProjectForUser trying payload:", payload);
    const result = await supabase.from("thesis_projects").insert(payload as any).select("*").maybeSingle();
    if (!result.error) {
      const project = asRecord(result.data);
      return project ? normalizeProject(project) : null;
    }

    lastError = result.error;
    const msg = (result.error && (result.error as any).message) || "";
    const isMissingColumnError = /column .* does not exist/i.test(String(msg)) || /Could not find the '.*' column/i.test(String(msg));
    if (!isMissingColumnError) {
      console.error("createProjectForUser insert failed:", result.error, payload);
      throw result.error;
    }
  }

  console.error("createProjectForUser failed with all insert payloads", lastError);
  throw lastError instanceof Error ? lastError : new Error("Unable to create a project. Please check your thesis_projects schema.");
}


async function fetchFirstProjectForUser(userId: string) {
  const membershipResult = await supabase
    .from("group_members")
    .select("project_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membershipResult.error && membershipResult.data) {
    const membership = asRecord(membershipResult.data) ?? {};
    const projectId = getString(membership, ["project_id"]);

    if (projectId) {
      const projectResult = await supabase
        .from("thesis_projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (!projectResult.error && projectResult.data) {
        const project = asRecord(projectResult.data);
        return project ? normalizeProject(project) : null;
      }

      if (projectResult.error) {
        throw projectResult.error;
      }
    }
  }

  // Try common ownership columns one by one to support varying schemas
  const candidateColumns = ["created_by", "student_id", "owner_id"];
  for (const col of candidateColumns) {
    try {
      const res = await supabase.from("thesis_projects").select("*").eq(col, userId).limit(1).maybeSingle();
      if (!res.error && res.data) {
        const ownProject = asRecord(res.data);
        return ownProject ? normalizeProject(ownProject) : null;
      }
    } catch (e) {
      console.warn(`thesis_projects column lookup failed for ${col}:`, e);
    }
  }

  return null;
}

async function fetchProjectRows(
  table: string,
  projectId: string,
  orderColumn: string,
): Promise<DatabaseRecord[]> {
  const result = await supabase
    .from(table)
    .select("*")
    .eq("project_id", projectId)
    .order(orderColumn, { ascending: true });

  if (result.error) {
    return [];
  }

  if (!Array.isArray(result.data)) {
    return [];
  }

  const rows: DatabaseRecord[] = [];
  for (const row of result.data) {
    const record = asRecord(row);
    if (record) {
      rows.push(record);
    }
  }

  return rows;
}

async function fetchProjectManuscriptFiles(projectId: string, userId: string): Promise<ManuscriptFile[]> {
  const directory = `${projectId}/${userId}`;
  const result = await supabase.storage.from("thesis-documents").list(directory, {
    limit: 100,
    offset: 0,
    sortBy: { column: "updated_at", order: "desc" },
  });

  if (result.error || !Array.isArray(result.data)) {
    return [];
  }

  return result.data
    .map((item) => {
      const record = asRecord(item) ?? {};
      const folderPath = getString(record, ["path"], "");
      const itemName = getString(record, ["name"], "Unnamed document");
      const metadata = asRecord(record.metadata) ?? {};
      const rawSize = metadata && typeof metadata.size === "number" ? metadata.size : null;

      return {
        id: folderPath || `${directory}/${itemName}`,
        name: itemName,
        path: folderPath || `${directory}/${itemName}`,
        createdAt: getDate(record, ["created_at"]),
        updatedAt: getDate(record, ["updated_at"]),
        size: rawSize,
      };
    })
    .filter((file) => Boolean(file.path));
}

async function createSignedManuscriptUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from("thesis-documents").createSignedUrl(filePath, 60);
  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

async function fetchLatestFeedback(projectId: string): Promise<DashboardFeedback | null> {
  for (const table of ["feedback", "comments", "reviews"]) {
    const result = await supabase
      .from(table)
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!result.error) {
      const row = asRecord(result.data);
      if (row) {
        return normalizeFeedback(row);
      }
    }
  }

  return null;
}

async function fetchProjectById(projectId: string): Promise<DashboardProject | null> {
  const result = await supabase
    .from("thesis_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (!result.error && result.data) {
    const project = asRecord(result.data);
    return project ? normalizeProject(project) : null;
  }

  if (result.error) {
    throw result.error;
  }

  return null;
}

async function loadDashboardData(createdProjectId?: string | null): Promise<DashboardLoadState> {
  try {
    if (!isSupabaseConfigured) {
      return {
        status: "error",
        message: "Supabase is not configured. Please add your Supabase keys in .env.",
      };
    }

    const [{ data: userData, error: userError }, { data: sessionData, error: sessionError }] =
      await Promise.all([
        withTimeout(supabase.auth.getUser()),
        withTimeout(supabase.auth.getSession()),
      ]);

    if (userError) {
      return { status: "error", message: userError.message };
    }

    if (sessionError) {
      return { status: "error", message: sessionError.message };
    }

    const user = userData.user ?? sessionData?.session?.user;
    if (!user) {
      return {
        status: "empty",
        message: "You are not signed in. Please sign in to view your dashboard.",
      };
    }

    try {
      await ensureUserProfile(user.id, asRecord(user.user_metadata ?? {}) ?? {}, user.email ?? undefined);
    } catch (error: unknown) {
      console.warn("Unable to ensure user profile during dashboard load:", error);
    }

    const userName = getString(
      asRecord(user.user_metadata) ?? {},
      ["name", "display_name", "full_name", "fullName"],
      user.email ?? "User",
    );

    let project: DashboardProject | null = null;

    if (createdProjectId) {
      project = await withTimeout(fetchProjectById(createdProjectId));
    }

    if (!project) {
      project = await withTimeout(fetchFirstProjectForUser(user.id));
    }

    if (!project) {
      return {
        status: "empty",
        message: "No thesis project was found. Create a project to populate your dashboard.",
        userId: userData.user.id,
        userName,
      };
    }

    const taskRows = await withTimeout(fetchProjectRows("tasks", project.id, "due_date"));
    const milestoneRows = await withTimeout(fetchProjectRows("milestones", project.id, "created_at"));
    const feedback = await withTimeout(fetchLatestFeedback(project.id));
    const progress = deriveProgress(project, taskRows);
    const milestones = (milestoneRows.length ? milestoneRows : taskRows)
      .slice(0, 2)
      .map((row, index) =>
        milestoneRows.length ? normalizeMilestone(row, index) : normalizeTaskAsMilestone(row, index),
      );
    const deadlines = taskRows
      .map(normalizeDeadline)
      .filter((deadline): deadline is DashboardDeadline => Boolean(deadline))
      .filter((deadline) => deadline.daysLeft >= 0)
      .sort((first, second) => first.dueDate.getTime() - second.dueDate.getTime())
      .slice(0, 2);

    const avatarUrl = getString(
      asRecord(userData.user.user_metadata) ?? {},
      ["avatar_url", "avatarUrl", "avatar"],
    );

    return {
      status: "ready",
      data: {
        userName: getString(
          asRecord(userData.user.user_metadata) ?? {},
          ["name", "display_name", "fullName", "full_name"],
          userData.user.email ?? "User",
        ),
        fullName: getString(
          asRecord(userData.user.user_metadata) ?? {},
          ["full_name", "fullName", "name", "display_name"],
          userData.user.email ?? "User",
        ),
        project: { ...project, progress },
        milestones,
        deadlines,
        feedback,
        avatarUrl: avatarUrl || null,
      },
    };
  } catch (err: unknown) {
    console.error("loadDashboardData error:", err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object"
        ? JSON.stringify(err, Object.getOwnPropertyNames(err))
        : String(err);

    return {
      status: "error",
      message,
    };
  }
}

function DashboardScreen({
  createdProjectId,
  onNavigate,
  onProfileClick,
  onNotification,
  notifications = [],
  showNotifications,
  onShowNotifications,
}: {
  createdProjectId?: string | null;
  onNavigate: (screen: Screen) => void;
  onProfileClick?: () => void;
  onNotification?: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void;
  notifications?: Notification[];
  showNotifications?: boolean;
  onShowNotifications?: (show: boolean) => void;
}) {
  const [dashboardState, setDashboardState] = useState<DashboardLoadState>({ status: "loading" });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectMessage, setProjectMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
    onNavigate("login");
  }

  function handleEditNameStart() {
    if (dashboardState.status === "ready") {
      setEditingName(dashboardState.data.userName);
      setIsEditingName(true);
    }
  }

  async function handleSaveName() {
    if (!editingName.trim()) {
      setEditingName(dashboardState.status === "ready" ? dashboardState.data.userName : "");
      setIsEditingName(false);
      return;
    }

    if (dashboardState.status === "ready" && editingName === dashboardState.data.userName) {
      setIsEditingName(false);
      return;
    }

    try {
      if (!isSupabaseConfigured) {
        setIsEditingName(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          name: editingName.trim(),
          display_name: editingName.trim(),
          full_name: editingName.trim(),
        },
      });

      if (error) {
        console.error("Failed to update name:", error);
        return;
      }

      setDashboardState((prev) => {
        if (prev.status === "ready") {
          return {
            ...prev,
            data: {
              ...prev.data,
              userName: editingName.trim(),
              fullName: editingName.trim(),
            },
          };
        }
        return prev;
      });

      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating name:", error);
    }
  }

  function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setAvatarError(null);
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleUploadAvatar() {
    if (!avatarFile || !isSupabaseConfigured) {
      setAvatarError("Please select an image file first.");
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarError(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user?.id) {
        setAvatarError("User not authenticated. Please sign in again.");
        setIsUploadingAvatar(false);
        return;
      }

      const userId = userData.user.id;
      const fileExt = avatarFile.name.split(".").pop()?.toLowerCase();
      
      if (!fileExt || !["jpg", "jpeg", "png", "gif", "webp"].includes(fileExt)) {
        setAvatarError("Please upload a valid image file (JPG, PNG, GIF, or WebP).");
        setIsUploadingAvatar(false);
        return;
      }

      const fileName = `${userId}-avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload avatar to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        if (uploadError.message.includes("bucket")) {
          setAvatarError("Storage not configured. Please ensure the 'avatars' bucket exists in Supabase.");
        } else {
          setAvatarError(uploadError.message || "Failed to upload avatar. Please try again.");
        }
        setIsUploadingAvatar(false);
        return;
      }

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = data.publicUrl;

      // Update user metadata with avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
        },
      });

      if (updateError) {
        console.error("Failed to update avatar URL:", updateError);
        setAvatarError("Failed to save avatar. Please try again.");
        setIsUploadingAvatar(false);
        return;
      }

      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarError(null);
      setAvatarUrl(avatarUrl);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setAvatarError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  useEffect(() => {
    if (dashboardState.status === "ready") {
      setAvatarUrl(dashboardState.data.avatarUrl ?? null);
    }
  }, [dashboardState]);

  useEffect(() => {
    let isMounted = true;

    loadDashboardData(createdProjectId)
      .then((state) => {
        if (isMounted) {
          setDashboardState(state);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          console.error("Dashboard load error:", error);
          setDashboardState({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to load dashboard data.",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [createdProjectId]);

  async function refreshDashboard() {
    setIsRefreshing(true);
    setDashboardState({ status: "loading" });
    try {
      const state = await loadDashboardData(createdProjectId);
      setDashboardState(state);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object"
          ? JSON.stringify(err, Object.getOwnPropertyNames(err))
          : String(err);
      setDashboardState({ status: "error", message });
    } finally {
      setIsRefreshing(false);
    }
  }


  if (dashboardState.status === "loading") {
    return (
      <>
        <Header onLogout={handleLogout} onProfileClick={onProfileClick} onNotification={onNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={onShowNotifications} />
        <main className="grid gap-6 px-4 pb-28 pt-6 md:grid-cols-[1fr_320px] md:px-8">
          <DashboardNotice title="Loading dashboard" message="Fetching your thesis data." />
        </main>
      </>
    );
  }

  if (dashboardState.status === "empty" || dashboardState.status === "error") {
    return (
      <>
        <Header onLogout={handleLogout} onProfileClick={onProfileClick} onNotification={onNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={onShowNotifications} />
        <main className="grid gap-6 px-4 pb-28 pt-6 md:grid-cols-[1fr_320px] md:px-8">
          <DashboardNotice
            title={dashboardState.status === "error" ? "Dashboard unavailable" : "No dashboard data"}
            message={dashboardState.message}
          />
          {dashboardState.status === "error" && (
            <Button
              className="h-12 rounded-lg bg-[#1a365d] text-sm font-semibold text-white hover:bg-[#002045]"
              onClick={() => refreshDashboard()}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <svg className="mr-2 inline-block h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Retrying...
                </>
              ) : (
                'Try Again'
              )}
            </Button>
          )}
          {dashboardState.status === "empty" && (
            <Card className="rounded-lg border-[#c4c6cf] bg-white shadow-sm">
              <CardContent className="space-y-4 p-6">
                <div>
                  <h3 className="text-lg font-semibold leading-7 text-[#002045]">Get the dashboard moving</h3>
                  <p className="mt-2 text-sm leading-6 text-[#43474e]">
                    Create a project and upload your first manuscript to populate the dashboard with milestones, deadlines, and feedback.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    className="h-12 rounded-lg bg-[#1a365d] text-sm font-semibold text-white hover:bg-[#002045]"
                    disabled={isCreatingProject || !dashboardState.userId}
                    onClick={() => onNavigate("createProject")}
                  >
                    Create Project
                  </Button>
                  <Button
                    className="h-12 rounded-lg border-[#1960a3] text-sm font-semibold text-[#1960a3] hover:bg-[#ebeef0]"
                    onClick={() => onNavigate("files")}
                    variant="outline"
                  >
                    Open Manuscripts
                  </Button>
                </div>
                {projectMessage ? (
                  <p className="text-sm font-medium text-red-700">{projectMessage}</p>
                ) : null}
              </CardContent>
            </Card>
          )}
        </main>
      </>
    );
  }

  const { project, milestones, deadlines, feedback } = dashboardState.data;
  const progress = project?.progress ?? 65;
  const primaryDeadline = deadlines[0];

  return (
    <>
      <Header title="ThesiSync" userName={dashboardState.data.userName} onLogout={handleLogout} onProfileClick={onProfileClick} onNotification={onNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={onShowNotifications} />

      <main className="flex min-h-[calc(100vh-76px)] flex-col gap-6 bg-[#f7fafc] px-4 py-6 md:flex-row md:px-8">
        <aside className="flex w-full flex-col gap-6 md:w-[280px]">
          <Card className="rounded-3xl border border-[#e0e3e5] bg-white p-6 shadow-sm">
            <CardContent className="space-y-4 p-0">
              {isEditingName ? (
                <div className="flex flex-col gap-3 rounded-3xl bg-[#f8fafc] p-4">
                  <label className="block space-y-2">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1960a3]">Edit Name</p>
                    <Input
                      autoFocus
                      className="h-11 rounded-t-lg border-0 border-b border-[#c4c6cf] bg-white px-4 text-base shadow-none focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Enter your name"
                      type="text"
                      value={editingName}
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 h-9 rounded-lg bg-[#1d4ed8] text-sm font-semibold text-white hover:bg-[#133c7b]"
                      onClick={handleSaveName}
                      type="button"
                    >
                      Save
                    </Button>
                    <Button
                      className="flex-1 h-9 rounded-lg border border-[#c4c6cf] bg-white text-sm font-semibold text-[#0f172a] hover:bg-[#f1f4f6]"
                      onClick={() => setIsEditingName(false)}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div
                      className="flex items-center gap-4 rounded-3xl bg-[#f8fafc] p-4 text-left transition hover:bg-[#e2efff] w-full cursor-pointer"
                      onClick={onProfileClick}
                    >
                      <div className="relative">
                        <Avatar
                          name={dashboardState.status === "ready" ? dashboardState.data.userName : "User"}
                          src={avatarPreview ?? avatarUrl ?? undefined}
                          className="size-14 bg-[#1d4ed8] text-white"
                        />
                        <button
                          type="button"
                          className="absolute bottom-0 right-0 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#1960a3] cursor-pointer hover:bg-[#1a365d] transition shadow-md"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            avatarInputRef.current?.click();
                          }}
                        >
                          <input
                            ref={avatarInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarFileChange}
                            type="file"
                          />
                          <PenLine className="size-4 text-white" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1960a3]">Profile</p>
                        <h3 className="text-xl font-semibold text-[#002045]">{dashboardState.status === "ready" ? dashboardState.data.userName : "Loading..."}</h3>
                        {dashboardState.status === "ready" && dashboardState.data.fullName ? (
                          <p className="text-sm text-[#64748b]">{dashboardState.data.fullName}</p>
                        ) : (
                          <p className="text-sm text-[#64748b]">Thesis researcher</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {avatarPreview && (
                    <div className="flex flex-col gap-2 rounded-2xl bg-[#f1f5f9] p-3">
                      <div className="flex items-center gap-2">
                        <img src={avatarPreview} alt="Avatar preview" className="size-10 rounded-full object-cover" />
                        <p className="flex-1 text-sm font-semibold text-[#0f172a]">Avatar Preview</p>
                      </div>
                      {avatarError && (
                        <p className="rounded bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                          {avatarError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 h-9 rounded-lg bg-[#1d4ed8] text-sm font-semibold text-white hover:bg-[#133c7b]"
                          disabled={isUploadingAvatar}
                          onClick={handleUploadAvatar}
                          type="button"
                        >
                          {isUploadingAvatar ? "Uploading..." : "Upload Avatar"}
                        </Button>
                        <Button
                          className="flex-1 h-9 rounded-lg border border-[#c4c6cf] bg-white text-sm font-semibold text-[#0f172a] hover:bg-[#f1f4f6]"
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                            setAvatarError(null);
                          }}
                          type="button"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {dashboardState.status === "ready" && (
                    <button
                      type="button"
                      onClick={handleEditNameStart}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-[#f1f5f9] p-3 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#e2efff]"
                    >
                      <PenLine className="size-4" />
                      Edit Name
                    </button>
                  )}
                </>
              )}
              <div className="mt-3 grid gap-3">
                <Button
                  className="h-11 w-full rounded-2xl bg-[#1d4ed8] text-sm font-semibold text-white hover:bg-[#133c7b]"
                  onClick={onProfileClick}
                  type="button"
                >
                  View Profile
                </Button>
                <div className="grid gap-2 rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569]">
                  <div className="rounded-3xl bg-white p-3 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748b]">Projects</p>
                    <p className="mt-1 text-sm font-semibold text-[#0f172a]">1 active</p>
                  </div>
                  <div className="rounded-3xl bg-white p-3 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748b]">Status</p>
                    <p className="mt-1 text-sm font-semibold text-[#0f172a]">Active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-3xl border border-[#e0e3e5] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#002045]">Academic Portal</h2>
            <div className="mt-4 flex items-center gap-3 rounded-3xl border border-[#e0e3e5] bg-[#f1f5f9] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dbeafe] text-[#1d4ed8]">S</div>
              <div>
                <p className="text-sm font-semibold text-[#002045]">Student Portal</p>
                <p className="text-[12px] text-[#64748b]">Thesis Year 2024</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#e0e3e5] bg-white p-4 text-center text-[10px] uppercase tracking-[0.18em] text-[#64748b]">
            v1.0.2
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          <section className="rounded-3xl border border-[#e0e3e5] bg-white p-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-[0.16em] font-semibold text-[#1960a3]">Active Thesis Project</span>
              <h2 className="text-3xl font-semibold text-[#002045]">{project?.title}</h2>
              <p className="text-sm leading-6 text-[#475569] max-w-2xl">
                {project?.description || "A centralized platform designed to optimize communication and resource allocation during local emergencies in suburban barangays."}
              </p>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-3xl border border-[#e0e3e5] bg-white p-6 text-center">
              <h3 className="text-lg font-semibold text-[#002045] mb-6">Total Progress</h3>
              <div
                className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full"
                style={{
                  background: `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(#38A169 ${progress}%, #EDF2F7 0)`,
                }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold text-[#002045]">{progress}%</span>
                  <span className="text-xs uppercase tracking-[0.22em] text-[#64748b]">Complete</span>
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#38A169]" />
                  <span className="text-sm font-medium text-[#475569]">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#EDF2F7]" />
                  <span className="text-sm font-medium text-[#475569]">Remaining</span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#e0e3e5] bg-white p-6 flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-[#002045]">Current Milestones</h3>
              {milestones.length ? (
                <>
                  {milestones.slice(0, 2).map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-4 rounded-3xl border-l-4 border-[#1960a3] bg-[#eff6ff] p-4"
                    >
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-[#002045]">{milestone.title}</h4>
                        <p className="text-xs text-[#475569]">{milestone.subtitle || "Milestone details"}</p>
                      </div>
                      <span className="rounded-full bg-[#dbeafe] px-2 py-1 text-[11px] font-semibold text-[#1960a3]">
                        {milestone.status}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <DashboardEmptyLine message="No current milestones available." />
              )}
              <button
                className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-[#1960a3] hover:underline"
                type="button"
                onClick={() => onNavigate("tasks")}
              >
                <span>View full roadmap</span>
                <ArrowRight className="size-4" />
              </button>
            </section>
          </div>
        </div>

        <aside className="w-full md:w-80 space-y-6">
          <div className="rounded-3xl border border-[#e0e3e5] bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between bg-[#ffdad6]/10 border-b border-[#e0e3e5] p-4">
              <h3 className="text-lg font-semibold text-[#002045]">Deadlines</h3>
              <Calendar className="size-5 text-[#ba1a1a]" />
            </div>
            <div className="space-y-4 p-4">
              {primaryDeadline ? (
                <div className="rounded-3xl border border-[#e0e3e5] border-l-4 border-[#ffb000] bg-[#f1f4f6] p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="rounded-full bg-[#ffb000]/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#856404]">
                      {primaryDeadline.daysLeft === 0
                        ? "Due Today"
                        : primaryDeadline.daysLeft === 1
                          ? "1 Day Left"
                          : `${primaryDeadline.daysLeft} Days Left`}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#002045]">{primaryDeadline.title}</h4>
                  <p className="mt-2 text-xs text-[#475569]">{primaryDeadline.description || "Final submission of Literature Review for Advisor check."}</p>
                  <Button
                    className="mt-4 w-full rounded-2xl bg-[#002045] py-2 text-sm font-semibold text-white hover:bg-[#1a365d]"
                    onClick={() => onNavigate("files")}
                  >
                    Upload Manuscript
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-3xl border-2 border-dashed border-[#c4c6cf] p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#74777f]">No other urgent tasks</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#e0e3e5] bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#475569] mb-3">Advisor Feedback</h3>
            {feedback ? (
              <div className="flex items-start gap-3 rounded-3xl bg-[#f1f4f6] p-3">
                <span className="text-[#1960a3]">💬</span>
                <div>
                  <p className="text-sm italic text-[#181c1e]">“{feedback.message}”</p>
                  <p className="mt-2 text-xs text-[#475569]">— {feedback.author}</p>
                </div>
              </div>
            ) : (
              <DashboardEmptyLine message="No advisor feedback found." />
            )}
          </div>
        </aside>
      </main>
      <div className="h-20 md:hidden" />
    </>
  );
}

function DashboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 py-4 text-center">
      <p className="truncate text-2xl font-bold leading-8 text-[#002045]">{value}</p>
      <p className="mt-1 truncate text-[11px] font-bold uppercase leading-4 tracking-[0.08em] text-[#74777f]">
        {label}
      </p>
    </div>
  );
}

function DashboardNotice({ title, message }: { title: string; message: string }) {
  return (
    <Card className="rounded-lg border-[#c4c6cf] bg-white shadow-sm md:col-span-2">
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[#f1f4f6] text-[#1960a3]">
          <Info className="size-6" />
        </div>
        <h2 className="text-xl font-semibold leading-7 text-[#002045]">{title}</h2>
        <p className="mt-2 max-w-md text-sm font-medium leading-5 text-[#43474e]">{message}</p>
      </CardContent>
    </Card>
  );
}

function DashboardEmptyLine({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-[#c4c6cf] p-4">
      <span className="text-center text-xs font-semibold leading-4 tracking-[0.05em] text-[#74777f]">
        {message}
      </span>
    </div>
  );
}

function CreateProjectScreen({
  onCancel,
  onCreated,
  onLogout,
  onProfileClick,
  onNotification,
  notifications = [],
  showNotifications,
  onShowNotifications,
}: {
  onCancel: () => void;
  onCreated: (projectId: string) => void;
  onLogout?: () => void;
  onProfileClick?: () => void;
  onNotification?: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void;
  notifications?: Notification[];
  showNotifications?: boolean;
  onShowNotifications?: (show: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCreate() {
    setMessage("");
    setIsCreating(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }

      const userId = userData.user?.id;
      if (!userId) {
        setMessage("Please sign in before creating a project.");
        return;
      }

      const project = await createProjectForUser(
        userId,
        title.trim() || "New Thesis Project",
        description.trim() || "A new thesis project created from the dashboard.",
      );

      if (!project) {
        setMessage("Unable to create a project right now.");
        return;
      }

      onCreated(project.id);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object"
          ? JSON.stringify(error, Object.getOwnPropertyNames(error))
          : String(error);
      setMessage(message || "Unable to create a project.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      <Header compact title="Create Project" onLogout={onLogout} onProfileClick={onProfileClick} onNotification={onNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={onShowNotifications} />
      <main className="mx-auto max-w-[430px] px-5 py-6">
        <Card className="rounded-lg border-[#c4c6cf] bg-white shadow-sm">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#002045]">Create thesis project</h2>
                <p className="mt-2 text-sm leading-6 text-[#475569]">
                  Add a project title, description, and launch it into your dashboard.
                </p>
              </div>
              <Button variant="outline" className="text-sm" onClick={onCancel} type="button">
                Cancel
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#334155]">Project title</label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter project title"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#334155]">Project description</label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="min-h-[120px] w-full rounded-xl border border-[#c4c6cf] bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#93c5fd]"
                  placeholder="Describe the goal of this thesis project."
                />
              </div>
            </div>

            {message ? <p className="text-sm font-medium text-red-700">{message}</p> : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-12 rounded-lg bg-[#1a365d] text-sm font-semibold text-white hover:bg-[#002045]"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? "Creating project..." : "Create Project"}
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-lg border-[#1960a3] text-sm font-semibold text-[#1960a3] hover:bg-[#ebeef0]"
                onClick={onCancel}
                type="button"
              >
                Back to dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function DeadlineCard({
  deadline,
  onNavigate,
}: {
  deadline: DashboardDeadline;
  onNavigate: (screen: Screen) => void;
}) {
  const dateLabel =
    deadline.daysLeft === 0
      ? "Due Today"
      : deadline.daysLeft === 1
        ? "1 Day Left"
        : `${deadline.daysLeft} Days Left`;

  return (
    <div className="rounded-lg border border-l-4 border-[#d7dde3] border-l-[#ffb000] bg-white p-4 shadow-sm">
      <Badge className="bg-[#ffb000]/10 text-[#856404] hover:bg-[#ffb000]/10">
        {dateLabel}
      </Badge>
      <h4 className="mt-3 text-sm font-bold leading-5 text-[#002045]">{deadline.title}</h4>
      <p className="mt-1 text-xs font-semibold leading-4 text-[#43474e] break-words">
        {deadline.description || `Due ${formatRelativeDate(deadline.dueDate)}`}
      </p>
      <Button
        className="mt-4 h-10 w-full rounded bg-[#002045] text-sm font-medium text-white hover:bg-[#002045]/90"
        onClick={() => onNavigate("files")}
      >
        Upload Manuscript
      </Button>
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: DashboardFeedback }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[#d7dde3] bg-[#f7fafc] p-3">
      <MessageSquare className="mt-0.5 size-5 shrink-0 text-[#1960a3]" />
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold italic leading-5 text-[#181c1e]">
          "{feedback.message}"
        </p>
        <p className="mt-1 text-xs font-semibold leading-4 text-[#43474e]">
          - {feedback.author}
        </p>
      </div>
    </div>
  );
}

function Milestone({
  title,
  subtitle,
  status,
  active,
}: {
  title: string;
  subtitle: string;
  status: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border border-l-4 bg-[#f7fafc] px-4 py-3",
        active ? "border-[#d7dde3] border-l-[#1960a3]" : "border-[#d7dde3] border-l-[#a7b0ba]",
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-5 text-[#002045]">{title}</p>
        <p className="mt-1 truncate text-xs font-semibold leading-4 text-[#43474e]">
          {subtitle || "No description"}
        </p>
      </div>
      <Badge
        className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
          active ? "bg-[#1960a3]/10 text-[#1960a3]" : "bg-[#e7ecf1] text-[#43474e]",
        )}
      >
        {status}
      </Badge>
    </div>
  );
}

function FilesScreen({ onLogout, onProfileClick, onNotification, notifications = [], showNotifications, onShowNotifications }: { onLogout?: () => void; onProfileClick?: () => void; onNotification?: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void; notifications?: Notification[]; showNotifications?: boolean; onShowNotifications?: (show: boolean) => void; }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [project, setProject] = useState<DashboardProject | null>(null);
  const [manuscriptFiles, setManuscriptFiles] = useState<ManuscriptFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [discussion, setDiscussion] = useState<DiscussionEntry[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFiles() {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase is not configured. Please add your Supabase keys in .env.");
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error(userError?.message || "Unable to load user session.");
      }

      const userId = userData.user.id;
      const currentProject = await fetchFirstProjectForUser(userId);
      if (!currentProject) {
        return {
          project: null,
          files: [] as ManuscriptFile[],
          activePath: null,
          previewUrl: null,
          error: "No thesis project found. Create a project to upload manuscripts.",
        };
      }

      const files = await fetchProjectManuscriptFiles(currentProject.id, userId);
      const activePath = files[0]?.path ?? null;

      return {
        project: currentProject,
        files,
        activePath,
        previewUrl: null,
        error: null,
      };
    }

    loadFiles()
      .then((result) => {
        if (!active) {
          return;
        }

        setProject(result.project);
        setManuscriptFiles(result.files);
        setActiveFilePath(result.activePath);
        setPreviewUrl(result.previewUrl);
        setError(result.error);
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshPreview() {
      if (!active) {
        return;
      }

      if (!activeFilePath || !isSupabaseConfigured) {
        setPreviewUrl(null);
        return;
      }

      const url = await createSignedManuscriptUrl(activeFilePath);
      if (active) {
        setPreviewUrl(url);
      }
    }

    refreshPreview();

    return () => {
      active = false;
    };
  }, [activeFilePath]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setUploadMessage("");
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  async function refreshFiles() {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Please add your Supabase keys in .env.");
      return;
    }

    setIsLoading(true);
    setRefreshMessage("");
    setError(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error(userError?.message || "Unable to load user session.");
      }

      const userId = userData.user.id;
      if (!project) {
        throw new Error("No active project available to refresh manuscript drafts.");
      }

      const files = await fetchProjectManuscriptFiles(project.id, userId);
      setManuscriptFiles(files);
      setActiveFilePath(files[0]?.path ?? null);
      setRefreshMessage("Draft history refreshed.");
      setError(files.length === 0 ? "No manuscript drafts found." : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteDraft(filePath: string) {
    if (!project) {
      setUploadMessage("No project available to delete drafts.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("");

    try {
      const { error: deleteError } = await supabase.storage.from("thesis-documents").remove([filePath]);
      if (deleteError) {
        throw deleteError;
      }

      const updatedFiles = manuscriptFiles.filter((file) => file.path !== filePath);
      setManuscriptFiles(updatedFiles);
      setActiveFilePath((current) => (current === filePath ? updatedFiles[0]?.path ?? null : current));
      setUploadMessage("Draft deleted successfully.");
      onNotification?.("Draft deleted", "The selected manuscript draft was removed.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setUploadMessage(`Delete failed: ${message}`);
      onNotification?.("Delete failed", message, "error");
    } finally {
      setIsUploading(false);
    }
  }

  function handlePostComment() {
    const trimmed = newComment.trim();
    if (!trimmed) {
      return;
    }

    setDiscussion((current) => [
      {
        id: `${Date.now()}`,
        author: "You",
        message: trimmed,
        time: "Just now",
      },
      ...current,
    ]);
    setNewComment("");
    onNotification?.("Comment posted", "Your note has been added to the discussion thread.", "success");
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setUploadMessage("Please select a manuscript file before uploading.");
      return;
    }

    if (!project) {
      setUploadMessage("Create a thesis project before uploading a manuscript.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("");

    try {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase is not configured. Please add your Supabase keys in .env.");
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (userError || !userId) {
        throw new Error(userError?.message || "Unable to identify current user.");
      }

      const filePath = `${project.id}/${userId}/${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("thesis-documents")
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const files = await fetchProjectManuscriptFiles(project.id, userId);
      const activePath = files[0]?.path ?? null;

      setManuscriptFiles(files);
      setActiveFilePath(activePath);
      setSelectedFile(null);
      setUploadMessage(`Uploaded ${selectedFile.name}.`);
      onNotification?.("Upload complete", "Your manuscript draft was uploaded successfully.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setUploadMessage(`Upload failed: ${message}`);
      onNotification?.("Upload failed", message, "error");
    } finally {
      setIsUploading(false);
    }
  }

  const currentFile = manuscriptFiles.find((file) => file.path === activeFilePath) ?? manuscriptFiles[0] ?? null;
  const currentFileLabel = currentFile
    ? `${currentFile.name} · ${currentFile.updatedAt ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(currentFile.updatedAt) : "recently"}`
    : "No manuscript uploaded yet.";
  const fileCountLabel = manuscriptFiles.length > 0 ? `${manuscriptFiles.length} draft${manuscriptFiles.length === 1 ? "" : "s"} uploaded` : "No manuscript drafts yet.";
  const lastUploadText = currentFile
    ? `Last uploaded ${currentFile.updatedAt ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(currentFile.updatedAt) : "recently"}`
    : "No file uploaded this session.";
  const pagesText = currentFile && currentFile.size ? `${Math.max(1, Math.round(currentFile.size / 120000))} pages (estimated)` : "Page count unavailable.";
  const statusText = isLoading
    ? "Loading manuscript data…"
    : error
      ? "Upload a draft to begin review."
      : currentFile
      ? "Awaiting review"
      : "Ready to upload your first draft.";

  return (
    <>
      <Header title="Manuscript" onLogout={onLogout} onProfileClick={onProfileClick} onNotification={onNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={onShowNotifications} />
      <main className="grid gap-6 px-4 pb-28 pt-5 lg:grid-cols-12 md:px-8">
        <section className="flex flex-col gap-4 lg:col-span-7">
          <Card className="rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
            <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1960a3]">
                  Manuscript workspace
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#181c1e]">
                  Upload and review your latest draft
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#475569]">
                  Keep your advisor feedback, revision actions, and file history in one document-centered workspace.
                </p>
              </div>
              <div className="rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569] shadow-inner">
                <p className="font-semibold text-[#0f172a]">Current file</p>
                <p className="mt-2 text-sm text-[#0f172a]">{isLoading ? "Loading manuscript status…" : currentFileLabel}</p>
                <p className="mt-3 text-xs text-[#64748b]">
                  Accepted formats: PDF, DOC, DOCX
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
            <CardContent className="flex flex-col gap-6 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#e0f2fe] text-[#1d4ed8]">
                    <FileText className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0f172a]">Upload Latest Manuscript</h3>
                    <p className="text-sm text-[#475569]">
                      Upload your current draft and keep the project storage in sync.
                    </p>
                  </div>
                </div>
                <Button
                  className="h-11 rounded-full bg-[#002045] px-5 text-sm font-semibold text-white hover:bg-[#1a365d]/90"
                  type="submit"
                  disabled={isUploading || !project}
                  form="manuscript-upload"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>

              <form id="manuscript-upload" className="grid gap-4" onSubmit={handleUpload}>
                <label className="flex min-h-[54px] items-center justify-between rounded-3xl border border-[#c4c6cf] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-[#43474e] transition hover:border-[#1960a3]">
                  <span>{selectedFile?.name ?? "Select manuscript file"}</span>
                  <input className="hidden" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                </label>
                {uploadMessage ? (
                  <p className="text-sm font-medium text-[#1960a3]">{uploadMessage}</p>
                ) : (
                  <p className="text-sm leading-6 text-[#64748b]">
                    Drag and drop is not supported yet, but you can browse your files and upload a draft quickly.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] p-5">
              <div>
                <h3 className="text-lg font-semibold text-[#181c1e]">Manuscript preview</h3>
                <p className="text-sm text-[#64748b]">Preview the latest uploaded draft and advisor notes.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button className="size-9 rounded-full p-0 text-[#0f172a] hover:bg-[#f1f5f9]" size="icon" variant="ghost">
                  <ZoomIn className="size-4" />
                </Button>
                <Button className="size-9 rounded-full p-0 text-[#0f172a] hover:bg-[#f1f5f9]" size="icon" variant="ghost">
                  <ZoomOut className="size-4" />
                </Button>
                <Button asChild className="h-9 gap-2 rounded-full border border-[#c4c6cf] px-3 text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc]" variant="outline">
                  <a href={previewUrl ?? "#"} target="_blank" rel="noreferrer" aria-disabled={!previewUrl}>
                    <ExternalLink className="size-3" />
                    Fullscreen
                  </a>
                </Button>
              </div>
            </div>
            <CardContent className="min-h-[420px] p-6">
              {previewUrl && currentFile ? (
                <div className="flex h-full flex-col justify-center rounded-[2rem] border border-dashed border-[#c4c6cf] bg-[#f8fafc] p-6 text-center text-[#475569]">
                  <div className="mb-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-[#1960a3]">Latest draft</p>
                    <p className="mt-2 text-lg font-semibold text-[#0f172a]">{currentFile.name}</p>
                    <p className="mt-1 text-sm text-[#64748b]">{currentFileLabel}</p>
                  </div>
                  <div className="mt-6">
                    <Button asChild className="h-11 rounded-full bg-[#002045] px-6 text-sm font-semibold text-white hover:bg-[#1a365d]/90">
                      <a href={previewUrl} target="_blank" rel="noreferrer">
                        View latest draft
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#c4c6cf] bg-[#f8fafc] text-center text-[#475569]">
                  <FileText className="mb-4 size-14 text-[#94a3b8]" />
                  <p className="text-lg font-semibold text-[#0f172a]">No manuscript selected</p>
                  <p className="mt-2 max-w-xs text-sm leading-6">
                    Upload your latest draft to preview the first pages and advisor comments here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="flex flex-col gap-4 lg:col-span-5">
          <Card className="rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#74777f]">Manuscript status</p>
                <h3 className="text-xl font-semibold text-[#181c1e]">{statusText}</h3>
              </div>
              <div className="rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569]">
                <p className="font-semibold text-[#0f172a]">Last upload</p>
                <p className="mt-2">{lastUploadText}</p>
              </div>
              <div className="grid gap-3 text-sm text-[#475569]">
                <div className="rounded-3xl bg-[#f8fafc] p-4">
                  <p className="font-semibold text-[#0f172a]">Project</p>
                  <p className="mt-1">{project?.title ?? "No project connected."}</p>
                </div>
                <div className="rounded-3xl bg-[#f8fafc] p-4">
                  <p className="font-semibold text-[#0f172a]">Drafts</p>
                  <p className="mt-1">{fileCountLabel}</p>
                </div>
                <div className="rounded-3xl bg-[#f8fafc] p-4">
                  <p className="font-semibold text-[#0f172a]">Pages</p>
                  <p className="mt-1">{pagesText}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#e2e8f0] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#74777f]">
                  Draft history
                </h3>
                <p className="mt-2 text-xs text-[#64748b]">Select a previous draft to preview or remove obsolete versions.</p>
              </div>
              <div className="flex items-center gap-2">
                {refreshMessage ? (
                  <span className="rounded-full bg-[#ecfdf5] px-3 py-2 text-xs font-semibold text-[#166534]">
                    {refreshMessage}
                  </span>
                ) : null}
                <Button
                  className="h-10 rounded-full bg-[#002045] px-4 text-xs font-semibold text-white hover:bg-[#1a365d]/90"
                  onClick={refreshFiles}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </div>
            </div>
            <CardContent className="space-y-3 p-6">
              {manuscriptFiles.length > 0 ? (
                manuscriptFiles.map((file) => (
                  <div
                    key={file.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-3xl border p-4 transition",
                      file.path === activeFilePath
                        ? "border-[#002045] bg-[#eff6ff]"
                        : "border-[#e2e8f0] bg-[#f8fafc] hover:border-[#1960a3]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveFilePath(file.path)}
                        className="min-w-0 text-left"
                      >
                        <p className="truncate text-sm font-semibold text-[#0f172a]">{file.name}</p>
                        <p className="mt-1 text-xs leading-5 text-[#64748b]">
                          {file.updatedAt ? formatRelativeDate(file.updatedAt) : "No date available"}
                        </p>
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-[11px] font-semibold text-[#64748b]">
                          {file.size ? `${Math.round(file.size / 1024)} KB` : "Unknown size"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(file.path)}
                          className="rounded-full border border-[#c4c6cf] bg-white px-3 py-1 text-[11px] font-semibold text-[#b91c1c] transition hover:bg-[#fee2e2]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl bg-[#f8fafc] p-6 text-sm text-[#475569]">
                  No manuscript drafts uploaded yet. Use the upload area to add your first file.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col overflow-hidden rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
            <div className="border-b border-[#e2e8f0] p-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#74777f]">
                Discussion Thread
              </h3>
            </div>
            <CardContent className="flex-1 space-y-6 overflow-y-auto p-6">
              {discussion.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex gap-4",
                    entry.author === "You" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <Avatar
                    name={entry.author}
                    className={cn(
                      "size-10 shrink-0",
                      entry.author === "You" ? "bg-[#1a365d] text-white" : "border border-[#c4c6cf]",
                    )}
                  />
                  <div className="flex-1">
                    <div className={cn("flex items-start justify-between gap-3", entry.author === "You" ? "flex-row-reverse" : "")}> 
                      <p className={cn("text-sm font-bold", entry.author === "You" ? "text-[#1960a3]" : "text-[#002045]")}>{entry.author}</p>
                      <span className="text-xs font-semibold text-[#74777f]">{entry.time}</span>
                    </div>
                    <div className={cn(
                      "mt-2 rounded-[1.5rem] border p-4",
                      entry.author === "You" ? "border-[#7db6ff] bg-[#7db6ff]/10" : "border-[#c4c6cf] bg-[#f1f4f6]",
                    )}
                    >
                      <p className="text-base leading-6 text-[#181c1e]">{entry.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="rounded-b-3xl border-t border-[#e2e8f0] bg-[#f8fafc] p-6">
              <textarea
                className="h-24 w-full resize-none rounded-3xl border border-[#c4c6cf] bg-white p-4 text-base leading-6 outline-none transition-all focus:border-[#1960a3] focus:ring-0"
                placeholder="Post a comment..."
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
              />
              <div className="mt-4 flex justify-between items-center gap-3">
                <p className="text-xs text-[#64748b]">Keep the thesis discussion visible for your advisor and review team.</p>
                <Button
                  className="h-11 rounded-full bg-[#002045] px-6 text-sm font-medium text-white hover:bg-[#002045]/90"
                  onClick={handlePostComment}
                  type="button"
                >
                  <Send className="size-4" />
                  Post Comment
                </Button>
              </div>
            </div>
          </Card>
        </aside>
      </main>
    </>
  );
}

function TasksScreen({ onLogout, onProfileClick, onNotification, notifications = [], showNotifications, onShowNotifications }: { onLogout?: () => void; onProfileClick?: () => void; onNotification?: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void; notifications?: Notification[]; showNotifications?: boolean; onShowNotifications?: (show: boolean) => void; }) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [projectName, setProjectName] = useState("Timeline");
  const [progress, setProgress] = useState(0);
  const [onTrackCount, setOnTrackCount] = useState(0);
  const [awaitingReviewCount, setAwaitingReviewCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [nextDeadlineLabel, setNextDeadlineLabel] = useState("No upcoming deadlines");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTimeline() {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase is not configured. Please add your Supabase keys in .env.");
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error(userError?.message || "Unable to load user session.");
      }

      const project = await fetchFirstProjectForUser(userData.user.id);
      if (!project) {
        return {
          timelineItems: [] as TimelineItem[],
          projectName: "No project",
          progress: 0,
          onTrackCount: 0,
          awaitingReviewCount: 0,
          completedCount: 0,
          nextDeadlineLabel: "Create a project to see your timeline.",
        };
      }

      const [taskRows, milestoneRows] = await Promise.all([
        fetchProjectRows("tasks", project.id, "due_date"),
        fetchProjectRows("milestones", project.id, "created_at"),
      ]);

      const timeline = [
        ...milestoneRows.map((row, index) => normalizeTimelineItem(row, "milestone", index)),
        ...taskRows.map((row, index) => normalizeTimelineItem(row, "task", index)),
      ].sort((first, second) => {
        if (first.date && second.date) {
          return first.date.getTime() - second.date.getTime();
        }
        if (first.date) {
          return -1;
        }
        if (second.date) {
          return 1;
        }
        return first.id.localeCompare(second.id);
      });

      const nextDeadline = taskRows
        .map(normalizeDeadline)
        .filter((deadline): deadline is DashboardDeadline => Boolean(deadline))
        .filter((deadline) => deadline.daysLeft >= 0)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

      const counts = timeline.reduce(
        (acc, item) => {
          const normalizedStatus = item.status.toLowerCase();
          if (/(done|completed)/i.test(normalizedStatus)) {
            acc.completed += 1;
          } else if (/(review|awaiting)/i.test(normalizedStatus)) {
            acc.awaitingReview += 1;
          } else {
            acc.onTrack += 1;
          }
          return acc;
        },
        { onTrack: 0, awaitingReview: 0, completed: 0 },
      );

      return {
        timelineItems: timeline,
        projectName: project.title,
        progress: deriveProgress(project, taskRows),
        onTrackCount: counts.onTrack,
        awaitingReviewCount: counts.awaitingReview,
        completedCount: counts.completed,
        nextDeadlineLabel: nextDeadline
          ? `${nextDeadline.title} — ${nextDeadline.daysLeft === 0 ? "Today" : nextDeadline.daysLeft === 1 ? "1 day left" : `${nextDeadline.daysLeft} days left`}`
          : "No upcoming deadlines",
      };
    }

    loadTimeline()
      .then((result) => {
        if (!active) {
          return;
        }
        setTimelineItems(result.timelineItems);
        setProjectName(result.projectName);
        setProgress(result.progress);
        setOnTrackCount(result.onTrackCount);
        setAwaitingReviewCount(result.awaitingReviewCount);
        setCompletedCount(result.completedCount);
        setNextDeadlineLabel(result.nextDeadlineLabel);
        setError(null);
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const snapshotTitle = projectName === "No project" ? "Timeline snapshot" : `${projectName} snapshot`;

  return (
    <>
      <Header title="Timeline" onLogout={onLogout} onProfileClick={onProfileClick} onNotification={onNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={onShowNotifications} />
      <main className="relative px-4 pb-28 pt-4 md:px-8 md:pt-6">
        <section className="mb-6 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold leading-8 text-[#181c1e] md:text-[32px] md:leading-10">
              Academic Roadmap
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-6 text-[#43474e]">
              Track milestones, deadlines, and approvals in a structured timeline view.
            </p>
          </div>

          <Card className="rounded-3xl border border-[#c4c6cf] bg-white p-5 shadow-sm">
            <CardContent className="grid gap-4 sm:grid-cols-[1.5fr_1fr] items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1960a3]">
                  {snapshotTitle}
                </p>
                <p className="mt-2 text-lg font-semibold text-[#0f172a]">
                  {isLoading
                    ? "Loading your timeline..."
                    : error
                      ? "Unable to load timeline"
                      : `${timelineItems.length} upcoming items`}
                </p>
              </div>
              <div className="grid gap-2 rounded-2xl bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between text-sm text-[#475569]">
                  <span>On track</span>
                  <span className="font-semibold text-[#0f172a]">{onTrackCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-[#475569]">
                  <span>Awaiting review</span>
                  <span className="font-semibold text-[#0f172a]">{awaitingReviewCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-[#475569]">
                  <span>Completed</span>
                  <span className="font-semibold text-[#0f172a]">{completedCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl border border-[#c4c6cf] bg-white p-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-[#181c1e]">Milestone timeline</h3>
                  <p className="mt-1 text-sm text-[#64748b]">
                    Review the next steps and expected completion dates.
                  </p>
                </div>
                <Button className="h-10 rounded-full bg-[#002045] px-4 text-sm font-semibold text-white hover:bg-[#1a365d]/90">
                  Add milestone
                </Button>
              </div>

              {isLoading ? (
                <div className="rounded-3xl border border-[#e5e7eb] bg-[#f8fafc] p-8 text-center text-sm text-[#64748b]">
                  Loading timeline items...
                </div>
              ) : error ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-[#e5e7eb] bg-[#fef2f2] p-6 text-sm text-[#b91c1c]">
                    {error}
                  </div>
                  <Button className="h-12 rounded-lg bg-[#1a365d] text-sm font-semibold text-white hover:bg-[#002045]" onClick={() => window.location.reload()}>
                    Reload timeline
                  </Button>
                </div>
              ) : timelineItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#c4c6cf] bg-[#f8fafc] p-10 text-center text-sm text-[#64748b]">
                  No timeline items were found. Create a thesis project and add tasks or milestones to populate this view.
                </div>
              ) : (
                <div className="relative space-y-6">
                  <div className="absolute left-5 top-0 h-full w-px bg-[#c4c6cf]" />
                  {timelineItems.map((item) => (
                    <div key={item.id} className="relative pl-10">
                      <div className="absolute left-0 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-[#c4c6cf] shadow-sm">
                        <span className="text-sm font-semibold text-[#0f172a]">{item.dateLabel.split(" ")[0]}</span>
                      </div>
                      <div className="rounded-3xl border border-[#e5e7eb] bg-[#f8fafc] p-5 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${item.accent}`}>
                            {item.status}
                          </span>
                          <span className="text-sm text-[#64748b]">{item.dateLabel}</span>
                        </div>
                        <h4 className="mt-3 text-lg font-semibold text-[#181c1e]">{item.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-[#475569]">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-3xl border border-[#c4c6cf] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#181c1e]">Overall progress</h3>
              <p className="mt-3 text-sm text-[#475569]">
                Keep your project moving by checking completion rates and upcoming deadlines.
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-[#475569]">
                    <span>Project completion</span>
                    <span className="font-semibold text-[#0f172a]">{progress}%</span>
                  </div>
                  <Progress className="h-3 bg-[#e2e8f0]" indicatorClassName="bg-[#74db9d]" value={progress} />
                </div>
                <div className="rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569]">
                  <p className="font-semibold text-[#0f172a]">Next deadline</p>
                  <p className="mt-1">{nextDeadlineLabel}</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border border-[#c4c6cf] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#181c1e]">Team status</h3>
              <div className="mt-4 space-y-3 text-sm text-[#475569]">
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <p className="font-semibold text-[#0f172a]">Tasks on track</p>
                  <p>{onTrackCount} task{onTrackCount === 1 ? "" : "s"} are moving forward.</p>
                </div>
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <p className="font-semibold text-[#0f172a]">Awaiting review</p>
                  <p>{awaitingReviewCount} item{awaitingReviewCount === 1 ? "" : "s"} require approval.</p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
}

function TaskCard({
  color,
  status,
  title,
  assignee,
  priority,
  date,
  progress,
  complete,
}: {
  color: string;
  status: string;
  title: string;
  assignee: string;
  priority: string;
  date?: string;
  progress?: number;
  complete?: boolean;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col justify-between rounded-lg border border-l-4 border-[#c4c6cf] bg-white shadow-sm transition-all duration-200 hover:border-[#1960a3] hover:shadow-md",
        color,
      )}
    >
      <CardContent className="flex h-full flex-col justify-between p-6">
        <div className="flex items-center justify-between">
          <Badge
            className={cn(
              status === "Completed"
                ? "bg-[#38A169]/10 text-[#38A169]"
                : status === "In Progress"
                  ? "bg-[#1960a3]/10 text-[#1960a3]"
                  : "bg-[#D97706]/10 text-[#D97706]",
              "rounded-full px-3 py-1 text-xs font-semibold",
            )}
          >
            {status}
          </Badge>
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-semibold leading-4 tracking-[0.05em]",
              priority === "High"
                ? "text-[#ba1a1a]"
                : priority === "Low"
                  ? "text-[#74777f]"
                  : "text-[#43474e]",
            )}
          >
            {priority === "High" ? "! " : ""}
            {priority}
          </span>
        </div>
        <div>
          <h3
            className={cn(
              "mb-2 mt-4 text-xl font-semibold leading-7 text-[#181c1e]",
              complete && "line-through decoration-[#74777f]",
            )}
          >
            {title}
          </h3>
          <div className="mb-4 flex items-center gap-2 text-base leading-6 text-[#43474e]">
          <Avatar
            name={assignee}
              className={cn(
                "size-6 text-[10px]",
                assignee === "Earl"
                  ? "bg-[#1a365d] text-[#86a0cd]"
                  : assignee === "Maria"
                    ? "bg-[#7db6ff] text-[#00477f]"
                    : "bg-[#d3e4ff] text-[#001c38]",
              )}
          />
          {assignee}
          </div>
        </div>
        {progress !== undefined && (
          <div>
            <Progress className="h-2 bg-[#ebeef0]" indicatorClassName="bg-[#38A169]" value={progress} />
            <p className="mt-1 text-right font-medium">{progress}%</p>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-[#c4c6cf] pt-4">
          {complete ? (
            <span className="flex items-center gap-1 text-sm font-medium text-[#38A169]">
              <CheckCircle2 className="size-[18px]" />
              Done
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm font-medium text-[#43474e]">
              <Calendar className="size-[18px]" />
              {date}
            </span>
          )}
          <Button className="size-8 text-[#74777f] hover:text-[#1960a3]" size="icon" variant="ghost">
            <MoreVertical className="size-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MeetingsScreen({ onLogout, onProfileClick, onNotification, notifications = [], showNotifications, onShowNotifications }: { onLogout?: () => void; onProfileClick?: () => void; onNotification?: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void; notifications?: Notification[]; showNotifications?: boolean; onShowNotifications?: (show: boolean) => void; }) {
  const [requestSent, setRequestSent] = useState(false);
  const [meetingPurpose, setMeetingPurpose] = useState("Review Chapter 3");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingRequests, setMeetingRequests] = useState<MeetingEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [discussion, setDiscussion] = useState<DiscussionEntry[]>([
    {
      id: "advisor-1",
      author: "Dr. Helena Vance",
      message: "Please send the revised chapter draft before the consultation so I can review your changes in advance.",
      time: "2 hours ago",
    },
    {
      id: "you-1",
      author: "You",
      message: "I will upload the latest draft today and confirm the time once the advisor replies.",
      time: "1 hour ago",
    },
  ]);
  const [discussionMessage, setDiscussionMessage] = useState("");

  function handleMeetingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = meetingPurpose.trim() || "Advisor consultation";
    const date = meetingDate || "TBD";
    const time = meetingTime || "TBD";
    const newMeeting: MeetingEntry = {
      id: `${Date.now()}`,
      title,
      date: `${date} ${meetingTime ? `• ${time}` : ""}`.trim(),
      person: "Dr. Helena Vance",
      status: "Pending",
      icon: CalendarCheck,
    };

    setMeetingRequests((current) => [newMeeting, ...current]);
    setRequestSent(true);
    setStatusMessage("Meeting request sent. Your advisor will confirm shortly.");
    onNotification?.("Consultation requested", "Your meeting request was sent successfully.", "success");

    window.setTimeout(() => {
      setRequestSent(false);
      setStatusMessage("");
    }, 3000);
  }

  function handleSendDiscussionMessage() {
    const trimmed = discussionMessage.trim();
    if (!trimmed) {
      return;
    }

    setDiscussion((current) => [
      {
        id: `${Date.now()}`,
        author: "You",
        message: trimmed,
        time: "Just now",
      },
      ...current,
    ]);
    setDiscussionMessage("");
    onNotification?.("Message sent", "Your discussion note was added.", "success");
  }

  return (
    <>
      <Header title="Collaboration" onLogout={onLogout} onProfileClick={onProfileClick} onNotification={onNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={onShowNotifications} />
      <main className="grid gap-6 px-4 pb-28 pt-5 lg:grid-cols-12 md:px-8">
        <section className="space-y-6 lg:col-span-5">
          <div>
            <h2 className="text-2xl font-semibold leading-8 text-[#181c1e] md:text-[32px] md:leading-10">
              Meeting & Consultations
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-6 text-[#43474e]">
              Schedule consultation sessions with your advisor and track all meeting history.
            </p>
          </div>

          <Card className="rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-[#e0f2fe] text-[#1d4ed8]">
                  <CalendarCheck className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#0f172a]">
                  Request Consultation
                </h3>
              </div>
              <form className="space-y-5" onSubmit={handleMeetingSubmit}>
                <label className="block space-y-2">
                  <span className="block text-sm font-semibold text-[#0f172a]">
                    Purpose of Meeting
                  </span>
                  <Input
                    className="h-11 rounded-3xl border border-[#c4c6cf] bg-[#f8fafc] px-4 py-3 text-base shadow-none transition-all focus-visible:border-[#1960a3] focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={meetingPurpose}
                    onChange={(event) => setMeetingPurpose(event.target.value)}
                    placeholder="e.g., Literature Review Feedback"
                    type="text"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block space-y-2">
                    <span className="block text-sm font-semibold text-[#0f172a]">
                      Date
                    </span>
                    <div className="relative">
                      <Input
                        className="h-11 rounded-3xl border border-[#c4c6cf] bg-[#f8fafc] px-4 py-3 pr-10 text-base shadow-none transition-all focus-visible:border-[#1960a3] focus-visible:ring-0 focus-visible:ring-offset-0"
                        type="date"
                        value={meetingDate}
                        onChange={(event) => setMeetingDate(event.target.value)}
                      />
                      <Calendar className="pointer-events-none absolute right-3 top-3 size-5 text-[#74777f]" />
                    </div>
                  </label>
                  <label className="block space-y-2">
                    <span className="block text-sm font-semibold text-[#0f172a]">
                      Preferred Time
                    </span>
                    <div className="relative">
                      <Input
                        className="h-11 rounded-3xl border border-[#c4c6cf] bg-[#f8fafc] px-4 py-3 pr-10 text-base shadow-none transition-all focus-visible:border-[#1960a3] focus-visible:ring-0 focus-visible:ring-offset-0"
                        type="time"
                        value={meetingTime}
                        onChange={(event) => setMeetingTime(event.target.value)}
                      />
                      <Clock3 className="pointer-events-none absolute right-3 top-3 size-5 text-[#74777f]" />
                    </div>
                  </label>
                </div>

                {statusMessage ? (
                  <p className="rounded-3xl border border-[#d1fae5] bg-[#ecfdf5] px-4 py-3 text-sm text-[#166534]">
                    {statusMessage}
                  </p>
                ) : null}

                <Button
                  className={cn(
                    "h-11 w-full rounded-3xl text-sm font-semibold text-white transition-all duration-100 active:scale-[0.98]",
                    requestSent
                      ? "bg-emerald-600 hover:bg-emerald-600"
                      : "bg-[#002045] hover:bg-[#1a365d]",
                  )}
                  type="submit"
                >
                  {requestSent ? <CheckCircle2 className="size-4" /> : <Send className="size-4" />}
                  {requestSent ? "Request Sent" : "Send Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex gap-4 rounded-3xl border border-[#dbeafe] bg-[#f0f9ff] p-5 text-sm text-[#0369a1]">
            <Info className="size-5 shrink-0 flex-shrink-0" />
            <p className="leading-6">
              Advisors typically respond within 48 hours. Ensure your latest manuscript draft is
              uploaded before the scheduled meeting.
            </p>
          </div>
        </section>

        <section className="lg:col-span-7 space-y-6">
          <Card className="overflow-hidden rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-[#181c1e]">Meeting History</h3>
                <p className="text-sm text-[#64748b]">Track past and upcoming sessions.</p>
              </div>
              <button className="rounded-full bg-[#f8fafc] px-4 py-2 text-sm font-semibold text-[#1960a3] transition hover:bg-[#ebeef0]">
                View All
              </button>
            </div>
            <CardContent className="divide-y divide-[#e2e8f0] p-0">
              {meetingRequests.length > 0 ? (
                meetingRequests.map((item) => (
                  <MeetingRow key={item.id} item={item} />
                ))
              ) : (
                <div className="p-10 text-center text-sm text-[#64748b]">
                  No meetings scheduled yet. Submit a consultation request to add your first meeting.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-[#181c1e]">Discussion Thread</h3>
                <p className="text-sm text-[#64748b]">Keep advisor feedback and your notes in one place.</p>
              </div>
              <Badge className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                {discussion.length}
              </Badge>
            </div>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-4">
                {discussion.length > 0 ? (
                  discussion.map((entry) => (
                    <div key={entry.id} className="rounded-3xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#0f172a]">{entry.author}</p>
                          <p className="text-xs text-[#64748b]">{entry.time}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#43474e]">{entry.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-[#c4c6cf] bg-[#f8fafc] p-6 text-center text-sm text-[#64748b]">
                    No discussion notes yet. Use this thread to keep advisor feedback and project updates aligned.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block space-y-2">
                  <span className="block text-sm font-semibold text-[#0f172a]">New message</span>
                  <textarea
                    className="min-h-[120px] w-full resize-none rounded-3xl border border-[#c4c6cf] bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-[#181c1e] shadow-sm transition-all focus:border-[#1960a3] focus:outline-none focus:ring-0"
                    placeholder="Add a note for your advisor or record a decision..."
                    value={discussionMessage}
                    onChange={(event) => setDiscussionMessage(event.target.value)}
                  />
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[#64748b]">Messages appear at the top of the thread.</p>
                  <Button
                    className="h-11 rounded-3xl bg-[#002045] px-5 text-sm font-semibold text-white hover:bg-[#1a365d]"
                    onClick={handleSendDiscussionMessage}
                    type="button"
                  >
                    Send Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}

function ProfileScreen({ onBack, onLogout, onNotification, notifications = [], showNotifications, onShowNotifications }: { onBack: () => void; onLogout: () => void; onNotification?: (title: string, message: string, type?: "info" | "success" | "warning" | "error") => void; notifications?: Notification[]; showNotifications?: boolean; onShowNotifications?: (show: boolean) => void; }) {
  const [userName, setUserName] = useState("User");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [role, setRole] = useState("Researcher");
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveNameMessage, setSaveNameMessage] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      const user = data.user;
      if (!user) {
        return;
      }

      const meta = (user.user_metadata ?? {}) as Record<string, any>;
      const resolvedFullName = meta.full_name ?? meta.name ?? user.email ?? "User";
      setUserName(resolvedFullName);
      setFullName(resolvedFullName);
      setEditName(resolvedFullName);
      setEmail(user.email ?? "");
      setStudentId(meta.student_id ?? meta.studentId ?? "");
      setRole(meta.role ?? role);
      setMemberSince(user.created_at ?? null);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Header title="Profile" onLogout={onLogout} onNotification={onNotification} notifications={notifications} showNotifications={showNotifications} onShowNotifications={onShowNotifications} />
      <main className="grid gap-6 px-4 pb-28 pt-5 md:px-8">
        <Card className="rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={userName} className="size-16 bg-[#1d4ed8] text-white" />
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1960a3]">Profile</p>
                <div className="flex items-center gap-3">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName((e.target as HTMLInputElement).value)}
                        className="h-10 w-[220px]"
                        aria-label="Edit full name"
                      />
                      <Button
                        className="h-10"
                        onClick={async () => {
                          setSaveNameMessage("");
                          if (!isSupabaseConfigured) {
                            setFullName(editName);
                            setUserName(editName);
                            setIsEditingName(false);
                            return;
                          }

                          setIsSavingName(true);
                          try {
                            const { error } = await supabase.auth.updateUser({ data: { full_name: editName, name: editName, display_name: editName } });
                            if (error) {
                              setSaveNameMessage(error.message || "Unable to save name.");
                            } else {
                              setFullName(editName);
                              setUserName(editName);
                              setIsEditingName(false);
                            }
                          } catch (err: unknown) {
                            setSaveNameMessage(err instanceof Error ? err.message : String(err));
                          } finally {
                            setIsSavingName(false);
                          }
                        }}
                        disabled={isSavingName}
                      >
                        {isSavingName ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10"
                        onClick={() => {
                          setEditName(fullName || userName);
                          setIsEditingName(false);
                          setSaveNameMessage("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-semibold text-[#0f172a]">{fullName || userName}</h2>
                      <button
                        aria-label="Edit name"
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2ff] text-[#0f172a] hover:bg-[#e0e7ff]"
                      >
                        <PenLine className="size-4" />
                      </button>
                    </>
                  )}
                </div>
                <p className="text-sm text-[#64748b]">{email || "No email available"}</p>
                {saveNameMessage ? <p className="text-sm text-red-700">{saveNameMessage}</p> : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748b]">Full name</p>
                <p className="mt-1 font-semibold text-[#0f172a]">{fullName || userName}</p>
              </div>
              <div className="rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748b]">Email</p>
                <p className="mt-1 font-semibold text-[#0f172a]">{email || "—"}</p>
              </div>
              <div className="rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748b]">Student ID</p>
                <p className="mt-1 font-semibold text-[#0f172a]">{studentId || "—"}</p>
              </div>
              <div className="rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748b]">Role</p>
                <p className="mt-1 font-semibold text-[#0f172a]">{role || "Researcher"}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748b]">Member since</p>
              <p className="mt-1 font-semibold text-[#0f172a]">{memberSince ? formatRelativeDate(new Date(memberSince)) : "—"}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="h-12 w-full rounded-lg bg-[#1a365d] text-white hover:bg-[#002045]" onClick={onBack} type="button">
                Back to Dashboard
              </Button>
              <Button className="h-12 w-full rounded-lg border border-[#dbeafe] bg-white text-sm font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]" onClick={() => setShowLogoutConfirm(true)} type="button">
                Logout
              </Button>
            </div>
            {showLogoutConfirm && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center sm:py-0">
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:mx-0">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[#0f172a]">Confirm Logout</h2>
                      <p className="mt-2 text-sm text-[#475569]">Are you sure you want to logout?</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(false)}
                      className="rounded-full bg-[#f1f5f9] p-2 text-[#64748b] transition hover:bg-[#e2e8f0]"
                      aria-label="Close logout confirmation"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Button
                      className="h-12 w-full rounded-lg bg-[#ef4444] text-white hover:bg-[#dc2626]"
                      onClick={onLogout}
                      type="button"
                    >
                      Yes, logout
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 w-full rounded-lg border-[#c4c6cf] bg-white text-[#475569] hover:bg-[#f8fafc]"
                      onClick={() => setShowLogoutConfirm(false)}
                      type="button"
                    >
                      No, stay signed in
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function MeetingRow({ item }: { item: (typeof meetings)[number] }) {
  const Icon = item.icon;
  const config = {
    Approved: {
      border: "border-l-[#2B6CB0]",
      badge: "bg-[#1960a3]/10 text-[#1960a3]",
    },
    Completed: {
      border: "border-l-[#38A169]",
      badge: "bg-[#38A169]/10 text-[#003f23]",
    },
    Pending: {
      border: "border-l-[#D97706]",
      badge: "bg-[#fcd34d]/20 text-[#92400e]",
    },
  }[item.status];

  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 border-l-4 px-6 py-5 transition-colors hover:bg-[#f8fafc] md:flex-row md:items-center md:gap-6",
        config.border,
      )}
    >
      <div className="flex items-start gap-4 flex-1">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-[#f1f5f9] text-[#0f172a]">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-lg font-semibold leading-6 text-[#0f172a]">{item.title}</h4>
          <p className="mt-1 text-sm leading-5 text-[#475569]">{item.date}</p>
          <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#64748b]">
            <Building2 className="size-4" />
            {item.person}
          </p>
        </div>
      </div>
      <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold shrink-0", config.badge)}>
        {item.status}
      </Badge>
    </div>
  );
}

function BottomNav({
  current,
  onChange,
}: {
  current: Screen;
  onChange: (screen: Screen) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-[#e2e8f0] bg-white/95 px-3 py-2 backdrop-blur-md shadow-[0_-2px_18px_rgba(15,23,42,0.08)] md:hidden">
      <div className="grid grid-cols-4 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              aria-label={item.label}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-3xl px-2 py-2 text-[11px] font-semibold transition",
                active
                  ? "bg-[#eff6ff] text-[#1d4ed8] shadow-sm"
                  : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]",
              )}
              onClick={() => onChange(item.id)}
              type="button"
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-4 rounded bg-slate-100", className)} />;
}

export default App;
