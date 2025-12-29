import { marked } from "marked";
import matter from "gray-matter";
import { readdir, readFile, writeFile, mkdir, cp } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const POSTS_DIR = "./content/posts";
const PROJECTS_DIR = "./content/projects";
const SRC_DIR = "./src";
const DIST_DIR = "./dist";
const OUTPUT_DIR = "./dist/blog";
const PROJECTS_OUTPUT_DIR = "./dist/projects";

interface PostFrontmatter {
  title: string;
  description: string;
  date: string | Date;
}

interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  html: string;
}

interface ProjectFrontmatter {
  title: string;
  description: string;
  github?: string;
  featured?: boolean;
  expandable?: boolean;
  order?: number;
}

interface Project {
  slug: string;
  frontmatter: ProjectFrontmatter;
  content: string;
  html: string;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generatePostHtml(post: Post): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${post.frontmatter.description}">
  <title>${post.frontmatter.title} - Raaid Tanveer</title>
  <link rel="canonical" href="https://raaidtanveer.com/blog/${post.slug}">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}]});"></script>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true });
  </script>
</head>
<body>
  <header class="header">
    <div class="container header-inner">
      <a href="../index.html" class="logo">Raaid Tanveer</a>
      <nav class="nav">
        <a href="../index.html" class="nav-link">Home</a>
        <a href="../about.html" class="nav-link">About</a>
        <a href="../blog.html" class="nav-link active">Blog</a>
        <a href="../projects.html" class="nav-link">Projects</a>
      </nav>
    </div>
  </header>

  <main>
    <div class="container">
      <article class="blog-post prose">
        <h1>${post.frontmatter.title}</h1>
        <p class="blog-post-meta">${formatDate(post.frontmatter.date)}</p>

        <div class="blog-post-content">
          ${post.html}
        </div>
      </article>
    </div>
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-content">
        <p class="copyright">&copy; <span id="year"></span> Raaid Tanveer</p>
        <nav class="social-links">
          <a href="https://github.com/raaidrt" target="_blank" rel="noopener noreferrer" class="social-link">GitHub</a>
          <a href="https://www.linkedin.com/in/raaidrt/" target="_blank" rel="noopener noreferrer" class="social-link">LinkedIn</a>
          <a href="https://twitter.com/raaidrt" target="_blank" rel="noopener noreferrer" class="social-link">Twitter</a>
        </nav>
      </div>
    </div>
  </footer>

  <script>
    document.getElementById('year').textContent = new Date().getFullYear();
  </script>
</body>
</html>`;
}

function generateBlogIndexHtml(posts: Post[]): string {
  const postsHtml = posts
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime())
    .map((post) => {
      return `        <a href="blog/${post.slug}.html" class="card">
          <article>
            <p class="post-meta">${formatDate(post.frontmatter.date)}</p>
            <h3>${post.frontmatter.title}</h3>
            <p>${post.frontmatter.description}</p>
          </article>
        </a>`;
    })
    .join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="A projection of my thoughts into text.">
  <title>Blog - Raaid Tanveer</title>
  <link rel="canonical" href="https://raaidtanveer.com/blog">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}]});"></script>
</head>
<body>
  <header class="header">
    <div class="container header-inner">
      <a href="index.html" class="logo">Raaid Tanveer</a>
      <nav class="nav">
        <a href="index.html" class="nav-link">Home</a>
        <a href="about.html" class="nav-link">About</a>
        <a href="blog.html" class="nav-link active">Blog</a>
        <a href="projects.html" class="nav-link">Projects</a>
      </nav>
    </div>
  </header>

  <main>
    <div class="container">
      <header class="page-header">
        <h1>Blog</h1>
        <p class="page-description">
          A projection of my thoughts onto text.
        </p>
      </header>

      <div class="post-list">
${postsHtml}
      </div>
    </div>
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-content">
        <p class="copyright">&copy; <span id="year"></span> Raaid Tanveer</p>
        <nav class="social-links">
          <a href="https://github.com/raaidrt" target="_blank" rel="noopener noreferrer" class="social-link">GitHub</a>
          <a href="https://www.linkedin.com/in/raaidrt/" target="_blank" rel="noopener noreferrer" class="social-link">LinkedIn</a>
          <a href="https://twitter.com/raaidrt" target="_blank" rel="noopener noreferrer" class="social-link">Twitter</a>
        </nav>
      </div>
    </div>
  </footer>

  <script>
    document.getElementById('year').textContent = new Date().getFullYear();
  </script>
</body>
</html>`;
}

function generateProjectHtml(project: Project): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${project.frontmatter.description}">
  <title>${project.frontmatter.title} - Raaid Tanveer</title>
  <link rel="canonical" href="https://raaidtanveer.com/projects/${project.slug}">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}]});"></script>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true });
  </script>
</head>
<body>
  <header class="header">
    <div class="container header-inner">
      <a href="../index.html" class="logo">Raaid Tanveer</a>
      <nav class="nav">
        <a href="../index.html" class="nav-link">Home</a>
        <a href="../about.html" class="nav-link">About</a>
        <a href="../blog.html" class="nav-link">Blog</a>
        <a href="../projects.html" class="nav-link active">Projects</a>
      </nav>
    </div>
  </header>

  <main>
    <div class="container">
      <article class="blog-post prose">
        <h1>${project.frontmatter.title}</h1>
        ${project.frontmatter.github ? `<p class="project-links"><a href="${project.frontmatter.github}" target="_blank" rel="noopener noreferrer">View on GitHub &rarr;</a></p>` : ''}

        <div class="blog-post-content">
          ${project.html}
        </div>
      </article>
    </div>
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-content">
        <p class="copyright">&copy; <span id="year"></span> Raaid Tanveer</p>
        <nav class="social-links">
          <a href="https://github.com/raaidrt" target="_blank" rel="noopener noreferrer" class="social-link">GitHub</a>
          <a href="https://www.linkedin.com/in/raaidrt/" target="_blank" rel="noopener noreferrer" class="social-link">LinkedIn</a>
          <a href="https://twitter.com/raaidrt" target="_blank" rel="noopener noreferrer" class="social-link">Twitter</a>
        </nav>
      </div>
    </div>
  </footer>

  <script>
    document.getElementById('year').textContent = new Date().getFullYear();
  </script>
</body>
</html>`;
}

function generateProjectCard(project: Project): string {
  const { frontmatter, slug } = project;

  let linkHtml = '';
  if (frontmatter.expandable) {
    // Expandable project: link to detail page
    linkHtml = `<a href="projects/${slug}.html">Read more &rarr;</a>`;
  } else if (frontmatter.github) {
    // Non-expandable with GitHub: link to GitHub
    linkHtml = `<a href="${frontmatter.github}" target="_blank" rel="noopener noreferrer">View on GitHub &rarr;</a>`;
  }

  // Parse description as inline markdown to convert backticks to <code> tags
  const descriptionHtml = marked.parseInline(frontmatter.description) as string;

  return `        <article class="project-card">
          <h3>${frontmatter.title}</h3>
          <p>${descriptionHtml}</p>
          ${linkHtml ? `<div class="project-card-links">${linkHtml}</div>` : ''}
        </article>`;
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    // Sort by order field if present, otherwise by slug alphabetically
    const orderA = a.frontmatter.order ?? 999;
    const orderB = b.frontmatter.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.slug.localeCompare(b.slug);
  });
}

function generateProjectsIndexHtml(projects: Project[]): string {
  const projectsHtml = sortProjects(projects)
    .map(generateProjectCard)
    .join("\n\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Personal projects and open source work.">
  <title>Projects - Raaid Tanveer</title>
  <link rel="canonical" href="https://raaidtanveer.com/projects">
  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}]});"></script>
</head>
<body>
  <header class="header">
    <div class="container header-inner">
      <a href="index.html" class="logo">Raaid Tanveer</a>
      <nav class="nav">
        <a href="index.html" class="nav-link">Home</a>
        <a href="about.html" class="nav-link">About</a>
        <a href="blog.html" class="nav-link">Blog</a>
        <a href="projects.html" class="nav-link active">Projects</a>
      </nav>
    </div>
  </header>

  <main>
    <div class="container">
      <header class="page-header">
        <h1>Projects</h1>
        <p class="page-description">
          A collection of personal projects and open source contributions.
        </p>
      </header>

      <div class="project-grid">
${projectsHtml}
      </div>
    </div>
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-content">
        <p class="copyright">&copy; <span id="year"></span> Raaid Tanveer</p>
        <nav class="social-links">
          <a href="https://github.com/raaidrt" target="_blank" rel="noopener noreferrer" class="social-link">GitHub</a>
          <a href="https://www.linkedin.com/in/raaidrt/" target="_blank" rel="noopener noreferrer" class="social-link">LinkedIn</a>
          <a href="https://twitter.com/raaidrt" target="_blank" rel="noopener noreferrer" class="social-link">Twitter</a>
        </nav>
      </div>
    </div>
  </footer>

  <script>
    document.getElementById('year').textContent = new Date().getFullYear();
  </script>
</body>
</html>`;
}

function generateFeaturedProjectsHtml(projects: Project[]): string {
  const featuredProjects = sortProjects(projects.filter(p => p.frontmatter.featured));
  return featuredProjects.map(generateProjectCard).join("\n\n");
}

function generateRecentPostsHtml(posts: Post[], limit: number = 3): string {
  const recentPosts = posts
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime())
    .slice(0, limit);

  return recentPosts.map(post => `          <article class="post-item">
            <a href="blog/${post.slug}.html" class="post-link">
              <h3>${post.frontmatter.title}</h3>
            </a>
            <p class="post-description">${post.frontmatter.description}</p>
          </article>`).join("\n");
}

async function buildProjects(): Promise<Project[]> {
  console.log("Building projects...");

  // Ensure output directory exists
  if (!existsSync(PROJECTS_OUTPUT_DIR)) {
    await mkdir(PROJECTS_OUTPUT_DIR, { recursive: true });
  }

  // Check if projects directory exists
  if (!existsSync(PROJECTS_DIR)) {
    console.log("  No projects directory found, skipping...");
    return [];
  }

  // Read all markdown files
  const files = await readdir(PROJECTS_DIR);
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  const projects: Project[] = [];

  for (const file of mdFiles) {
    const slug = file.replace(".md", "");
    const filePath = join(PROJECTS_DIR, file);
    const fileContent = await readFile(filePath, "utf-8");

    // Parse frontmatter
    const { data, content } = matter(fileContent);
    const frontmatter = data as ProjectFrontmatter;

    // Convert markdown to HTML (only needed for expandable projects, but do it anyway)
    const html = await marked(content);

    const project: Project = { slug, frontmatter, content, html };
    projects.push(project);

    // Generate detail page only for expandable projects
    if (frontmatter.expandable) {
      const projectHtml = generateProjectHtml(project);
      const outputPath = join(PROJECTS_OUTPUT_DIR, `${slug}.html`);
      await writeFile(outputPath, projectHtml);
      console.log(`  Built: ${outputPath}`);
    }
  }

  // Generate projects index
  const projectsIndexHtml = generateProjectsIndexHtml(projects);
  await writeFile("./dist/projects.html", projectsIndexHtml);
  console.log("  Built: dist/projects.html");

  console.log(`  Processed ${projects.length} project(s).`);
  return projects;
}

async function generateIndexHtml(posts: Post[], projects: Project[]): Promise<void> {
  const templatePath = "./src/index.html";
  let indexContent = await readFile(templatePath, "utf-8");

  // Replace recent posts placeholder
  const recentPostsHtml = generateRecentPostsHtml(posts);
  indexContent = indexContent.replace("<!-- RECENT_POSTS -->", recentPostsHtml);

  // Replace featured projects placeholder
  const featuredHtml = generateFeaturedProjectsHtml(projects);
  indexContent = indexContent.replace("<!-- FEATURED_PROJECTS -->", featuredHtml);

  await writeFile("./dist/index.html", indexContent);
  console.log("  Built: dist/index.html");
}

async function copyStaticFiles(): Promise<void> {
  console.log("Copying static files...");

  // Ensure dist directory exists
  if (!existsSync(DIST_DIR)) {
    await mkdir(DIST_DIR, { recursive: true });
  }

  // Copy static files from src to dist
  const staticFiles = ["about.html", "favicon.svg", "profile.png", "styles.css"];
  for (const file of staticFiles) {
    const srcPath = join(SRC_DIR, file);
    const destPath = join(DIST_DIR, file);
    if (existsSync(srcPath)) {
      await cp(srcPath, destPath);
      console.log(`  Copied: ${destPath}`);
    }
  }
}

async function build() {
  // Copy static files first
  await copyStaticFiles();

  console.log("Building blog posts...");

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  // Read all markdown files
  const files = await readdir(POSTS_DIR);
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  const posts: Post[] = [];

  for (const file of mdFiles) {
    const slug = file.replace(".md", "");
    const filePath = join(POSTS_DIR, file);
    const fileContent = await readFile(filePath, "utf-8");

    // Parse frontmatter
    const { data, content } = matter(fileContent);
    const frontmatter = data as PostFrontmatter;

    // Convert markdown to HTML
    const html = await marked(content);

    const post: Post = { slug, frontmatter, content, html };
    posts.push(post);

    // Generate and write post HTML
    const postHtml = generatePostHtml(post);
    const outputPath = join(OUTPUT_DIR, `${slug}.html`);
    await writeFile(outputPath, postHtml);
    console.log(`  Built: ${outputPath}`);
  }

  // Generate blog index
  const blogIndexHtml = generateBlogIndexHtml(posts);
  await writeFile("./dist/blog.html", blogIndexHtml);
  console.log("  Built: dist/blog.html");

  console.log(`Done! Built ${posts.length} post(s).\n`);

  // Build projects
  const projects = await buildProjects();

  // Generate index.html from template
  await generateIndexHtml(posts, projects);

  console.log("\nBuild complete!");
}

// Watch mode
const watchMode = process.argv.includes("--watch");

if (watchMode) {
  console.log("Watching for changes...\n");

  const fs = require("fs");

  // Parse .gitignore patterns
  const gitignorePatterns: string[] = [];
  try {
    const gitignore = await readFile("./.gitignore", "utf-8");
    gitignore.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        gitignorePatterns.push(trimmed.replace(/\/$/, "")); // Remove trailing slash
      }
    });
  } catch {
    // No .gitignore file
  }

  function isIgnored(filepath: string): boolean {
    const parts = filepath.split("/");
    return gitignorePatterns.some((pattern) => {
      // Check if any part of the path matches the pattern
      return parts.some((part) => part === pattern || filepath.startsWith(pattern));
    });
  }

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const watcher = fs.watch(".", { recursive: true }, (eventType: string, filename: string) => {
    if (!filename || isIgnored(filename)) return;

    // Debounce rapid changes
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log(`\nFile changed: ${filename}`);
      await build();
    }, 100);
  });

  await build();

  process.on("SIGINT", () => {
    watcher.close();
    process.exit(0);
  });
} else {
  await build();
}
