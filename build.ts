import { readdir, readFile, writeFile, mkdir, stat } from "fs/promises";
import { join, relative, dirname, basename } from "path";
import { marked } from "marked";

const SRC_DIR = process.cwd();
const DIST_DIR = join(process.cwd(), "dist");

// HTML template
const htmlTemplate = (title: string, content: string) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        pre {
            background: #f4f4f4;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
        }
        code {
            background: #f4f4f4;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
        }
        pre code {
            background: none;
            padding: 0;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;

interface PageInfo {
  path: string;
  relativePath: string;
  title: string;
  depth: number;
}

async function getAllMarkdownFiles(
  dir: string,
  files: string[] = [],
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip dist directory and node_modules
    if (
      entry.name === "dist" ||
      entry.name === "node_modules" ||
      entry.name.startsWith(".")
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      await getAllMarkdownFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function convertMarkdownToHtml(mdPath: string): Promise<PageInfo> {
  const mdContent = await readFile(mdPath, "utf-8");
  const htmlContent = marked.parse(mdContent);

  // Get relative path from source directory
  const relativePath = relative(SRC_DIR, mdPath);

  // Convert .md extension to .html
  const htmlPath = join(DIST_DIR, relativePath.replace(/\.md$/, ".html"));

  // Ensure output directory exists
  const outputDir = dirname(htmlPath);
  await mkdir(outputDir, { recursive: true });

  // Extract title from first h1 or filename
  const h1Match = mdContent.match(/^#\s+(.+)$/m);
  const title = h1Match ? h1Match[1] : basename(mdPath, ".md");

  // Calculate depth
  const depth = relativePath.split("/").length - 1;

  // Generate and write HTML
  const html = htmlTemplate(title, htmlContent);
  await writeFile(htmlPath, html, "utf-8");

  console.log(`✓ ${relativePath} → ${relative(process.cwd(), htmlPath)}`);

  return {
    path: relative(DIST_DIR, htmlPath),
    relativePath,
    title,
    depth,
  };
}

function generateTocHtml(pages: PageInfo[]): string {
  // First, let's sort the pages so everything lines up nicely
  pages.sort((a, b) => a.path.localeCompare(b.path));

  // Build a tree! This is the cool part.
  const root: TreeNode = {
    name: "Project",
    path: "",
    children: [],
    page: undefined,
  };

  pages.forEach((page) => {
    const parts = page.path.split("/").filter(Boolean); // split path into folders/files
    let current = root;

    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      const fullPathSoFar = parts.slice(0, i + 1).join("/");

      // Look for existing child
      let child = current.children.find((c) => c.name === part);

      if (!child) {
        child = {
          name: part,
          path: fullPathSoFar,
          children: [],
          page: isFile ? page : undefined,
        };
        current.children.push(child);
      }

      if (!isFile) {
        current = child;
      }
    });
  });

  // Now, generate the HTML using the *exact same structure* as your template
  function renderNode(node: TreeNode, depth = 0): string {
    if (node.page) {
      // It's a file! Use the file-link style
      return `
        <li>
          <a href="${node.page.path}" class="file-link">
            <span class="file-icon"></span>
            <span>${node.page.title}</span>
          </a>
        </li>`;
    } else {
      // It's a folder! Make it collapsible
      const childHtml = node.children
        .sort((a, b) => {
          // Folders first, then files
          const aIsDir = !a.page;
          const bIsDir = !b.page;
          if (aIsDir && !bIsDir) return -1;
          if (!aIsDir && bIsDir) return 1;
          return a.name.localeCompare(b.name);
        })
        .map((child) => renderNode(child, depth + 1))
        .join("");

      return `
        <li>
          <div class="folder" data-folder>
            <span class="folder-icon"></span>
            <span class="folder-name">${node.name}</span>
          </div>
          <ul class="folder-content">
            ${childHtml}
          </ul>
        </li>`;
    }
  }

  const innerTree = root.children.map(renderNode).join("");

  // Now wrap it in the full template (same as your document)
  const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>toc</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: #f3f4f6;
      padding: 2rem;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1.5rem;
      color: #1f2937;
    }
    ul { list-style: none; }
    ul ul { margin-left: 1.5rem; margin-top: 0.25rem; }
    .folder {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      cursor: pointer;
      border-radius: 0.25rem;
      user-select: none;
    }
    .folder:hover { background-color: #f3f4f6; }
    .folder-icon { margin-right: 0.5rem; font-size: 1rem; }
    .folder-icon::before { content: "📁"; }
    .folder.open .folder-icon::before { content: "📂"; }
    .folder-name { font-weight: 500; color: #374151; }
    .folder-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
    }
    .folder-content.open {
      max-height: 2000px;
      transition: max-height 0.5s ease-in;
    }
    .file-link {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      text-decoration: none;
      color: #2563eb;
      border-radius: 0.25rem;
    }
    .file-link:hover {
      background-color: #eff6ff;
      color: #1d4ed8;
    }
    .file-icon { margin-right: 0.5rem; }
    .file-icon::before { content: "📄"; }
    .total-pages {
      margin-top: 1rem;
      color: #6b7280;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Directory Tree</h1>
    <ul id="root">
      ${innerTree}
    </ul>
    <p class="total-pages">Total pages: <span id="total-pages">${pages.length}</span></p>
  </div>

  <script>
    const folders = document.querySelectorAll("[data-folder]");
    folders.forEach((folder) => {
      folder.addEventListener("click", function (e) {
        e.stopPropagation();
        const content = this.nextElementSibling;
        if (content && content.classList.contains("folder-content")) {
          this.classList.toggle("open");
          content.classList.toggle("open");
        }
      });
    });

    const fileLinks = document.querySelectorAll(".file-link");
    fileLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        // Let the browser handle navigation (since href is real)
        // But you can still log if you want
        const fileName = this.querySelector("span:last-child").textContent;
        console.log("Navigating to:", fileName);
      });
    });
  </script>
</body>
</html>`;

  return html;
}

async function build() {
  console.log("🚀 Starting Markdown to HTML conversion...\n");

  // Clean and create dist directory
  await mkdir(DIST_DIR, { recursive: true });

  // Get all markdown files
  const mdFiles = await getAllMarkdownFiles(SRC_DIR);

  if (mdFiles.length === 0) {
    console.log("⚠️  No markdown files found!");
    return;
  }

  // Convert all files
  const pages = await Promise.all(mdFiles.map(convertMarkdownToHtml));

  // Generate TOC
  console.log("\n📑 Generating table of contents...");
  const tocHtml = generateTocHtml(pages);
  await writeFile(join(DIST_DIR, "toc.html"), tocHtml, "utf-8");
  console.log("✓ toc.html created");

  console.log(`\n✨ Successfully converted ${mdFiles.length} file(s) to HTML!`);
  console.log(`📖 View all pages at: dist/toc.html`);
}

// Run build
build().catch(console.error);
