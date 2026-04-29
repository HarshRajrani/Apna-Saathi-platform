import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Clock, Layers, Package, Wallet, BarChart3, MapPin, Navigation, CheckCircle2, Linkedin, Twitter, Github, Menu, X } from 'lucide-react';
import Button from '../components/landing/Button';
import Card from '../components/landing/Card';
import FeatureItem from '../components/landing/FeatureItem';

/* ───────── 1. HEADER ───────── */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: 'Home', href: '#' },
    { label: 'Merchant', href: '#services' },
    { label: 'Rider', href: '#services' },
    { label: 'How it Works', href: '#snap' },
  ];

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-charcoal/70 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Apna Saathi" className="w-9 h-9 rounded-xl object-cover" />
          <span className="text-lg font-bold text-white font-display">Apna Saathi</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.label} href={l.href} className="text-sm text-surface-400 hover:text-white transition-colors font-medium">{l.label}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
          <Button variant="primary" onClick={() => navigate('/signup/merchant')}>Join Now</Button>
        </div>

        <button className="md:hidden text-white p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-charcoal/95 backdrop-blur-xl border-t border-white/5 px-6 py-6 space-y-4">
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="block text-surface-300 hover:text-white text-base font-medium">{l.label}</a>
          ))}
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="flex-1" onClick={() => navigate('/login')}>Login</Button>
            <Button variant="primary" className="flex-1" onClick={() => navigate('/signup/merchant')}>Join Now</Button>
          </div>
        </motion.div>
      )}
    </header>
  );
}

/* ───────── SCROLL REVEAL WRAPPER ───────── */
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

/* ───────── 2. HERO ───────── */
function Hero() {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center px-6 pt-32 pb-32 overflow-hidden">
      {/* BG effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-saffron-500/[0.07] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-saffron-600/[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center mb-16 sm:mb-0">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-saffron-500/10 border border-saffron-500/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
            <span className="text-saffron-400 text-xs font-bold uppercase tracking-widest">Smart Delivery Engine — Live</span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="font-display font-black text-5xl md:text-6xl lg:text-7xl text-white leading-[1.1] mb-5 tracking-tight">
            Apna Saathi — Smart Delivery<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 to-saffron-600">System for Local Businesses.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-xl md:text-2xl text-surface-400 font-medium mb-3">Stop Moving. <span className="text-white">Start Optimizing.</span></p>
          <p className="text-surface-500 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Algorithm-driven route batching that clusters nearby deliveries, cutting fuel costs by 40% and delivery time by half. Built for India's local economy.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="primary" onClick={() => navigate('/signup/merchant')}>
              Start as Merchant <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="secondary" onClick={() => navigate('/signup/rider')}>
              Join as Rider <Navigation className="w-4 h-4" />
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.5}>
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[{ v: '40%', l: 'Cost Saved' }, { v: '2x', l: 'Faster Drops' }, { v: '1200+', l: 'Routes/Day' }].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-2xl md:text-3xl font-black text-saffron-400 font-display">{s.v}</p>
                <p className="text-xs text-surface-500 font-semibold uppercase tracking-wider mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] text-surface-600 uppercase tracking-[0.25em] font-bold">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5">
          <div className="w-1 h-1.5 rounded-full bg-saffron-500" />
        </motion.div>
      </div>
    </section>
  );
}

/* ───────── 3. SAATHI SNAP ───────── */
function SaathiSnap() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });
  const progress = useTransform(scrollYProgress, [0.2, 0.6], [0, 1]);

  const dots = [
    { x: 15, y: 25 }, { x: 75, y: 15 }, { x: 85, y: 75 }, { x: 25, y: 80 },
    { x: 55, y: 35 }, { x: 40, y: 60 },
  ];
  const cx = 50, cy = 50;

  return (
    <section id="snap" ref={containerRef} className="py-32 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Copy */}
          <div>
            <Reveal>
              <span className="text-saffron-500 text-xs font-bold uppercase tracking-widest mb-4 block">The Saathi Snap</span>
              <h2 className="font-display font-black text-4xl md:text-5xl text-white leading-tight mb-6">
                Don't just deliver.<br /><span className="text-saffron-400">Cluster.</span>
              </h2>
              <p className="text-surface-400 text-lg leading-relaxed mb-8">
                Our Haversine engine groups scattered orders by proximity in real-time. One rider, one optimized path — <span className="text-white font-semibold">40% less fuel, 50% faster drops</span>.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="space-y-4">
                {['Real-time proximity clustering', 'Multi-stop route optimization', 'Dynamic rider-order matching'].map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-saffron-500 flex-shrink-0" />
                    <span className="text-surface-300 text-sm font-medium">{t}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Visualization */}
          <Reveal delay={0.1}>
            <div className="relative aspect-square max-w-lg mx-auto bg-navy rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '32px 32px' }} />
              <div className="absolute top-5 left-5 px-3 py-1 bg-charcoal/80 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-saffron-500 animate-pulse" />
                <span className="text-[9px] text-white font-bold uppercase tracking-wider">Haversine V3</span>
              </div>

              <svg className="absolute inset-0 w-full h-full p-10" viewBox="0 0 100 100">
                {dots.map((d, i) => (
                  <g key={i}>
                    <motion.circle r="2" fill="#FF9F1C" style={{
                      cx: useTransform(progress, [0.3, 0.8], [d.x, cx]),
                      cy: useTransform(progress, [0.3, 0.8], [d.y, cy]),
                      opacity: useTransform(progress, [0, 0.1, 0.85, 1], [0, 1, 1, 0]),
                    }} />
                    <motion.circle r="6" stroke="#FF9F1C" strokeWidth="0.3" fill="none" style={{
                      cx: useTransform(progress, [0.3, 0.8], [d.x, cx]),
                      cy: useTransform(progress, [0.3, 0.8], [d.y, cy]),
                      opacity: useTransform(progress, [0.1, 0.3, 0.7], [0, 0.15, 0]),
                    }} />
                  </g>
                ))}
                <motion.circle cx={cx} cy={cy} r="4" fill="#FF9F1C" style={{
                  scale: useTransform(progress, [0.8, 1], [0, 1]),
                  opacity: useTransform(progress, [0.8, 1], [0, 1]),
                }} />
                <motion.circle cx={cx} cy={cy} r="12" stroke="#FF9F1C" strokeWidth="0.5" fill="none" style={{
                  scale: useTransform(progress, [0.85, 1], [0.5, 1.5]),
                  opacity: useTransform(progress, [0.85, 1], [0, 0.15]),
                }} />
              </svg>

              <motion.div className="absolute bottom-5 right-5 text-right" style={{ opacity: useTransform(progress, [0.85, 1], [0, 1]) }}>
                <p className="text-saffron-500 font-display font-black text-3xl">BATCHED</p>
                <p className="text-[9px] text-surface-500 font-bold uppercase tracking-[0.2em]">Efficiency +42%</p>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────── 4. SERVICE CARDS ───────── */
function ServiceCards() {
  const navigate = useNavigate();
  const cards = [
    {
      title: 'Merchant Portal',
      desc: 'Scale your operations with intelligent order management, real-time tracking, and business analytics.',
      features: ['Batch order creation', 'Live delivery tracking', 'Revenue analytics dashboard', 'Multi-platform integration'],
      cta: 'Start as Merchant',
      path: '/signup/merchant',
      icon: Package,
      accent: 'from-indigo-500/20 to-indigo-600/5',
      border: 'hover:border-indigo-500/20',
    },
    {
      title: 'Rider Application',
      desc: 'Maximize your earnings with optimized routes, transparent payouts, and smart task management.',
      features: ['Optimized multi-stop routes', 'Real-time earnings tracker', 'Easy batch acceptance', 'Performance dashboard'],
      cta: 'Join as Rider',
      path: '/signup/rider',
      icon: Navigation,
      accent: 'from-saffron-500/20 to-saffron-600/5',
      border: 'hover:border-saffron-500/20',
    },
  ];

  return (
    <section id="services" className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center mb-16">
            <span className="text-saffron-500 text-xs font-bold uppercase tracking-widest mb-4 block">Two Perspectives, One Platform</span>
            <h2 className="font-display font-black text-4xl md:text-5xl text-white">Built for <span className="text-saffron-400">Everyone</span> in the Chain.</h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.15}>
              <Card glow className={`h-full flex flex-col justify-between ${c.border}`}>
                <div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.accent} flex items-center justify-center mb-6`}>
                    <c.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-2xl text-white mb-3">{c.title}</h3>
                  <p className="text-surface-400 text-sm leading-relaxed mb-6">{c.desc}</p>
                  <div className="space-y-3 mb-8">
                    {c.features.map(f => (
                      <div key={f} className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-saffron-500 flex-shrink-0" />
                        <span className="text-surface-300 text-sm">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="primary" className="w-full" onClick={() => navigate(c.path)}>
                  {c.cta} <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── 5. PRODUCT PREVIEW ───────── */
function ProductPreview() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy/50 to-transparent pointer-events-none" />
      <div className="max-w-6xl mx-auto relative z-10">
        <Reveal>
          <div className="text-center mb-16">
            <span className="text-saffron-500 text-xs font-bold uppercase tracking-widest mb-4 block">Product Preview</span>
            <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-4">See the Platform in <span className="text-saffron-400">Action</span>.</h2>
            <p className="text-surface-400 text-base max-w-xl mx-auto">From order creation to optimized delivery — experience both sides of the Apna Saathi engine.</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: 'Merchant Experience', desc: 'Real-time order creation → Haversine batching → live tracking', icon: BarChart3 },
            { title: 'Rider Experience', desc: 'Batch acceptance → 5-stop optimized navigation → earnings', icon: MapPin },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 0.15}>
              <div className="relative bg-navy rounded-3xl border border-white/5 overflow-hidden group hover:border-white/10 transition-all">
                <div className="aspect-video bg-gradient-to-br from-charcoal to-navy flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-saffron-500/10 border border-saffron-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <item.icon className="w-7 h-7 text-saffron-400" />
                    </div>
                    <p className="text-surface-500 text-sm font-medium">Preview Coming Soon</p>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display font-bold text-lg text-white mb-1">{item.title}</h3>
                  <p className="text-surface-400 text-sm">{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── 6. TRUST & SECURITY ───────── */
function TrustSection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <span className="text-saffron-500 text-xs font-bold uppercase tracking-widest mb-4 block">Trust & Security</span>
              <h2 className="font-display font-black text-4xl md:text-5xl text-white leading-tight mb-6">
                Privacy-first<br /><span className="text-saffron-400">by design.</span>
              </h2>
              <p className="text-surface-400 text-lg leading-relaxed mb-10">
                Customers track deliveries live using unique Shadow IDs — no logins, no data exposure. Every delivery is isolated, encrypted, and anonymous.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="space-y-6">
                <FeatureItem icon={Shield} title="Shadow ID Privacy" description="Unique tracking links per order. No customer accounts required." />
                <FeatureItem icon={Clock} title="Real-Time, Zero Latency" description="Socket-powered live updates. Sub-second location broadcasts." />
                <FeatureItem icon={Layers} title="Intelligent Batching" description="Haversine-based clustering with automatic route optimization." />
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-saffron-500/10 to-transparent rounded-[40px] blur-3xl" />
              <Card className="relative">
                <div className="space-y-5">
                  {[
                    { label: 'Tracking ID', value: 'AS-K9X2M7', color: 'text-saffron-400' },
                    { label: 'Status', value: 'In Transit — 3 stops remaining', color: 'text-emerald-400' },
                    { label: 'Rider', value: '●●●●●● (Hidden)', color: 'text-surface-500' },
                    { label: 'ETA', value: '12 minutes', color: 'text-white' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                      <span className="text-surface-500 text-sm font-medium">{row.label}</span>
                      <span className={`text-sm font-semibold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <p className="text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Customer sees only their delivery — never another's.
                  </p>
                </div>
              </Card>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────── 7. FOOTER ───────── */
const XLogo = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

function Footer() {
  return (
    <footer className="border-t border-white/5 pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo.png" alt="Apna Saathi" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-display font-bold text-white">Apna Saathi</span>
            </div>
            <p className="text-surface-500 text-sm leading-relaxed">Smart delivery for India's local businesses. Bharosa Aapka, Service Hamara.</p>
          </div>
          {/* Product */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
            <div className="space-y-3">
              {['Home', 'Merchant Portal', 'Rider App', 'Pricing'].map(l => (
                <a key={l} href="#" className="block text-surface-500 hover:text-white text-sm transition-colors">{l}</a>
              ))}
            </div>
          </div>
          {/* Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Support</h4>
            <div className="space-y-3">
              {['Help Center', 'FAQ', 'Contact Us', 'Privacy Policy'].map(l => (
                <a key={l} href="#" className="block text-surface-500 hover:text-white text-sm transition-colors">{l}</a>
              ))}
            </div>
          </div>
          {/* Social */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Connect</h4>
            <div className="flex gap-3">
              {[
                { Icon: Linkedin, href: 'https://www.linkedin.com/in/harshrajrani' },
                { Icon: XLogo, href: 'https://x.com/Harshoutlier177' },
                { Icon: Github, href: 'https://github.com/HarshRajrani' }
              ].map((social, i) => (
                <a key={i} href={social.href} target={social.href !== '#' ? '_blank' : undefined} rel={social.href !== '#' ? 'noopener noreferrer' : undefined} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-surface-400 hover:text-saffron-400 hover:border-saffron-500/20 transition-all">
                  <social.Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-surface-600 text-xs">© 2026 Apna Saathi. All rights reserved.</p>
          <p className="text-surface-600 text-[10px] uppercase tracking-[0.3em] font-bold">Built with Logic & ❤️ in India</p>
        </div>
      </div>
    </footer>
  );
}

/* ───────── MAIN ───────── */
export default function LandingPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <main className="bg-charcoal min-h-screen selection:bg-saffron-500 selection:text-charcoal font-sans">
      <Header />
      <Hero />
      <SaathiSnap />
      <ServiceCards />
      <ProductPreview />
      <TrustSection />
      <Footer />
    </main>
  );
}
