import './style.css';
import { marked } from 'marked';

const postsList = document.getElementById('posts-list');
const homeView = document.getElementById('home-view');
const postView = document.getElementById('post-view');
const communityView = document.getElementById('community-view');
const postContentTarget = document.getElementById('post-content-target');
const backBtn = document.getElementById('back-btn');
const commBackBtn = document.getElementById('comm-back-btn');
const themeToggle = document.getElementById('theme-toggle');
const homeLink = document.getElementById('home-link');
const viewAllContainer = document.getElementById('view-all-container');
const viewAllBtn = document.getElementById('view-all-btn');

const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

const markdownFiles = import.meta.glob('./posts/**/*.md', { query: '?raw', import: 'default', eager: true });

function parseMarkdown(text) {
  // Added [\s\uFEFF]* to handle hidden Byte Order Mark (BOM) from Windows/PowerShell
  const frontmatterRegex = /^[\s\uFEFF]*---([\s\S]*?)---/;
  const match = text.match(frontmatterRegex);
  const metadata = {};
  let content = text;

  if (match) {
    const rawMetadata = match[1];
    content = text.replace(frontmatterRegex, '').trim();
    rawMetadata.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        metadata[key.trim()] = valueParts.join(':').trim();
      }
    });
  }
  return { metadata, content };
}

const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
};

const savedTheme = localStorage.getItem('theme') || 
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.addEventListener('click', toggleTheme);

let allPosts = [];
let isExpanded = false;

async function renderPosts(limit = 6) {
  if (!postsList) return;
  
  if (allPosts.length === 0) {
    const postsData = Object.entries(markdownFiles).map(([path, text]) => {
      const { metadata } = parseMarkdown(text);
      const cleanPath = path.replace('./', '/src/'); 
      return { ...metadata, path: cleanPath, originalPath: path };
    });

    allPosts = postsData
      .filter(p => p && p.title)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  const postsToShow = limit ? allPosts.slice(0, limit) : allPosts;

  if (allPosts.length === 0) {
    postsList.innerHTML = '<p>No projects found yet.</p>';
    return;
  }

  postsList.innerHTML = postsToShow.map(post => `
    <article class="post-card" data-path="${post.originalPath}">
      <div class="post-card-image">
        <img src="${post.image}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover; transition: 0.5s;">
      </div>
      <div class="post-card-content">
        <div class="post-meta">
          <div class="post-tags-container">
            ${(post.tags || 'Project').split(',').map(t => `<span class="post-tag">${t.trim()}</span>`).join('')}
          </div>
          <span class="post-date">${post.date || ''}</span>
        </div>
        <h2 class="post-title">${post.title}</h2>
        <p class="post-excerpt">${post.excerpt || ''}</p>
        <div class="post-footer">
          <span class="btn btn-primary" style="font-size: 0.8rem; padding: 0.5rem 1.2rem;">
            View Details 
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </span>
        </div>
      </div>
    </article>
  `).join('');

  if (allPosts.length > 6) {
    viewAllContainer.style.display = 'block';
    viewAllBtn.textContent = isExpanded ? 'Show Less Projects' : 'View All Projects';
  } else {
    viewAllContainer.style.display = 'none';
  }

  document.querySelectorAll('.post-card').forEach(card => {
    card.addEventListener('click', () => showPostByPath(card.getAttribute('data-path')));
  });
  
  addCursorHover();
}

viewAllBtn.addEventListener('click', () => {
  isExpanded = !isExpanded;
  renderPosts(isExpanded ? null : 6);
  if (!isExpanded) {
    document.getElementById('builds').scrollIntoView({ behavior: 'smooth' });
  }
});

function showPostByPath(path) {
  const text = markdownFiles[path];
  if (!text) return;

  const { metadata, content } = parseMarkdown(text);
  const htmlContent = marked.parse(content);

  postContentTarget.innerHTML = `
    <div class="post-meta">
      <div class="post-tags-container">
        ${(metadata.tags || '').split(',').map(t => `<span class="post-tag">${t.trim()}</span>`).join('')}
      </div>
      <span class="post-date">${metadata.date || ''}</span>
    </div>
    <h1 class="post-detail-title">${metadata.title || 'Project Details'}</h1>
    
    ${metadata.image ? `<div class="post-detail-banner">
      <img src="${metadata.image}" alt="${metadata.title}">
    </div>` : ''}

    <div class="post-content markdown-body">
      ${htmlContent}
    </div>
  `;
  
  homeView.style.display = 'none';
  postView.style.display = 'block';
  communityView.style.display = 'none';
  window.scrollTo(0, 0);
  addCursorHover();
  window.location.hash = `view-${btoa(path)}`;
}

function showCommunity() {
  homeView.style.display = 'none';
  postView.style.display = 'none';
  communityView.style.display = 'block';
  window.scrollTo(0, 0);
  addCursorHover();
}

function showHome() {
  homeView.style.display = 'block';
  postView.style.display = 'none';
  communityView.style.display = 'none';
  window.location.hash = '';
}

backBtn.addEventListener('click', (e) => { e.preventDefault(); showHome(); });
commBackBtn.addEventListener('click', (e) => { e.preventDefault(); showHome(); });
homeLink.addEventListener('click', (e) => { e.preventDefault(); showHome(); });

const addCursorHover = () => {
  const targets = document.querySelectorAll('a, button, .post-card, .community-card');
  targets.forEach(target => {
    target.addEventListener('mouseenter', () => cursorOutline?.classList.add('cursor-active'));
    target.addEventListener('mouseleave', () => cursorOutline?.classList.remove('cursor-active'));
  });
};

window.addEventListener('mousemove', (e) => {
  const posX = e.clientX;
  const posY = e.clientY;
  if (cursorDot) { cursorDot.style.left = `${posX}px`; cursorDot.style.top = `${posY}px`; }
  if (cursorOutline) { cursorOutline.animate({ left: `${posX}px`, top: `${posY}px` }, { duration: 500, fill: "forwards" }); }
  const x = (posX / window.innerWidth) - 0.5;
  const y = (posY / window.innerHeight) - 0.5;
  document.documentElement.style.setProperty('--mx', x);
  document.documentElement.style.setProperty('--my', y);
});

function handleRouting() {
  const hash = window.location.hash;
  if (hash.startsWith('#view-')) {
    showPostByPath(atob(hash.replace('#view-', '')));
  } else if (hash === '#community') {
    showCommunity();
  } else {
    showHome();
  }
}

window.addEventListener('hashchange', handleRouting);
handleRouting(); // Handle initial load

renderPosts();
