import { useState, useRef } from "react";
import {
  ArrowLeft,
  Send,
  TrendingUp,
  Headphones,
  Info,
  CheckCircle2,
  Zap,
  Globe,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import CurrencyPicker from "@/components/currency-picker";
import { useLocation } from "wouter";

// Mock exchange rates
const rates: Record<string, Record<string, number>> = {
  GBP: { NGN: 1845.73, USD: 1.27, EUR: 1.17, GHS: 15.92, KES: 165.3, ZAR: 23.45 },
  USD: { NGN: 1455.0, GBP: 0.79, EUR: 0.92, GHS: 12.55, KES: 130.2, ZAR: 18.5 },
  EUR: { NGN: 1580.0, GBP: 0.86, USD: 1.09, GHS: 13.6, KES: 141.5, ZAR: 20.1 },
};


export default function SendMoneyPage() {
  const [, navigate] = useLocation();
  const [sendCurrency, setSendCurrency] = useState("GBP");
  const [receiveCurrency, setReceiveCurrency] = useState("NGN");
  const [amount, setAmount] = useState("500");

  const rate = rates[sendCurrency]?.[receiveCurrency] || 1;
  const numAmount = parseFloat(amount) || 0;
  const receiveAmount = (numAmount * rate).toFixed(2);
  const fee = 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header — Samis Online branded */}
      <header className="bg-white border-b border-gray-200">
        <div className="w-full px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <img
              src="/assets/logo.svg"
              alt="Samis Online"
              className="h-10 w-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "/assets/Low-quality_logo.png";
              }}
            />
            <span className="text-primary font-bold text-2xl hidden sm:inline">Samis Online Money</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Store
            </button>
            <button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-full px-5 py-2 transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center text-black mb-4 tracking-tight">
              SEND MONEY NOW
            </h1>
            <p className="text-center text-gray-500 text-sm sm:text-base max-w-lg mx-auto mb-10">
              Supporting families or paying international suppliers, skip bank lines and send money the modern way: fast, secure and reliable.
            </p>

            {/* Transfer Widget + Phone Mockup */}
            <div className="grid md:grid-cols-2 gap-10 items-stretch max-w-5xl mx-auto">
              {/* Phone Mockup — premium, larger, animated */}
              <div className="hidden md:flex justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="relative"
                >
                  {/* Glow behind phone */}
                  <div className="absolute -inset-6 bg-gradient-to-br from-primary/20 via-teal/10 to-accent/10 rounded-[3rem] blur-2xl opacity-60" />

                  {/* Phone frame */}
                  <div className="relative w-[320px] lg:w-[340px]">
                    {/* Outer frame */}
                    <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-[6px] shadow-[0_30px_80px_-20px_rgba(73,37,106,0.35)]">
                      {/* Inner bezel */}
                      <div className="bg-white rounded-[2.2rem] overflow-hidden relative">
                        {/* Dynamic Island */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20 flex items-center justify-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-800 ring-1 ring-gray-700" />
                        </div>

                        {/* Status bar */}
                        <div className="bg-white px-6 pt-2 pb-0 flex items-center justify-between text-[10px] font-semibold text-gray-800 relative z-10">
                          <span>10:22</span>
                          <div className="flex items-center gap-1">
                            <div className="flex gap-[2px]">
                              {[1, 2, 3, 4].map((b) => (
                                <div key={b} className="w-[3px] rounded-full bg-gray-800" style={{ height: `${6 + b * 2}px` }} />
                              ))}
                            </div>
                            <span className="text-[9px] ml-1">5G</span>
                          </div>
                        </div>

                        {/* Screen content */}
                        <div className="bg-gradient-to-b from-white via-gray-50/50 to-primary/5 px-6 pb-8 pt-6 min-h-[480px] lg:min-h-[520px] flex flex-col items-center justify-center">
                          {/* Animated send icon */}
                          <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            className="mb-6"
                          >
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal/20 to-teal/5 flex items-center justify-center shadow-lg shadow-teal/10">
                              <Send className="w-9 h-9 text-teal" />
                            </div>
                          </motion.div>

                          <p className="text-sm text-gray-400 font-medium mb-0.5">Money Transfer</p>
                          <p className="text-[11px] text-gray-300 mb-6">To</p>

                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            className="text-center"
                          >
                            <p className="text-xl font-bold text-black mb-1">Bright Okpocha</p>
                            <motion.p
                              key={numAmount}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4 }}
                              className="text-4xl font-extrabold text-primary"
                            >
                              ${(numAmount * 1.27).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </motion.p>
                          </motion.div>

                          {/* Success indicator */}
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1, type: "spring", stiffness: 200 }}
                            className="mt-6 flex items-center gap-2 bg-teal/10 text-teal px-4 py-2 rounded-full"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-semibold">Transfer Ready</span>
                          </motion.div>
                        </div>

                        {/* Home indicator */}
                        <div className="h-8 bg-white flex items-center justify-center">
                          <div className="w-32 h-1 bg-gray-300 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Transfer Calculator — matches phone height */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-7 sm:p-8 flex flex-col justify-between">
                <div>
                  {/* You Send */}
                  <div className="mb-6 relative z-20">
                    <label className="text-sm text-gray-500 mb-2 block font-medium">You Send</label>
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <CurrencyPicker
                        value={sendCurrency}
                        onChange={setSendCurrency}
                        exclude={receiveCurrency}
                      />
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1 px-4 py-3.5 text-right text-lg font-semibold text-black focus:outline-none rounded-r-lg"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Recipient Gets */}
                  <div className="mb-6 relative z-10">
                    <label className="text-sm text-gray-500 mb-2 block font-medium">Recipient Gets</label>
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <CurrencyPicker
                        value={receiveCurrency}
                        onChange={setReceiveCurrency}
                        exclude={sendCurrency}
                      />
                      <input
                        type="text"
                        value={receiveAmount}
                        readOnly
                        className="flex-1 px-4 py-3.5 text-right text-lg font-semibold text-black bg-white focus:outline-none rounded-r-lg"
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3.5 py-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <Send className="w-4 h-4 text-primary" />
                        Amount Sent*
                      </span>
                      <span className="font-medium text-black">
                        {numAmount.toFixed(2)} {sendCurrency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Fee
                      </span>
                      <span className="font-medium text-black">
                        {fee} {sendCurrency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-gray-500">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Exchange Rate
                      </span>
                      <span className="font-medium text-black">
                        1 {sendCurrency} = {rate.toFixed(2)} {receiveCurrency}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between py-4 border-t border-gray-200">
                    <span className="font-bold text-black text-lg">Total To Pay</span>
                    <span className="font-bold text-2xl text-black">
                      {numAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  {/* Send Button → takes user to auth */}
                  <button
                    onClick={() => navigate("/auth")}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl py-4 transition-colors text-lg"
                  >
                    Send Money
                  </button>

                  <p className="text-[11px] text-gray-400 mt-3 text-center">
                    * The amount sent is calculated as the amount you entered minus our fee.
                  </p>

                  {/* Powered by */}
                  <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400">
                    <Info className="w-3 h-3" />
                    <span>Powered by <span className="text-primary font-medium">Mito.Money</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase Carousel — transfer use cases */}
        <ShowcaseCarousel />

        {/* Why Choose Section — animated */}
        <WhyChooseSection />
      </main>

      {/* Footer — Samis branded */}
      <footer className="bg-[#49256b] text-white">
        <div className="max-w-6xl mx-auto px-5 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <img
              src="/assets/logo.svg"
              alt="Samis Online"
              className="h-10 w-auto brightness-200"
            />
            <div className="flex items-center gap-6 text-sm text-white/70">
              <button className="hover:text-white transition-colors">About Us</button>
              <button className="hover:text-white transition-colors">FAQ</button>
              <button className="hover:text-white transition-colors">Support</button>
            </div>
          </div>
          <div className="border-t border-white/20 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-white/50">
              &copy; {new Date().getFullYear()} Mito.Money. All Rights Reserved Funtech Global Communications Ltd
            </p>
            <div className="flex items-center gap-4 text-[11px] text-white/50">
              <button className="hover:text-white transition-colors">Terms</button>
              <button className="hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-white transition-colors">Contact Us</button>
            </div>
          </div>
          <p className="text-[10px] text-white/30 mt-3 leading-relaxed">
            Mito.money is a trademark owned by Funtech Global Communications Ltd. Devonshire House, Manor way, Borehamwood, Herts. WD6 1QQ, United Kingdom. A registered Payment institution in the UK with registration details FRN: 815146 MLR NO: 12803115
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Showcase Carousel (Swiper) ─── */

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

const showcaseSlides = [
  { label: "Fast", category: "Family", amount: "£ 2,500.00", image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=750&fit=crop" },
  { label: "Easy", category: "Tuition fee", amount: "$ 6,830.00", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=750&fit=crop" },
  { label: "Smooth", category: "Celebration", amount: "£ 12,000.00", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop" },
  { label: "Secure", category: "Business", amount: "$ 4,200.00", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=750&fit=crop" },
  { label: "Reliable", category: "Rent", amount: "£ 1,800.00", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=750&fit=crop" },
  { label: "Quick", category: "Medical", amount: "$ 3,450.00", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=750&fit=crop" },
  { label: "Trusted", category: "Education", amount: "£ 8,200.00", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=750&fit=crop" },
  { label: "Safe", category: "Groceries", amount: "$ 950.00", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=750&fit=crop" },
];

function ShowcaseCarousel() {
  return (
    <section className="py-14 sm:py-20 bg-white">
      <div className="max-w-[1536px] w-full mx-auto overflow-hidden px-4 sm:px-6 xl:px-12">
        <Swiper
          modules={[EffectCoverflow, Autoplay, Pagination]}
          effect="coverflow"
          grabCursor
          centeredSlides
          loop
          breakpoints={{
            320: { slidesPerView: 3, coverflowEffect: { stretch: 10, depth: 100 } },
            640: { slidesPerView: 3, coverflowEffect: { stretch: 30, depth: 150 } },
            1024: { slidesPerView: 5, coverflowEffect: { stretch: 40, depth: 200 } }
          }}
          coverflowEffect={{
            rotate: 0,
            stretch: 40,
            depth: 200,
            modifier: 1,
            slideShadows: false,
          }}
          speed={800}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
            bulletActiveClass: "swiper-bullet-active",
            bulletClass: "swiper-bullet",
          }}
          className="showcase-swiper"
          loopAdditionalSlides={5}
        >
          {[...showcaseSlides, ...showcaseSlides].map((slide, i) => (
            <SwiperSlide key={i}>
              <div className="relative rounded-3xl overflow-hidden bg-white shadow-lg border border-gray-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                {/* Label badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-green-50 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full shadow-sm">
                    {slide.label}
                  </span>
                </div>

                {/* Image */}
                <div className="aspect-[1/2] overflow-hidden">
                  <img
                    src={slide.image}
                    alt={slide.category}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Amount overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 sm:p-5 rounded-b-3xl border-t border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-1">{slide.category}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl sm:text-2xl font-black text-black">{slide.amount}</p>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}

/* ─── Why Choose Section (animated) ─── */

const whyChooseFeatures = [
  {
    icon: Zap,
    title: "Fast, Secure And Reliable",
    desc: "Skip the wait, skip the worry. Send money anywhere instantly with enterprise-grade security and fraud protection on every transfer.",
    gradient: "from-purple-500/10 to-primary/10",
    iconBg: "bg-primary",
  },
  {
    icon: Globe,
    title: "Competitive Exchange Rates",
    desc: "Save more on every transfer with our superior exchange rates that beat traditional banks and transparent fees with no hidden charges.",
    gradient: "from-teal/10 to-green-500/10",
    iconBg: "bg-teal",
  },
  {
    icon: Headphones,
    title: "24/7 Customer Support",
    desc: "Get instant help anytime, anywhere. Our 24/7 support team resolves your questions in real-time, so you're never stuck waiting.",
    gradient: "from-accent/10 to-yellow-500/10",
    iconBg: "bg-primary",
  },
];

const stats = [
  { value: "150K+", label: "Happy Customers" },
  { value: "50+", label: "Countries Supported" },
  { value: "99.9%", label: "Uptime Guarantee" },
  { value: "< 30s", label: "Average Transfer Time" },
];

function WhyChooseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-16 sm:py-20 bg-gray-50 overflow-hidden">
      <div className="max-w-5xl mx-auto px-5">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            Why Us
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black mb-4 tracking-tight">
            WHY CHOOSE{" "}
            <span className="text-primary">SAMIS ONLINE MONEY</span>
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Your financial peace of mind drives everything we do. We've eliminated the guesswork,
            hidden fees, and anxiety that come with moving money by creating a transparent platform
            where you're always in control.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-14">
          {whyChooseFeatures.map(({ icon: Icon, title, desc, gradient, iconBg }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15, ease: "easeOut" }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 sm:p-7 border border-white/60 shadow-sm hover:shadow-lg transition-shadow cursor-default`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.15, type: "spring", stiffness: 200 }}
                className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-5 shadow-md`}
              >
                <Icon className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="font-bold text-black text-lg mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-primary rounded-2xl p-6 sm:p-8"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map(({ value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                className="text-center"
              >
                <p className="text-2xl sm:text-3xl font-extrabold text-white mb-1">{value}</p>
                <p className="text-xs sm:text-sm text-white/60">{label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
