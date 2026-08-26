import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Check,
  Clapperboard,
  Globe2,
  Heart,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  Tv,
  Users,
} from "lucide-react";
import "../styles/Welcome.css";

const APP_STORE_URL = "https://apps.apple.com/sa/app/scene-movie-tv/id6753978530";
const GOOGLE_PLAY_URL = "#download";

const copy = {
  en: {
    nav: {
      features: "Features",
      movies: "Movies",
      tv: "TV",
      ai: "Scene AI",
      download: "Download",
      login: "Log in",
      open: "Open Scene",
      join: "Join Scene",
      language: "العربية",
    },
    hero: {
      eyebrow: "YOUR WATCHING LIFE. ONE PLACE.",
      title1: "Movies, TV, friends,",
      title2: "all in one Scene.",
      body: "Log what you watch, review every memory, track every episode, discover what your friends love, and build a profile around your taste.",
      join: "Join Scene",
      apple: "Download on the App Store",
      proof1: "Movies + TV",
      proof2: "Social by design",
      proof3: "Personal AI",
    },
    strip: "Movies. TV. Friends. Reviews. Lists. Progress. AI.",
    stripStrong: "One Scene.",
    features: {
      eyebrow: "BUILT AROUND WHAT YOU WATCH",
      title: "More than a watchlist.",
      body: "Scene turns everything you watch into something you can remember, share and make your own.",
      cards: [
        ["Log everything you watch", "Movies, shows, episodes, ratings and rewatches — one watching history."],
        ["Make every review yours", "Write reviews, add GIFs or photos, choose custom backdrops and make every post feel personal."],
        ["Watch with your people", "Follow friends, see what they are watching, like reviews, reply and share discoveries."],
        ["Ask Scene", "Scene AI helps you explore movies, TV, people and your own taste in a more personal way."],
      ],
    },
    movies: {
      eyebrow: "MOVIES",
      title: "Every movie becomes part of your story.",
      body: "From the first watch to the fifth rewatch, Scene keeps the rating, review, memory and people that made it matter.",
      items: ["Log films and rewatches", "Ratings and reviews", "GIFs and photos", "Favorite films and characters"],
    },
    tv: {
      eyebrow: "TV",
      title: "Never lose your progress again.",
      body: "Track shows episode by episode, follow season progress, keep up with what comes next and make every episode part of your profile.",
      items: ["Episode-by-episode tracking", "Season progress", "Upcoming episodes", "Favorite shows and characters"],
    },
    personal: {
      eyebrow: "PERSONAL BY DEFAULT",
      title: "Your Scene should look like your Scene.",
      body: "Your taste is personal. Your profile should be too. Pick the visuals, favorites and memories that make your watching life feel like yours.",
      chips: ["Review backdrops", "Profile backdrops", "Movie posters", "Show posters", "List covers", "Episode backdrops"],
    },
    social: {
      eyebrow: "WATCH TOGETHER",
      title: "A social home for people who love movies and TV.",
      body: "Follow friends, react to reviews, reply, share discoveries and see what the people you care about are watching.",
      items: ["Friends activity", "Likes & replies", "Share discoveries", "Profiles built around taste"],
    },
    ai: {
      eyebrow: "SCENE AI",
      title: "Ask about what you love watching.",
      body: "Scene AI brings movies, TV and your own taste together — so recommendations and answers can feel personal instead of generic.",
    },
    saudi: {
      eyebrow: "BUILT IN SAUDI ARABIA",
      title: "Made here. Built for everyone who loves watching.",
      body: "Scene is building a global home for movie and TV lovers while giving Saudi cinema and talent a place to be discovered, followed and celebrated.",
    },
    leap: {
      eyebrow: "SEE SCENE IN PERSON",
      title: "Scene is exhibiting at LEAP 2026.",
      body: "If you are at LEAP in Riyadh, come see the product live and meet the founder.",
      pod: "H1A.P471",
      dates: "31 Aug – 3 Sep 2026",
      place: "Riyadh",
    },
    download: {
      eyebrow: "START YOUR SCENE",
      title: "Your watching life deserves a home.",
      body: "Join Scene on the web or download the iPhone app today.",
      appleTop: "Download on the",
      appleBottom: "App Store",
      googleTop: "COMING SOON",
      googleBottom: "Google Play",
      web: "Continue on the web",
    },
    footer: {
      tagline: "Your watching life, all in one place.",
      copyright: "© 2026 Scene",
    },
  },
  ar: {
    nav: {
      features: "المميزات",
      movies: "الأفلام",
      tv: "المسلسلات",
      ai: "ذكاء Scene",
      download: "حمّل التطبيق",
      login: "تسجيل الدخول",
      open: "افتح Scene",
      join: "انضم إلى Scene",
      language: "English",
    },
    hero: {
      eyebrow: "كل عالم مشاهدتك. في مكان واحد.",
      title1: "أفلام، مسلسلات، أصدقاء،",
      title2: "كلها في Scene.",
      body: "سجّل كل ما تشاهده، قيّم وراجع لحظاتك، تابع كل حلقة، اكتشف ما يحبه أصدقاؤك، وابنِ ملفًا يعكس ذوقك.",
      join: "انضم إلى Scene",
      apple: "حمّل التطبيق من App Store",
      proof1: "أفلام + مسلسلات",
      proof2: "تجربة اجتماعية",
      proof3: "ذكاء شخصي",
    },
    strip: "أفلام. مسلسلات. أصدقاء. مراجعات. قوائم. تقدّم. ذكاء.",
    stripStrong: "Scene واحد.",
    features: {
      eyebrow: "مصمم حول كل ما تشاهده",
      title: "أكثر من مجرد قائمة مشاهدة.",
      body: "Scene يحوّل كل ما تشاهده إلى شيء تستطيع تذكره ومشاركته وجعله يعكسك.",
      cards: [
        ["سجّل كل ما تشاهده", "أفلام ومسلسلات وحلقات وتقييمات وإعادات مشاهدة — تاريخ مشاهدة واحد."],
        ["اجعل كل مراجعة تعبّر عنك", "اكتب مراجعات وأضف GIF أو صورًا واختر خلفيات مخصصة لكل تجربة."],
        ["شاهد مع أصدقائك", "تابع أصدقاءك واعرف ماذا يشاهدون وأعجب بمراجعاتهم ورد وشارك اكتشافاتك."],
        ["اسأل Scene", "ذكاء Scene يساعدك على استكشاف الأفلام والمسلسلات والأشخاص وذوقك بطريقة شخصية."],
      ],
    },
    movies: {
      eyebrow: "الأفلام",
      title: "كل فيلم يصبح جزءًا من قصتك.",
      body: "من أول مشاهدة إلى خامس إعادة، يحتفظ Scene بتقييمك ومراجعتك وذكرياتك وكل ما جعل الفيلم مهمًا لك.",
      items: ["تسجيل الأفلام وإعادات المشاهدة", "التقييمات والمراجعات", "GIF والصور", "الأفلام والشخصيات المفضلة"],
    },
    tv: {
      eyebrow: "المسلسلات",
      title: "لن تفقد تقدّمك مرة أخرى.",
      body: "تابع مسلسلاتك حلقة بحلقة، راقب تقدّم المواسم، اعرف ما القادم، واجعل كل حلقة جزءًا من ملفك.",
      items: ["متابعة حلقة بحلقة", "تقدّم المواسم", "الحلقات القادمة", "المسلسلات والشخصيات المفضلة"],
    },
    personal: {
      eyebrow: "شخصي من الأساس",
      title: "Scene الخاص بك يجب أن يشبهك.",
      body: "ذوقك شخصي، وملفك يجب أن يكون كذلك. اختر الصور والمفضلات والذكريات التي تجعل عالم مشاهدتك يعكسك فعلًا.",
      chips: ["خلفيات المراجعات", "خلفيات الملف", "بوسترات الأفلام", "بوسترات المسلسلات", "أغلفة القوائم", "خلفيات الحلقات"],
    },
    social: {
      eyebrow: "شاهدوا معًا",
      title: "بيت اجتماعي لكل من يحب الأفلام والمسلسلات.",
      body: "تابع أصدقاءك وتفاعل مع المراجعات ورد وشارك اكتشافاتك واعرف ما يشاهده الأشخاص الذين تهتم بهم.",
      items: ["نشاط الأصدقاء", "إعجابات وردود", "مشاركة الاكتشافات", "ملفات مبنية حول الذوق"],
    },
    ai: {
      eyebrow: "ذكاء SCENE",
      title: "اسأل عن كل ما تحب مشاهدته.",
      body: "يجمع ذكاء Scene بين الأفلام والمسلسلات وذوقك الشخصي حتى تصبح الإجابات والترشيحات أقرب إليك وليست عامة.",
    },
    saudi: {
      eyebrow: "صُنع في السعودية",
      title: "بُني هنا، لكل من يحب المشاهدة.",
      body: "يبني Scene بيتًا عالميًا لعشاق الأفلام والمسلسلات، مع مساحة تبرز السينما والمواهب السعودية وتساعد الناس على اكتشافها ومتابعتها والاحتفاء بها.",
    },
    leap: {
      eyebrow: "شاهد SCENE على أرض الواقع",
      title: "Scene يشارك في LEAP 2026.",
      body: "إذا كنت في LEAP بالرياض، مر علينا وشاهد المنتج مباشرة وتعرّف على المؤسس.",
      pod: "H1A.P471",
      dates: "31 أغسطس – 3 سبتمبر 2026",
      place: "الرياض",
    },
    download: {
      eyebrow: "ابدأ عالمك في SCENE",
      title: "عالم مشاهدتك يستحق بيتًا.",
      body: "انضم إلى Scene على الويب أو حمّل تطبيق الآيفون الآن.",
      appleTop: "حمّله من",
      appleBottom: "App Store",
      googleTop: "قريبًا",
      googleBottom: "Google Play",
      web: "استخدم Scene على الويب",
    },
    footer: {
      tagline: "كل عالم مشاهدتك، في مكان واحد.",
      copyright: "© 2026 Scene",
    },
  },
};

const featureIcons = [Clapperboard, MessageCircle, Users, Bot];

function CheckRow({ children }) {
  return (
    <div className="scene-site-check-row">
      <span className="scene-site-check-icon"><Check size={14} strokeWidth={3} /></span>
      <span>{children}</span>
    </div>
  );
}

function Mockup({ src, alt, className = "" }) {
  return <img className={`scene-site-mockup ${className}`} src={src} alt={alt} loading="lazy" />;
}

export default function Welcome() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => localStorage.getItem("sceneLandingLanguage") || "en");
  const t = copy[language];
  const isArabic = language === "ar";

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const openScene = () => navigate(user?.token ? "/home" : "/login");
  const goSignup = () => navigate("/signup");

  const switchLanguage = () => {
    const next = language === "en" ? "ar" : "en";
    setLanguage(next);
    localStorage.setItem("sceneLandingLanguage", next);
  };

  const scrollTo = (id) => (event) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className={`scene-site-page ${isArabic ? "scene-site-ar" : ""}`} dir={isArabic ? "rtl" : "ltr"}>
      <div className="scene-site-grid" />
      <div className="scene-site-orb scene-site-orb-one" />
      <div className="scene-site-orb scene-site-orb-two" />

      <nav className="scene-site-nav">
        <button className="scene-site-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scene home">
          <img
            src="/landing/scene-logo.png"
            alt="Scene"
            className="scene-site-brand-logo"
          />
        </button>

        <div className="scene-site-nav-links">
          <a href="#features" onClick={scrollTo("features")}>{t.nav.features}</a>
          <a href="#movies" onClick={scrollTo("movies")}>{t.nav.movies}</a>
          <a href="#tv" onClick={scrollTo("tv")}>{t.nav.tv}</a>
          <a href="#ai" onClick={scrollTo("ai")}>{t.nav.ai}</a>
          <a href="#download" onClick={scrollTo("download")}>{t.nav.download}</a>
        </div>

        <div className="scene-site-nav-actions">
          <button className="scene-site-language" onClick={switchLanguage} aria-label="Change language">
            <Globe2 size={15} /> {t.nav.language}
          </button>
          <button className="scene-site-login-link" onClick={openScene}>{user?.token ? t.nav.open : t.nav.login}</button>
          {!user?.token && <button className="scene-site-nav-cta" onClick={goSignup}>{t.nav.join}<ArrowRight size={16} /></button>}
        </div>
      </nav>

      <section className="scene-site-hero">
        <div className="scene-site-hero-copy">
          <span className="scene-site-eyebrow">{t.hero.eyebrow}</span>
          <h1>{t.hero.title1}<span>{t.hero.title2}</span></h1>
          <p className="scene-site-hero-description">{t.hero.body}</p>
          <div className="scene-site-hero-actions">
            <button className="scene-site-primary-cta" onClick={goSignup}>{t.hero.join}<ArrowRight size={18} /></button>
            <a className="scene-site-secondary-cta" href={APP_STORE_URL} target="_blank" rel="noreferrer"> {t.hero.apple}</a>
          </div>
          <div className="scene-site-hero-proof">
            <div><Star size={15} fill="currentColor" />{t.hero.proof1}</div>
            <div><Users size={15} />{t.hero.proof2}</div>
            <div><Sparkles size={15} />{t.hero.proof3}</div>
          </div>
        </div>

        <div className="scene-site-product-stage" aria-label="Scene app previews">
          <div className="scene-site-stage-glow" />
          <Mockup src="/landing/movie-details.png?v=3" alt="Scene movie details screen" className="scene-site-mockup-left" />
          <Mockup src="/landing/tv-progress.png?v=3" alt="Scene TV progress screen" className="scene-site-mockup-center" />
          <Mockup src="/landing/movie-log.png?v=3" alt="Scene movie logging screen" className="scene-site-mockup-right" />
        </div>
      </section>

      <section className="scene-site-strip"><p>{t.strip} <strong>{t.stripStrong}</strong></p></section>

      <section className="scene-site-section" id="features">
        <div className="scene-site-section-heading">
          <span className="scene-site-eyebrow">{t.features.eyebrow}</span>
          <h2>{t.features.title}</h2>
          <p>{t.features.body}</p>
        </div>
        <div className="scene-site-feature-grid">
          {t.features.cards.map(([title, text], index) => {
            const Icon = featureIcons[index];
            return <article className="scene-site-feature-card" key={title}><div className="scene-site-feature-icon"><Icon size={22} /></div><h3>{title}</h3><p>{text}</p></article>;
          })}
        </div>
      </section>

      <section className="scene-site-showcase scene-site-showcase-movies" id="movies">
        <div className="scene-site-showcase-copy">
          <span className="scene-site-eyebrow">{t.movies.eyebrow}</span>
          <h2>{t.movies.title}</h2>
          <p>{t.movies.body}</p>
          <div className="scene-site-check-list">{t.movies.items.map((item) => <CheckRow key={item}>{item}</CheckRow>)}</div>
        </div>
        <div className="scene-site-showcase-visual"><Mockup src="/landing/movie-details.png?v=3" alt="Scene movie detail preview" /></div>
      </section>

      <section className="scene-site-showcase scene-site-showcase-tv" id="tv">
        <div className="scene-site-showcase-visual"><Mockup src="/landing/tv-progress.png?v=3" alt="Scene TV tracking preview" /></div>
        <div className="scene-site-showcase-copy">
          <span className="scene-site-eyebrow">{t.tv.eyebrow}</span>
          <h2>{t.tv.title}</h2>
          <p>{t.tv.body}</p>
          <div className="scene-site-check-list">{t.tv.items.map((item) => <CheckRow key={item}>{item}</CheckRow>)}</div>
        </div>
      </section>

      <section className="scene-site-section scene-site-personal-section">
        <div className="scene-site-personal-copy">
          <span className="scene-site-eyebrow">{t.personal.eyebrow}</span>
          <h2>{t.personal.title}</h2>
          <p>{t.personal.body}</p>
          <div className="scene-site-chip-grid">{t.personal.chips.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
        <div className="scene-site-personal-visual"><Mockup src="/landing/movie-log.png?v=3" alt="Personalized Scene logging screen" /></div>
      </section>

      <section className="scene-site-social-band">
        <div>
          <span className="scene-site-eyebrow">{t.social.eyebrow}</span>
          <h2>{t.social.title}</h2>
          <p>{t.social.body}</p>
        </div>
        <div className="scene-site-social-icons">
          {t.social.items.map((item, i) => {
            const Icon = [Users, Heart, MessageCircle, Star][i];
            return <div key={item}><Icon size={23} /><span>{item}</span></div>;
          })}
        </div>
      </section>

      <section className="scene-site-section scene-site-ai-section" id="ai">
        <div className="scene-site-ai-visual">
          <Mockup
            src="/landing/scene-bot.png?v=3"
            alt="SceneBot AI preview"
          />
        </div>

        <div>
          <span className="scene-site-eyebrow">{t.ai.eyebrow}</span>
          <h2>{t.ai.title}</h2>
          <p>{t.ai.body}</p>
        </div>
      </section>

      <section className="scene-site-section scene-site-saudi-section">
        <div className="scene-site-saudi-badge">🇸🇦</div>
        <div>
          <span className="scene-site-eyebrow">{t.saudi.eyebrow}</span>
          <h2>{t.saudi.title}</h2>
          <p>{t.saudi.body}</p>
        </div>
        <Globe2 className="scene-site-globe" size={78} />
      </section>

      <section className="scene-site-section scene-site-event-section" id="leap">
        <div className="scene-site-event-card">
          <div>
            <span className="scene-site-eyebrow">{t.leap.eyebrow}</span>
            <h2>{t.leap.title}</h2>
            <p>{t.leap.body}</p>
            <div className="scene-site-event-meta"><div><span>LEAP 2026</span><strong>{t.leap.dates}</strong></div><div><span>{isArabic ? "المكان" : "LOCATION"}</span><strong>{t.leap.place}</strong></div></div>
          </div>
          <div className="scene-site-pod-badge"><small>{isArabic ? "زورنا في الجناح" : "FIND SCENE AT"}</small><strong>{t.leap.pod}</strong><span>LEAP 2026</span></div>
        </div>
      </section>

      <section className="scene-site-download-section" id="download">
        <span className="scene-site-eyebrow">{t.download.eyebrow}</span>
        <h2>{t.download.title}</h2>
        <p>{t.download.body}</p>
        <div className="scene-site-download-actions">
          <a className="scene-site-store-button" href={APP_STORE_URL} target="_blank" rel="noreferrer"><span className="scene-site-store-icon"></span><span><small>{t.download.appleTop}</small><strong>{t.download.appleBottom}</strong></span></a>
          <a className="scene-site-store-button scene-site-store-disabled" href={GOOGLE_PLAY_URL} onClick={(e) => e.preventDefault()}><span className="scene-site-play-triangle">▶</span><span><small>{t.download.googleTop}</small><strong>{t.download.googleBottom}</strong></span></a>
        </div>
        <button className="scene-site-web-cta" onClick={openScene}>{t.download.web}<ArrowRight size={15} /></button>
      </section>

      <footer className="scene-site-footer">
        <div className="scene-site-footer-brand">
          <img
            src="/landing/scene-logo.png"
            alt="Scene"
            className="scene-site-footer-logo"
          />
          <span>{t.footer.tagline}</span>
        </div>
        <div className="scene-site-footer-links">
          <a href="#features" onClick={scrollTo("features")}>{t.nav.features}</a>
          <a href="#movies" onClick={scrollTo("movies")}>{t.nav.movies}</a>
          <a href="#tv" onClick={scrollTo("tv")}>{t.nav.tv}</a>
          <a href="#download" onClick={scrollTo("download")}>{t.nav.download}</a>
          <a href="mailto:support@scenesa.com">support@scenesa.com</a>
        </div>
        <span className="scene-site-footer-copy">{t.footer.copyright}</span>
      </footer>
    </main>
  );
}
