import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  ClerkProvider,
  SignIn,
  SignUp,
  useAuth,
  useClerk,
  useUser,
} from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDashed,
  ClipboardCheck,
  ExternalLink,
  FileWarning,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Menu,
  Newspaper,
  QrCode,
  RefreshCw,
  ScanLine,
  Server,
  ShieldCheck,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  getGetTruthLensDashboardQueryKey,
  useConnectTruthLensWhatsApp,
  useDisconnectTruthLensWhatsApp,
  useGetTruthLensDashboard,
  type RecentActivity as ActivityRecord,
  type TruthLensDashboard,
} from '@workspace/api-client-react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Redirect,
  Route,
  Router as WouterRouter,
  Switch,
  Link,
  useLocation,
} from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#3eaf83',
    colorForeground: '#243246',
    colorMutedForeground: '#697878',
    colorDanger: '#c94b40',
    colorBackground: '#fbfaf6',
    colorInput: '#f5f4ee',
    colorInputForeground: '#243246',
    colorNeutral: '#dddcd2',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.7rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbfaf6] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-[0_20px_60px_rgba(36,50,70,0.12)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#243246] font-bold',
    headerSubtitle: 'text-[#697878]',
    socialButtonsBlockButtonText: 'text-[#243246] font-semibold',
    formFieldLabel: 'text-[#243246] font-semibold',
    footerActionLink: 'text-[#287d61] font-semibold',
    footerActionText: 'text-[#697878]',
    dividerText: 'text-[#697878]',
    identityPreviewEditButton: 'text-[#287d61]',
    formFieldSuccessText: 'text-[#287d61]',
    alertText: 'text-[#9b3f38]',
    logoBox: 'mb-2',
    logoImage: 'h-9 w-auto',
    socialButtonsBlockButton: 'border-[#dddcd2] bg-[#f5f4ee] hover:bg-[#ecebe3]',
    formButtonPrimary: 'bg-[#243246] hover:bg-[#31445c] text-[#fbfaf6] font-semibold',
    formFieldInput: 'bg-[#f5f4ee] border-[#dddcd2] text-[#243246]',
    footerAction: 'border-t border-[#e5e3d9] pt-5',
    dividerLine: 'bg-[#dddcd2]',
    alert: 'bg-[#f8e9e6] border-[#e8b8b1]',
    otpCodeFieldInput: 'bg-[#f5f4ee] border-[#dddcd2] text-[#243246]',
    formFieldRow: 'mb-4',
    main: 'px-8 pb-7',
  },
};

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'gap-2' : ''}`} data-testid="brand-mark">
      <div className="relative grid size-10 place-items-center rounded-xl bg-[#3eaf83] text-[#172536] shadow-[4px_4px_0_#d5a13a]">
        <ScanLine size={21} strokeWidth={2.4} />
        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#d5a13a]" />
      </div>
      <div>
        <div className="display-font text-[17px] font-extrabold leading-none tracking-[-.04em] text-current">TruthLens</div>
        <div className="mono-font mt-1 text-[9px] font-medium uppercase tracking-[.2em] opacity-60">Naija desk</div>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && isSignedIn) return <Redirect to="/dashboard" />;
  return <LandingPage />;
}

function LandingPage() {
  return (
    <main className="grain min-h-[100dvh] overflow-hidden bg-[#f3f0e8] text-[#243246]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-10">
        <Link href="/" className="text-[#243246]" data-testid="link-home-brand">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#52626a] transition-colors hover:text-[#243246] sm:inline-flex" data-testid="link-sign-in">
            Sign in
          </Link>
          <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-full bg-[#243246] px-4 py-2.5 text-sm font-semibold text-[#f3f0e8] transition-transform hover:-translate-y-0.5" data-testid="link-sign-up">
            Open desk <ChevronRight size={15} />
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-12 md:grid-cols-[1.1fr_.9fr] md:px-10 md:pb-32 md:pt-20">
        <div className="animate-rise-in">
          <div className="mono-font mb-7 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.18em] text-[#287d61]">
            <span className="size-2 rounded-full bg-[#3eaf83] animate-pulse-dot" /> Verification, for the group chat
          </div>
          <h1 className="display-font max-w-3xl text-[clamp(3.3rem,8vw,7.5rem)] font-extrabold leading-[.9] tracking-[-.075em]">
            Slow down<br /><span className="text-[#3eaf83]">the rumour.</span>
          </h1>
          <p className="mt-8 max-w-lg text-lg leading-8 text-[#52626a] md:text-xl">
            TruthLens Naija gives your WhatsApp community a second look before a claim becomes a certainty. Check words, inspect media, and see what the evidence actually says.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/sign-up" className="group inline-flex items-center gap-3 rounded-full bg-[#3eaf83] px-6 py-3.5 font-semibold text-[#172536] transition-all hover:-translate-y-1 hover:bg-[#4abe91]" data-testid="button-start-verifying">
              Start verifying <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 px-2 py-3 font-semibold text-[#52626a] hover:text-[#243246]" data-testid="link-see-how">
              See how it works <ArrowDownRight size={16} />
            </a>
          </div>
        </div>

        <div className="relative animate-rise-in delay-2" data-testid="illustration-verification-desk">
          <div className="absolute -right-6 -top-8 size-36 rounded-full border border-[#d5a13a]/40 md:size-56" />
          <div className="absolute -bottom-7 -left-8 size-28 rounded-full bg-[#d5a13a]/20 md:size-40" />
          <div className="relative overflow-hidden rounded-[2rem] border border-[#d9d4c6] bg-[#e8e4d9] p-4 shadow-[0_25px_80px_rgba(36,50,70,.15)] md:p-7">
            <div className="rounded-2xl bg-[#243246] p-5 text-[#f3f0e8] md:p-7">
              <div className="flex items-center justify-between border-b border-[#52626a]/50 pb-5">
                <div className="flex items-center gap-2 text-xs font-semibold"><span className="size-2 rounded-full bg-[#3eaf83]" /> Live verification desk</div>
                <span className="mono-font text-[10px] text-[#aebcb6]">09:42:18 WAT</span>
              </div>
              <div className="py-7">
                <div className="mono-font text-[10px] uppercase tracking-[.18em] text-[#aebcb6]">Incoming message / 0142</div>
                <p className="mt-3 text-xl font-semibold leading-snug md:text-2xl">“New levy starts next week for every Lagos resident.”</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#34455b] p-3"><div className="mono-font text-[10px] text-[#aebcb6]">VERDICT</div><div className="mt-1 text-sm font-semibold text-[#d5a13a]">Unverified</div></div>
                <div className="rounded-xl bg-[#34455b] p-3"><div className="mono-font text-[10px] text-[#aebcb6]">CONFIDENCE</div><div className="mt-1 text-sm font-semibold">82%</div></div>
                <div className="rounded-xl bg-[#34455b] p-3"><div className="mono-font text-[10px] text-[#aebcb6]">SOURCES</div><div className="mt-1 text-sm font-semibold">04 found</div></div>
              </div>
            </div>
            <div className="flex items-center justify-between px-2 pt-5 text-xs font-semibold text-[#52626a]">
              <span className="flex items-center gap-2"><MessageCircle size={15} /> WhatsApp connected</span>
              <span className="mono-font text-[10px]">TL / 01</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#d9d4c6] bg-[#ebe7dc]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:grid-cols-[.8fr_1.2fr] md:px-10 md:py-28">
          <div>
            <div className="mono-font text-[11px] uppercase tracking-[.18em] text-[#287d61]">A better pause</div>
            <h2 className="display-font mt-4 max-w-md text-4xl font-bold leading-[.98] tracking-[-.06em] md:text-6xl">Evidence with local context.</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              ['01', 'Connect once', 'Pair your WhatsApp number and let the desk watch for new claims.'],
              ['02', 'Read the signal', 'See source quality, confidence, and what is still uncertain.'],
              ['03', 'Share the nuance', 'Bring a clear answer back to the group without overclaiming.'],
            ].map(([number, title, body]) => (
              <div key={number} className="border-t-2 border-[#243246] pt-4" data-testid={`feature-step-${number}`}>
                <div className="mono-font text-xs text-[#d5a13a]">{number}</div>
                <h3 className="mt-7 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#52626a]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="mono-font text-[11px] uppercase tracking-[.18em] text-[#287d61]">Built for the messy middle</div>
            <h2 className="display-font mt-4 max-w-2xl text-4xl font-bold leading-none tracking-[-.06em] md:text-6xl">Not every answer is yes or no.</h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-[#52626a]">The desk keeps uncertainty visible, so your team can make better calls when the signal is incomplete.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-12">
          <div className="rounded-3xl bg-[#243246] p-7 text-[#f3f0e8] md:col-span-7 md:p-10">
            <ShieldCheck className="text-[#3eaf83]" size={27} />
            <h3 className="display-font mt-16 max-w-md text-3xl font-bold leading-tight tracking-[-.04em]">A clear trail from message to evidence.</h3>
            <div className="mt-8 flex flex-wrap gap-2 text-xs text-[#aebcb6]">
              {['Claim context', 'Source trail', 'Confidence score'].map((label) => <span key={label} className="rounded-full border border-[#52626a] px-3 py-1.5">{label}</span>)}
            </div>
          </div>
          <div className="paper-grid rounded-3xl border border-[#d9d4c6] bg-[#f8f6f0] p-7 md:col-span-5 md:p-10">
            <BarChart3 className="text-[#d5a13a]" size={27} />
            <h3 className="display-font mt-16 text-3xl font-bold leading-tight tracking-[-.04em]">See what your community is asking.</h3>
            <p className="mt-4 text-sm leading-6 text-[#52626a]">One operational view for claims, media, flags, and provider health.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#d9d4c6] px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs text-[#697878] sm:flex-row sm:items-center">
          <BrandMark compact />
          <span>TruthLens Naija · Verification is a practice.</span>
        </div>
      </footer>
    </main>
  );
}

function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return (
    <main className="grain flex min-h-[100dvh] items-center justify-center bg-[#e9e6dc] px-4 py-10">
      <div className="absolute left-5 top-5 sm:left-8 sm:top-8">
        <Link href="/" className="text-[#243246]" data-testid="link-auth-brand"><BrandMark compact /></Link>
      </div>
      <div className="w-full max-w-[440px]">
        {mode === 'sign-in' ? (
          <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        ) : (
          <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        )}
      </div>
    </main>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) {
        client.clear();
      }
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function ProtectedDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <DashboardLoading />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <Dashboard />;
}

function DashboardLoading() {
  return (
    <div className="flex min-h-[100dvh] bg-[#f3f0e8]">
      <div className="hidden w-[252px] shrink-0 bg-[#243246] p-7 md:block"><div className="h-10 w-36 animate-pulse rounded-lg bg-[#34455b]" /></div>
      <main className="w-full p-5 md:p-10"><div className="h-8 w-64 animate-pulse rounded bg-[#dddcd2]" /><div className="mt-10 grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-[#e6e2d8]" />)}</div></main>
    </div>
  );
}

type StatusTone = 'green' | 'amber' | 'red' | 'slate';
function StatusPill({ label, tone = 'slate', pulse = false }: { label: string; tone?: StatusTone; pulse?: boolean }) {
  const colors = {
    green: 'bg-[#e0f1e8] text-[#287d61]',
    amber: 'bg-[#f8edd6] text-[#9b6e16]',
    red: 'bg-[#f8e4e1] text-[#a8443b]',
    slate: 'bg-[#e9eceb] text-[#52626a]',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${colors[tone]}`}><span className={`size-1.5 rounded-full bg-current ${pulse ? 'animate-pulse-dot' : ''}`} />{label}</span>;
}

function MetricCard({ label, value, detail, icon: Icon, tone }: { label: string; value: string | number; detail: string; icon: typeof Activity; tone: 'green' | 'amber' | 'blue' | 'red' }) {
  const tones = { green: 'text-[#287d61] bg-[#e0f1e8]', amber: 'text-[#9b6e16] bg-[#f8edd6]', blue: 'text-[#44788a] bg-[#e1eef1]', red: 'text-[#a8443b] bg-[#f8e4e1]' };
  return (
    <div className="rounded-2xl border border-[#dfddd3] bg-[#fbfaf6] p-5 shadow-[0_1px_2px_rgba(31,42,57,.04)] transition-transform hover:-translate-y-0.5" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <div className="flex items-start justify-between"><div className={`grid size-9 place-items-center rounded-xl ${tones[tone]}`}><Icon size={17} /></div><span className="mono-font text-[10px] text-[#8a9590]">24H</span></div>
      <div className="mono-font mt-5 text-3xl font-medium tracking-[-.06em] text-[#243246]" data-testid={`value-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</div>
      <div className="mt-1 text-xs font-semibold text-[#52626a]">{label}</div>
      <div className="mt-3 text-[11px] text-[#839092]">{detail}</div>
    </div>
  );
}

function WhatsAppPanel({ whatsapp }: { whatsapp: TruthLensDashboard['whatsapp'] }) {
  const client = useQueryClient();
  const [actionError, setActionError] = useState('');
  const connect = useConnectTruthLensWhatsApp({
    mutation: {
      onSuccess: () => client.invalidateQueries({ queryKey: getGetTruthLensDashboardQueryKey() }),
      onError: () => setActionError('Could not start the WhatsApp connection. Try again.'),
    },
  });
  const disconnect = useDisconnectTruthLensWhatsApp({
    mutation: {
      onSuccess: () => client.invalidateQueries({ queryKey: getGetTruthLensDashboardQueryKey() }),
      onError: () => setActionError('Could not disconnect WhatsApp. Try again.'),
    },
  });
  const isBusy = connect.isPending || disconnect.isPending;
  const state = whatsapp.state;
  const config = {
    connected: { label: 'Connected', tone: 'green' as StatusTone, icon: CheckCircle2, copy: whatsapp.phoneNumber ? `Listening on ${whatsapp.phoneNumber}` : 'Listening for new messages' },
    qr: { label: 'Scan to pair', tone: 'amber' as StatusTone, icon: QrCode, copy: 'Open WhatsApp on your phone and scan this code' },
    connecting: { label: 'Connecting', tone: 'amber' as StatusTone, icon: LoaderCircle, copy: 'The desk is opening a secure session' },
    error: { label: 'Connection error', tone: 'red' as StatusTone, icon: XCircle, copy: whatsapp.lastError || 'WhatsApp needs attention' },
    disconnected: { label: 'Disconnected', tone: 'slate' as StatusTone, icon: CircleDashed, copy: 'Pair a number to start monitoring' },
    idle: { label: 'Not connected', tone: 'slate' as StatusTone, icon: CircleDashed, copy: 'Pair a number to start monitoring' },
  }[state];
  const Icon = config.icon;
  return (
    <section className="rounded-2xl border border-[#dfddd3] bg-[#fbfaf6] p-5 shadow-[0_1px_2px_rgba(31,42,57,.04)] md:p-6" data-testid="panel-whatsapp">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="mono-font text-[10px] uppercase tracking-[.16em] text-[#839092]">Operations / 01</div><h2 className="mt-2 flex items-center gap-2 text-lg font-bold"><MessageCircle size={19} className="text-[#287d61]" /> WhatsApp line</h2></div>
        <StatusPill label={config.label} tone={config.tone} pulse={state === 'connecting'} />
      </div>
      <div className="mt-6 min-h-[194px] rounded-xl border border-dashed border-[#d8d7cd] bg-[#f5f3ec] p-5">
        {state === 'qr' && whatsapp.qrCode ? (
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="rounded-xl bg-[#fbfaf6] p-3 shadow-sm"><QRCodeSVG value={whatsapp.qrCode} size={148} bgColor="#fbfaf6" fgColor="#243246" level="M" data-testid="qr-whatsapp" /></div>
            <div><div className="text-sm font-bold">Scan this code to pair</div><p className="mt-2 max-w-xs text-xs leading-5 text-[#697878]">{config.copy}. This code refreshes automatically.</p><div className="mono-font mt-4 text-[10px] uppercase tracking-[.12em] text-[#9b6e16]">Waiting for scan</div></div>
          </div>
        ) : (
          <div className="flex h-full min-h-[150px] flex-col justify-center">
            <Icon size={28} className={`${config.tone === 'green' ? 'text-[#287d61]' : config.tone === 'red' ? 'text-[#a8443b]' : 'text-[#9b6e16]'} ${state === 'connecting' ? 'animate-spin' : ''}`} />
            <div className="mt-4 text-sm font-bold">{config.copy}</div>
            {whatsapp.connectedAt && state === 'connected' && <div className="mono-font mt-2 text-[10px] text-[#839092]">Connected {new Date(whatsapp.connectedAt).toLocaleString()}</div>}
          </div>
        )}
      </div>
      {actionError && <div className="mt-3 flex items-center gap-2 text-xs text-[#a8443b]" data-testid="error-whatsapp-action"><CircleAlert size={14} />{actionError}</div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#839092]"><Server size={14} /> Polling every 5 seconds</div>
        {state === 'connected' ? (
          <button type="button" onClick={() => { setActionError(''); disconnect.mutate(); }} disabled={isBusy} className="inline-flex items-center gap-2 rounded-lg border border-[#e6c2bd] px-3 py-2 text-xs font-semibold text-[#a8443b] transition-colors hover:bg-[#f8e4e1] disabled:opacity-50" data-testid="button-disconnect-whatsapp">{disconnect.isPending ? <LoaderCircle size={14} className="animate-spin" /> : <X size={14} />} Disconnect</button>
        ) : (
          <button type="button" onClick={() => { setActionError(''); connect.mutate(); }} disabled={isBusy || state === 'connecting' || state === 'qr'} className="inline-flex items-center gap-2 rounded-lg bg-[#243246] px-3 py-2 text-xs font-semibold text-[#f3f0e8] transition-colors hover:bg-[#31445c] disabled:opacity-50" data-testid="button-connect-whatsapp">{connect.isPending ? <LoaderCircle size={14} className="animate-spin" /> : <QrCode size={14} />} {state === 'qr' ? 'Waiting for scan' : 'Connect WhatsApp'}</button>
        )}
      </div>
    </section>
  );
}

function ProviderPanel({ providers }: { providers: TruthLensDashboard['providers'] }) {
  const labels: Record<keyof TruthLensDashboard['providers'], string> = { groq: 'Groq', nvidia: 'NVIDIA', googleFactCheck: 'Google Fact Check', tavily: 'Tavily Search', sightengine: 'Sightengine' };
  return (
    <section className="rounded-2xl border border-[#dfddd3] bg-[#fbfaf6] p-5 shadow-[0_1px_2px_rgba(31,42,57,.04)] md:p-6" data-testid="panel-providers">
      <div className="flex items-start justify-between"><div><div className="mono-font text-[10px] uppercase tracking-[.16em] text-[#839092]">System / 02</div><h2 className="mt-2 flex items-center gap-2 text-lg font-bold"><Sparkles size={18} className="text-[#d5a13a]" /> Evidence providers</h2></div><span className="mono-font text-[10px] text-[#839092]">{Object.values(providers).filter(Boolean).length}/5 online</span></div>
      <div className="mt-7 divide-y divide-[#ece9df]">
        {(Object.keys(labels) as Array<keyof typeof labels>).map((key) => (
          <div key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0" data-testid={`provider-${key}`}>
            <div className="flex items-center gap-3"><span className={`grid size-7 place-items-center rounded-lg ${providers[key] ? 'bg-[#e0f1e8] text-[#287d61]' : 'bg-[#ecebe5] text-[#89928f]'}`}>{providers[key] ? <Check size={14} /> : <X size={14} />}</span><span className="text-sm font-semibold text-[#3e4c56]">{labels[key]}</span></div>
             <span className={`text-[11px] font-semibold ${providers[key] ? 'text-[#287d61]' : 'text-[#89928f]'}`}>{providers[key] ? 'Configured' : 'Key missing'}</span>
          </div>
        ))}
      </div>
       <div className="mt-6 rounded-xl bg-[#f5f3ec] px-3 py-2.5 text-[11px] leading-5 text-[#697878]">This shows which provider credentials are configured; live availability is confirmed during each check.</div>
    </section>
  );
}

function verdictTone(verdict: string): StatusTone {
  const value = verdict.toLowerCase();
  if (value.includes('true') || value.includes('verified') || value.includes('accurate')) return 'green';
  if (value.includes('false') || value.includes('misleading') || value.includes('fake')) return 'red';
  return 'amber';
}

function ActivityRow({ item }: { item: ActivityRecord }) {
  const tone = verdictTone(item.verdict);
  return (
    <div className="group grid gap-4 border-b border-[#ece9df] py-5 last:border-0 md:grid-cols-[1fr_180px_110px]" data-testid={`activity-${item.id}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[11px] text-[#839092]"><span className={`grid size-6 place-items-center rounded-md ${item.type === 'claim' ? 'bg-[#e1eef1] text-[#44788a]' : 'bg-[#f8edd6] text-[#9b6e16]'}`}>{item.type === 'claim' ? <Newspaper size={13} /> : <FileWarning size={13} />}</span><span className="capitalize">{item.type}</span><span>·</span><span>{item.submittedBy}</span><span>·</span><span>{new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
        <div className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-[#243246]">{item.summary}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">{item.sources.slice(0, 3).map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded bg-[#f2f0e8] px-2 py-1 text-[10px] font-medium text-[#697878] hover:text-[#287d61]" data-testid={`link-source-${item.id}-${source.name}`}><ExternalLink size={10} />{source.name}</a>)}</div>
      </div>
      <div className="flex flex-col justify-center"><StatusPill label={item.verdict} tone={tone} /><div className="mt-3 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e6e3da]"><div className={`h-full rounded-full ${tone === 'green' ? 'bg-[#3eaf83]' : tone === 'red' ? 'bg-[#c94b40]' : 'bg-[#d5a13a]'}`} style={{ width: `${item.confidence}%` }} /></div><span className="mono-font text-[10px] text-[#697878]">{item.confidence}%</span></div></div>
      <div className="hidden items-center justify-end md:flex"><button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-[#697878] opacity-0 transition-opacity hover:text-[#287d61] group-hover:opacity-100" onClick={() => window.open(item.sources[0]?.url || '#', '_blank', 'noopener,noreferrer')} data-testid={`button-open-activity-${item.id}`}>Inspect <ExternalLink size={13} /></button></div>
    </div>
  );
}

function ActivityPanel({ activities }: { activities: ActivityRecord[] }) {
  return (
    <section className="rounded-2xl border border-[#dfddd3] bg-[#fbfaf6] p-5 shadow-[0_1px_2px_rgba(31,42,57,.04)] md:p-6" data-testid="panel-activity">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="mono-font text-[10px] uppercase tracking-[.16em] text-[#839092]">Inbox / 03</div><h2 className="mt-2 flex items-center gap-2 text-lg font-bold"><Activity size={18} className="text-[#44788a]" /> Recent activity</h2></div><span className="text-xs text-[#839092]">{activities.length} latest checks</span></div>
      {activities.length === 0 ? (
        <div className="mt-7 grid min-h-52 place-items-center rounded-xl border border-dashed border-[#d8d7cd] bg-[#f5f3ec] p-8 text-center" data-testid="empty-recent-activity"><div><ClipboardCheck className="mx-auto text-[#9aa49f]" size={29} /><div className="mt-3 text-sm font-bold text-[#52626a]">No checks have landed yet</div><p className="mt-1 text-xs text-[#839092]">New claims and media checks will appear here.</p></div></div>
      ) : <div className="mt-5">{activities.map((item) => <ActivityRow key={item.id} item={item} />)}</div>}
    </section>
  );
}

function Dashboard() {
  const [mobileNav, setMobileNav] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data, isLoading, isError, error, refetch, isFetching } = useGetTruthLensDashboard({
    query: { queryKey: getGetTruthLensDashboardQueryKey(), refetchInterval: 5000 },
  });
  if (isLoading) return <DashboardLoading />;
  if (isError || !data) {
    return <div className="flex min-h-[100dvh] items-center justify-center bg-[#f3f0e8] p-5"><div className="max-w-md rounded-2xl border border-[#e6c2bd] bg-[#fbfaf6] p-8 text-center shadow-[0_8px_30px_rgba(36,50,70,.08)]"><CircleAlert className="mx-auto text-[#a8443b]" size={32} /><h1 className="mt-4 text-xl font-bold text-[#243246]">The desk is unavailable</h1><p className="mt-2 text-sm leading-6 text-[#697878]">{error instanceof Error ? error.message : 'We could not load the verification dashboard.'}</p><button type="button" onClick={() => refetch()} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#243246] px-4 py-2.5 text-sm font-semibold text-[#f3f0e8]" data-testid="button-retry-dashboard"><RefreshCw size={15} /> Try again</button></div></div>;
  }
  return <DashboardContent data={data} user={user} mobileNav={mobileNav} setMobileNav={setMobileNav} signOut={signOut} isFetching={isFetching} />;
}

function DashboardContent({ data, user, mobileNav, setMobileNav, signOut, isFetching }: { data: TruthLensDashboard; user: ReturnType<typeof useUser>['user']; mobileNav: boolean; setMobileNav: (value: boolean) => void; signOut: ReturnType<typeof useClerk>['signOut']; isFetching: boolean }) {
  const nav = <aside className={`${mobileNav ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden'} w-[252px] shrink-0 flex-col bg-[#243246] p-6 text-[#f3f0e8] md:sticky md:top-0 md:flex md:h-[100dvh]`}>
    <div className="flex items-center justify-between"><BrandMark /><button type="button" className="text-[#aebcb6] md:hidden" onClick={() => setMobileNav(false)} data-testid="button-close-menu"><X size={18} /></button></div>
    <div className="mt-12"><div className="mono-font mb-3 text-[10px] uppercase tracking-[.2em] text-[#8fa39c]">Workspace</div><div className="flex items-center gap-3 rounded-xl bg-[#34455b] px-3 py-3 text-sm font-semibold"><BarChart3 size={17} className="text-[#3eaf83]" /> Verification desk</div></div>
    <div className="mt-auto border-t border-[#52626a]/50 pt-5"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-full bg-[#3eaf83] font-bold text-[#172536]">{user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || 'T'}</div><div className="min-w-0"><div className="truncate text-sm font-semibold">{user?.firstName || 'Desk operator'}</div><div className="truncate text-[11px] text-[#aebcb6]">{user?.emailAddresses[0]?.emailAddress}</div></div></div><button type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} className="mt-5 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-[#aebcb6] transition-colors hover:bg-[#34455b] hover:text-[#f3f0e8]" data-testid="button-sign-out"><LogOut size={14} /> Sign out</button></div>
  </aside>;
  return (
    <div className="grain flex min-h-[100dvh] bg-[#f3f0e8] text-[#243246]">
      {nav}
      {mobileNav && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-[#172536]/40 md:hidden" onClick={() => setMobileNav(false)} data-testid="button-overlay-menu" />}
      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-[#dfddd3] bg-[#f8f6f0]/90 px-5 py-4 backdrop-blur md:px-10 md:py-5">
          <div className="flex items-center gap-3"><button type="button" className="rounded-lg p-2 hover:bg-[#e9e6dc] md:hidden" onClick={() => setMobileNav(true)} data-testid="button-open-menu"><Menu size={20} /></button><div><div className="mono-font text-[10px] uppercase tracking-[.18em] text-[#839092]">Tuesday, 14 May 2024</div><h1 className="display-font mt-1 text-xl font-bold tracking-[-.04em] md:text-2xl">Good morning, {user?.firstName || 'operator'}.</h1></div></div>
          <div className="hidden items-center gap-3 sm:flex"><div className="flex items-center gap-2 text-[11px] text-[#839092]"><span className={`size-1.5 rounded-full bg-[#3eaf83] ${isFetching ? 'animate-pulse-dot' : ''}`} /> Live sync</div><div className="h-5 w-px bg-[#d9d7ce]" /><div className="mono-font text-[10px] text-[#839092]">TL / 01</div></div>
        </header>
        <div className="mx-auto max-w-[1500px] p-5 md:p-10">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="mono-font text-[11px] uppercase tracking-[.18em] text-[#287d61]">Field report</div><p className="mt-2 max-w-xl text-sm leading-6 text-[#697878]">A live read on your WhatsApp line, evidence providers, and the claims needing a closer look.</p></div><div className="mono-font text-[10px] text-[#839092]">Last refresh: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Messages received" value={data.metrics.messagesReceived.toLocaleString()} detail="Across connected lines" icon={MessageCircle} tone="green" />
            <MetricCard label="Claims checked" value={data.metrics.claimsChecked.toLocaleString()} detail="Text-based verification" icon={ClipboardCheck} tone="blue" />
            <MetricCard label="Media checked" value={data.metrics.mediaChecked.toLocaleString()} detail="Images, video, audio" icon={ScanLine} tone="amber" />
            <MetricCard label="Flagged for review" value={data.metrics.flaggedCount.toLocaleString()} detail="Needs a human look" icon={CircleAlert} tone="red" />
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.18fr_.82fr]"><WhatsAppPanel whatsapp={data.whatsapp} /><ProviderPanel providers={data.providers} /></div>
          <div className="mt-5"><ActivityPanel activities={data.recentActivity} /></div>
        </div>
      </main>
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Return to your verification desk' } }, signUp: { start: { title: 'Open your desk', subtitle: 'Build a calmer way to check the chat' } } }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={() => <AuthPage mode="sign-in" />} />
            <Route path="/sign-up/*?" component={() => <AuthPage mode="sign-up" />} />
            <Route path="/dashboard" component={ProtectedDashboard} />
            <Route component={NotFound} />
          </Switch>
        </RoutedErrorBoundary>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <TooltipProvider>
        <ClerkProviderWithRoutes />
        <Toaster />
      </TooltipProvider>
    </WouterRouter>
  );
}

export default App;