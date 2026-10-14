/* ============================================================
   王虎 · 个人博客 — 交互逻辑
   零依赖 · 原生 JS
   ============================================================ */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- 主题切换 ---------- */
  const themeToggle = $("#themeToggle");
  const THEME_KEY = "wh-theme";
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* file:// 下可能不可用 */ }
  }
  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
  })();
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
  });

  /* ---------- 年份 ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- 导航：滚动状态 / 移动菜单 / 滚动侦测 ---------- */
  const nav = $("#nav");
  const navLinks = $("#navLinks");
  const burger = $("#navBurger");
  const backTop = $("#backTop");
  const progressBar = $("#progressBar");
  const sections = $$("main section[id]");

  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
    backTop.classList.toggle("is-visible", window.scrollY > 600);

    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";

    // 滚动侦测高亮当前区块
    const probe = window.scrollY + 120;
    let currentId = "";
    sections.forEach((sec) => {
      if (sec.offsetTop <= probe) currentId = sec.id;
    });
    $$(".nav-link").forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + currentId);
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  $$(".nav-link", navLinks).forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    })
  );
  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- 滚动显现 ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- Hero 数字滚动 ---------- */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) { el.textContent = "2019"; return; }
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          $$(".stat-num", entry.target).forEach(animateCounter);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  const heroStats = $(".hero-stats");
  if (heroStats) counterObserver.observe(heroStats);

  /* ---------- 时间线渲染 ---------- */
  const timelineEl = $("#timeline");
  timelineEl.innerHTML = TIMELINE.map((item) => `
    <div class="tl-item ${item.current ? "is-current" : ""}">
      <span class="tl-dot"></span>
      <div class="tl-card">
        <div class="tl-head">
          <div>
            <h3 class="tl-company">${item.company}${item.dept ? " · " + item.dept : ""}</h3>
            <p class="tl-role">${item.role}</p>
          </div>
          <span class="tl-period">${item.period}</span>
        </div>
        <ul class="tl-desc">
          ${item.desc.map((d) => `<li>${d}</li>`).join("")}
        </ul>
        ${item.projects ? `<div class="tl-projects">${item.projects.map((p) => `<span class="tl-proj-tag">${p}</span>`).join("")}</div>` : ""}
      </div>
    </div>
  `).join("");

  /* ---------- 项目渲染 + 筛选 ---------- */
  const projectsGrid = $("#projectsGrid");
  const filterBar = $("#projectFilter");

  function renderProjects(filter) {
    const list = PROJECTS.filter((p) => filter === "all" || p.category === filter);
    projectsGrid.innerHTML = list.map((p) => `
      <article class="project-card reveal is-visible">
        <div class="project-top">
          <span class="project-icon">${p.icon}</span>
          <span class="project-period">${p.period}</span>
        </div>
        <h3 class="project-title">${p.title}</h3>
        <p class="project-role">${p.role}</p>
        <p class="project-desc">${p.desc}</p>
        <ul class="project-hl">
          ${p.highlights.map((h) => `<li>${h}</li>`).join("")}
        </ul>
        <div class="project-stack">
          ${p.stack.map((t) => `<span class="tag">${t}</span>`).join("")}
        </div>
      </article>
    `).join("");
  }
  renderProjects("all");

  filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    $$(".filter-btn", filterBar).forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    renderProjects(btn.dataset.filter);
  });

  /* ---------- 博客渲染 + 阅读弹窗 ---------- */
  const blogList = $("#blogList");
  const modal = $("#articleModal");
  const modalContent = $("#modalContent");

  function fmtDate(iso) {
    const d = new Date(iso);
    return { day: d.getDate(), month: d.getMonth() + 1 };
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  blogList.innerHTML = ARTICLES.map((a) => {
    const { day, month } = fmtDate(a.date);
    return `
      <button class="blog-item reveal is-visible" data-id="${a.id}" aria-label="阅读文章：${a.title}">
        <span class="blog-date">
          <span class="d">${pad(day)}</span>
          <span class="m">${pad(month)}月</span>
        </span>
        <span class="blog-main">
          <span class="blog-title">${a.title}</span>
          <span class="blog-excerpt">${a.excerpt}</span>
          <span class="blog-meta">
            <span class="cat">${a.cat}</span>
            <span class="sep">·</span>
            <span>${a.minutes} 分钟阅读</span>
            <span class="sep">·</span>
            <span class="tags-inline">${a.tags.map((t) => `<span class="tag-mini">#${t}</span>`).join("")}</span>
          </span>
        </span>
        <span class="blog-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </button>
    `;
  }).join("");

  function renderArticle(article) {
    const { day, month } = fmtDate(article.date);
    modalContent.innerHTML = `
      <header class="article-hero">
        <div class="article-meta">
          <span class="cat">${article.cat}</span>
          <span>${article.date.replace(/-/g, " / ")}</span>
          <span>·</span>
          <span>${article.minutes} 分钟阅读</span>
        </div>
        <h2 class="article-title">${article.title}</h2>
      </header>
      <div class="article-body">
        ${article.content.map((p) => `<p>${p}</p>`).join("")}
        ${article.quote ? `<blockquote>${article.quote}</blockquote>` : ""}
      </div>
      <footer class="article-end">
        <span class="article-end-tip">觉得有帮助？在 CSDN 继续交流 👉</span>
        <a class="btn btn-primary" href="${SITE.csdn}" target="_blank" rel="noopener" style="padding:10px 22px;font-size:14px">查看 CSDN 博客</a>
      </footer>
    `;
  }

  function openModal(article) {
    renderArticle(article);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  blogList.addEventListener("click", (e) => {
    const item = e.target.closest(".blog-item");
    if (!item) return;
    const article = ARTICLES.find((a) => a.id === item.dataset.id);
    if (article) openModal(article);
  });
  $$("[data-close-modal]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
  modalContent.addEventListener("click", (e) => e.stopPropagation());

  /* ---------- 复制邮箱 ---------- */
  const toast = $("#toast");
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2000);
  }
  document.addEventListener("click", (e) => {
    const copyEl = e.target.closest("[data-copy]");
    if (!copyEl) return;
    e.preventDefault();
    e.stopPropagation();
    const text = copyEl.dataset.copy;
    const done = () => showToast("邮箱已复制 ✓");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  });
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (err) { showToast("复制失败，请手动复制"); }
    document.body.removeChild(ta);
  }
})();
