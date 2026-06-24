import {
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
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
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Screen = "landing" | "login" | "register" | "dashboard" | "createProject" | "tasks" | "files" | "meetings";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Grid2X2 },
  { id: "tasks", label: "Timeline", icon: ClipboardList },
  { id: "files", label: "Manuscript", icon: FileText },
  { id: "meetings", label: "Collaboration", icon: MessageSquare },
] as const;

const meetings = [
  {
    title: "Methodology Deep-Dive",
    date: "Nov 14, 2023 - 10:30 AM",
    person: "Dr. Helena Vance",
    status: "Approved",
    icon: CalendarCheck,
  },
  {
    title: "Initial Proposal Review",
    date: "Oct 22, 2023 - 02:00 PM",
    person: "Dr. Helena Vance",
    status: "Completed",
    icon: CheckCircle2,
  },
  {
    title: "Bibliography Audit",
    date: "Dec 01, 2023 - 09:00 AM",
    person: "Library Liaison",
    status: "Pending",
    icon: XCircle,
  },
] as const;

function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [isAuthChecked, setIsAuthChecked] = useState(false);

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
        {screen === "dashboard" && <DashboardScreen onNavigate={setScreen} />}
        {screen === "createProject" && (
          <CreateProjectScreen
            onCancel={() => setScreen("dashboard")}
            onCreated={() => setScreen("dashboard")}
          />
        )}
        {screen === "tasks" && <TasksScreen />}
        {screen === "files" && <FilesScreen />}
        {screen === "meetings" && <MeetingsScreen />}
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
  title = "Dissertation Hub",
  userName,
  onLogout,
}: {
  compact?: boolean;
  title?: string;
  userName?: string;
  onLogout?: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#c4c6cf] bg-[#f7fafc] px-5 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        {compact ? (
          <Menu className="size-5 shrink-0 text-[#0f172a]" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e2e8f0] ring-1 ring-[#c4c6cf] text-[#0f172a]">
            <span className="font-bold">D</span>
          </div>
        )}
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
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ffffff] text-[#0f172a] shadow-sm transition hover:bg-[#e2e8f0]" type="button">
          <Bell className="size-5" />
        </button>
        {onLogout ? (
          <>
            <Button
              className="hidden h-11 rounded-full bg-[#e2e8f0] px-4 text-sm font-semibold text-[#0f172a] hover:bg-[#cbd5e1] md:inline-flex"
              onClick={onLogout}
              type="button"
            >
              Logout
            </Button>
            <button
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#e2e8f0] text-[#0f172a] shadow-sm transition hover:bg-[#cbd5e1] md:hidden"
              onClick={onLogout}
              type="button"
            >
              <LogOut className="size-5" />
            </button>
          </>
        ) : null}
        {compact ? (
          <Avatar name={userName ?? "User"} className="size-8 bg-[#0f172a] text-white" />
        ) : userName ? (
          <Avatar name={userName} className="hidden size-12 bg-[#0f172a] text-white min-[390px]:flex" />
        ) : (
          <div className="hidden h-12 w-12 rounded-full bg-[#e2e8f0] ring-1 ring-[#c4c6cf] min-[390px]:flex" />
        )}
      </div>
    </header>
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
                  <p className="text-xs font-semibold text-[#74777f]">Thesis Year 2024</p>
                </div>
              </div>
              <button
                className="rounded-full border border-[#c4c6cf] bg-white px-4 py-2 text-sm font-semibold text-[#002045] transition hover:bg-[#f1f4f6]"
                onClick={onSignIn}
                type="button"
              >
                Sign In
              </button>
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
          <div className="rounded-lg border border-[#c4c6cf] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1960a3]">
                  Active Project
                </p>
                <h2 className="mt-2 text-xl font-bold leading-7 text-[#002045]">
                  Barangay Emergency Response System
                </h2>
              </div>
              <Badge className="bg-[#1960a3]/10 text-[#1960a3] hover:bg-[#1960a3]/10">
                65%
              </Badge>
            </div>
            <Progress className="mt-4 h-2 bg-[#ebeef0]" indicatorClassName="bg-[#1960a3]" value={65} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              <LandingMetric label="Progress" value="65%" />
              <LandingMetric label="Tasks" value="12" />
              <LandingMetric label="Reviews" value="4" />
            </div>
          </div>

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

function LandingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d6e3ff] bg-[#f8fbff] p-3 text-center">
      <p className="text-lg font-bold text-[#002045]">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-[#1960a3]">{label}</p>
    </div>
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
}: {
  onRegister: () => void;
  onSignIn: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
                <span className="flex items-center justify-between">
                  <span className="block text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                    Password
                  </span>
                  <button
                    className="text-xs font-semibold uppercase leading-4 tracking-[0.05em] text-[#1960a3] transition hover:underline"
                    type="button"
                  >
                    Forgot Password?
                  </button>
                </span>
                <Input
                  className="h-12 rounded-t-lg border-0 border-b border-[#c4c6cf] bg-[#f1f4f6] px-4 text-base shadow-none transition-all focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type="password"
                  value={password}
                />
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
                  <Input
                    className="h-11 rounded-t-lg border-0 border-b border-[#c4c6cf] bg-[#f1f4f6] px-4 text-base shadow-none focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    type="password"
                    value={password}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="block text-sm font-medium leading-5 tracking-[0.01em] text-[#43474e]">
                    Confirm Password
                  </span>
                  <Input
                    className="h-11 rounded-t-lg border-0 border-b border-[#c4c6cf] bg-[#f1f4f6] px-4 text-base shadow-none focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat password"
                    required
                    type="password"
                    value={confirmPassword}
                  />
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

type DashboardData = {
  userName: string;
  project: DashboardProject | null;
  milestones: DashboardMilestone[];
  deadlines: DashboardDeadline[];
  feedback: DashboardFeedback | null;
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
      // ignore and try next column
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

async function loadDashboardData(): Promise<DashboardLoadState> {
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

    const userName = getString(
      asRecord(user.user_metadata) ?? {},
      ["full_name", "name"],
      user.email ?? "User",
    );

    const project = await withTimeout(fetchFirstProjectForUser(user.id));

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

    return {
      status: "ready",
      data: {
        userName: getString(
          asRecord(userData.user.user_metadata) ?? {},
          ["full_name", "name"],
          userData.user.email ?? "User",
        ),
        project: { ...project, progress },
        milestones,
        deadlines,
        feedback,
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

function DashboardScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [dashboardState, setDashboardState] = useState<DashboardLoadState>({ status: "loading" });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectMessage, setProjectMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
    onNavigate("login");
  }

  useEffect(() => {
    let isMounted = true;

    loadDashboardData()
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
  }, []);

  async function refreshDashboard() {
    setIsRefreshing(true);
    setDashboardState({ status: "loading" });
    try {
      const state = await loadDashboardData();
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
        <Header onLogout={handleLogout} />
        <main className="grid gap-6 px-4 pb-28 pt-6 md:grid-cols-[1fr_320px] md:px-8">
          <DashboardNotice title="Loading dashboard" message="Fetching your thesis data." />
        </main>
      </>
    );
  }

  if (dashboardState.status === "empty" || dashboardState.status === "error") {
    return (
      <>
        <Header onLogout={handleLogout} />
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
      <Header title="Dissertation Hub" userName={dashboardState.data.userName} onLogout={handleLogout} />

      <main className="flex min-h-[calc(100vh-76px)] flex-col gap-6 bg-[#f7fafc] px-4 py-6 md:flex-row md:px-8">
        <aside className="hidden md:flex md:w-[280px] md:flex-col md:gap-6">
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

          <nav className="rounded-3xl border border-[#e0e3e5] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.id === "dashboard";
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    type="button"
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      active ? "bg-[#dbeafe] text-[#1d4ed8]" : "text-[#475569] hover:bg-[#f8fafc]",
                    )}
                  >
                    <Icon className="size-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => onNavigate("meetings")}
                className="mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc]"
              >
                <Info className="size-5" />
                <span>Settings</span>
              </button>
            </div>
          </nav>

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
}: {
  onCancel: () => void;
  onCreated: () => void;
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

      onCreated();
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
      <Header compact title="Create Project" />
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

function FilesScreen() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setUploadMessage("");
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) {
      setUploadMessage("Please select a manuscript file before uploading.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("");

    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    setUploadMessage(`Uploaded ${selectedFile.name}.`);
    setIsUploading(false);
    setSelectedFile(null);
  }

  return (
    <>
      <Header title="Manuscript" />
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
                  Keep your advisor feedback, revision actions, and file history in one document
                  centered workspace.
                </p>
              </div>
              <div className="rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569] shadow-inner">
                <p className="font-semibold text-[#0f172a]">Current file</p>
                <p className="mt-2">No manuscript uploaded yet.</p>
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
                      Upload your current draft and track reviewer feedback instantly.
                    </p>
                  </div>
                </div>
                <Button className="h-11 rounded-full bg-[#002045] px-5 text-sm font-semibold text-white hover:bg-[#1a365d]/90" type="submit" disabled={isUploading} form="manuscript-upload">
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
                <Button className="h-9 gap-2 rounded-full border border-[#c4c6cf] px-3 text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc]" variant="outline">
                  <ExternalLink className="size-3" />
                  Fullscreen
                </Button>
              </div>
            </div>
            <CardContent className="min-h-[420px] p-6">
              <div className="flex h-full flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#c4c6cf] bg-[#f8fafc] text-center text-[#475569]">
                <FileText className="mb-4 size-14 text-[#94a3b8]" />
                <p className="text-lg font-semibold text-[#0f172a]">No manuscript selected</p>
                <p className="mt-2 max-w-xs text-sm leading-6">
                  Upload your latest draft to preview the first pages and advisor comments here.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="flex flex-col gap-4 lg:col-span-5">
          <Card className="rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#74777f]">Manuscript status</p>
                <h3 className="text-xl font-semibold text-[#181c1e]">Awaiting review</h3>
              </div>
              <div className="rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569]">
                <p className="font-semibold text-[#0f172a]">Last upload</p>
                <p className="mt-2">No file uploaded this session.</p>
              </div>
              <div className="grid gap-3 text-sm text-[#475569]">
                <div className="rounded-3xl bg-[#f8fafc] p-4">
                  <p className="font-semibold text-[#0f172a]">Next review</p>
                  <p className="mt-1">Advisor feedback due in 2 days.</p>
                </div>
                <div className="rounded-3xl bg-[#f8fafc] p-4">
                  <p className="font-semibold text-[#0f172a]">Pages</p>
                  <p className="mt-1">42 pages in the current draft.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col overflow-hidden rounded-3xl border border-[#d7dde3] bg-white shadow-sm">
            <div className="border-b border-[#e2e8f0] p-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#74777f]">
                Discussion Thread
              </h3>
            </div>
            <CardContent className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="flex gap-4">
                <Avatar name="Dr. Sarah" className="size-10 border border-[#c4c6cf]" />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-[#002045]">Dr. Sarah Thompson</p>
                    <span className="shrink-0 text-xs font-semibold text-[#74777f]">3 hours ago</span>
                  </div>
                  <div className="mt-2 rounded-[1.5rem] border border-[#c4c6cf] bg-[#f1f4f6] p-4">
                    <p className="text-base leading-6 text-[#181c1e]">
                      Please revise Chapter 2 methodology and add related studies. The current
                      approach lacks empirical depth for the 2024 scope.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-row-reverse gap-4">
                <Avatar name="You" className="size-10 shrink-0 bg-[#1a365d] text-white" />
                <div className="flex-1">
                  <div className="flex flex-row-reverse items-start justify-between gap-3">
                    <p className="text-sm font-bold text-[#1960a3]">You</p>
                    <span className="text-xs font-semibold text-[#74777f]">1 hour ago</span>
                  </div>
                  <div className="mt-2 rounded-[1.5rem] border border-[#7db6ff] bg-[#7db6ff]/10 p-4">
                    <p className="text-base leading-6 text-[#181c1e]">
                      Noted, Dr. Thompson. I will add the Smith and Wesson (2023) studies to
                      strengthen the framework.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="rounded-b-3xl border-t border-[#e2e8f0] bg-[#f8fafc] p-6">
              <textarea
                className="h-24 w-full resize-none rounded-3xl border border-[#c4c6cf] bg-white p-4 text-base leading-6 outline-none transition-all focus:border-[#1960a3] focus:ring-0"
                placeholder="Post a comment..."
              />
              <div className="mt-4 flex justify-end">
                <Button className="h-11 rounded-full bg-[#002045] px-6 text-sm font-medium text-white hover:bg-[#002045]/90">
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

function TasksScreen() {
  const timelineItems = [
    {
      title: "Research methodology review",
      description: "Finalize research approach and validate measurement plan with your advisor.",
      status: "Upcoming",
      date: "Oct 24, 2023",
      accent: "bg-[#fef3c7] text-[#92400e]",
    },
    {
      title: "Database schema approval",
      description: "Confirm the schema with your technical committee and prepare sample dataset.",
      status: "In Progress",
      date: "Oct 20, 2023",
      accent: "bg-[#dbeafe] text-[#1d4ed8]",
    },
    {
      title: "Chapter 1 draft complete",
      description: "Submit the first chapter draft and collect reviewer feedback.",
      status: "Completed",
      date: "Oct 14, 2023",
      accent: "bg-[#dcfce7] text-[#166534]",
    },
  ];

  return (
    <>
      <Header title="Timeline" />
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
                  Timeline snapshot
                </p>
                <p className="mt-2 text-lg font-semibold text-[#0f172a]">
                  3 milestone stages due this week.
                </p>
              </div>
              <div className="grid gap-2 rounded-2xl bg-[#f8fafc] p-4">
                <div className="flex items-center justify-between text-sm text-[#475569]">
                  <span>On track</span>
                  <span className="font-semibold text-[#0f172a]">2</span>
                </div>
                <div className="flex items-center justify-between text-sm text-[#475569]">
                  <span>Awaiting review</span>
                  <span className="font-semibold text-[#0f172a]">1</span>
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

              <div className="relative space-y-6">
                <div className="absolute left-5 top-0 h-full w-px bg-[#c4c6cf]" />
                {timelineItems.map((item) => (
                  <div key={item.title} className="relative pl-10">
                    <div className="absolute left-0 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-[#c4c6cf] shadow-sm">
                      <span className="text-sm font-semibold text-[#0f172a]">{item.date.split(" ")[0]}</span>
                    </div>
                    <div className="rounded-3xl border border-[#e5e7eb] bg-[#f8fafc] p-5 shadow-sm">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${item.accent}`}>
                          {item.status}
                        </span>
                        <span className="text-sm text-[#64748b]">{item.date}</span>
                      </div>
                      <h4 className="mt-3 text-lg font-semibold text-[#181c1e]">{item.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-[#475569]">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
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
                    <span>Chapter completion</span>
                    <span className="font-semibold text-[#0f172a]">32%</span>
                  </div>
                  <Progress className="h-3 bg-[#e2e8f0]" indicatorClassName="bg-[#74db9d]" value={32} />
                </div>
                <div className="rounded-3xl bg-[#f8fafc] p-4 text-sm text-[#475569]">
                  <p className="font-semibold text-[#0f172a]">Next deadline</p>
                  <p className="mt-1">Chapter 2 First Draft — 4 days left</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border border-[#c4c6cf] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[#181c1e]">Team status</h3>
              <div className="mt-4 space-y-3 text-sm text-[#475569]">
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <p className="font-semibold text-[#0f172a]">Maria</p>
                  <p>Design milestone due in 2 days.</p>
                </div>
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <p className="font-semibold text-[#0f172a]">Earl</p>
                  <p>Database schema under review.</p>
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

function MeetingsScreen() {
  const [requestSent, setRequestSent] = useState(false);

  function handleMeetingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestSent(true);
    window.setTimeout(() => setRequestSent(false), 2000);
  }

  return (
    <>
      <Header title="Collaboration" />
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
                    defaultValue="Review Chapter 3"
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
                      />
                      <Clock3 className="pointer-events-none absolute right-3 top-3 size-5 text-[#74777f]" />
                    </div>
                  </label>
                </div>

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

        <section className="lg:col-span-7">
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
              {meetings.map((item) => (
                <MeetingRow key={item.title} item={item} />
              ))}
            </CardContent>
          </Card>
        </section>
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
