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

// TOC HTML template
const tocTemplate = (content: string) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Table of Contents</title>
    <style>
        body {
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 0.5rem;
        }
        .toc-section {
            margin: 2rem 0;
        }
        .toc-section h2 {
            color: #1e40af;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        .toc-list {
            list-style: none;
            padding: 0;
        }
        .toc-item {
            padding: 0.5rem 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .toc-item:last-child {
            border-bottom: none;
        }
        .toc-link {
            color: #2563eb;
            text-decoration: none;
            font-size: 1.1rem;
        }
        .toc-link:hover {
            text-decoration: underline;
            color: #1e40af;
        }
        .toc-path {
            color: #6b7280;
            font-size: 0.9rem;
            margin-left: 1rem;
        }
        .stats {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 8px;
            margin: 1.5rem 0;
        }
        .indent-1 { margin-left: 1.5rem; }
        .indent-2 { margin-left: 3rem; }
        .indent-3 { margin-left: 4.5rem; }
    </style>
</head>
<body>
    <h1>📚 Table of Contents</h1>
    <div class="stats">
        <strong>Total pages:</strong> <span id="total-pages"></span>
    </div>
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
  // Sort pages by path
  pages.sort((a, b) => a.path.localeCompare(b.path));

  // Group by directory
  const grouped = new Map<string, PageInfo[]>();

  pages.forEach((page) => {
    const dir = dirname(page.path);
    const dirKey = dir === "." ? "Root" : dir;
    if (!grouped.has(dirKey)) {
      grouped.set(dirKey, []);
    }
    grouped.get(dirKey)!.push(page);
  });

  let content = "";

  // Generate sections
  for (const [dir, dirPages] of grouped) {
    content += `<div class="toc-section">`;
    if (dir !== "Root") {
      content += `<h2>📁 ${dir}</h2>`;
    } else {
      content += `<h2>🏠 Root Directory</h2>`;
    }
    content += `<ul class="toc-list">`;

    for (const page of dirPages) {
      const indentClass =
        page.depth > 0 ? `indent-${Math.min(page.depth, 3)}` : "";
      content += `
                <li class="toc-item ${indentClass}">
                    <a href="${page.path}" class="toc-link">${page.title}</a>
                    <span class="toc-path">${page.path}</span>
                </li>`;
    }

    content += `</ul></div>`;
  }

  const html = tocTemplate(content);
  return html.replace(
    '<span id="total-pages"></span>',
    `<span id="total-pages">${pages.length}</span>`,
  );
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
