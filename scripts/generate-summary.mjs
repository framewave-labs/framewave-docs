import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const summaryDir = path.join(root, "content", "00_통합요약")
const membersDir = path.join(root, "content", "members")
const categories = ["01_기획", "02_리서치", "03_엔지니어링", "04_QA", "05_회의록", "06_참고자료"]
const today = new Date().toISOString().slice(0, 10)

async function exists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function listFiles(directory) {
  if (!(await exists(directory))) return []

  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)))
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath)
    }
  }

  return files
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return {}
  const end = text.indexOf("\n---", 4)
  if (end === -1) return {}

  const frontmatter = text.slice(4, end).split("\n")
  const data = {}
  for (const line of frontmatter) {
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (match) data[match[1]] = match[2].trim()
  }
  return data
}

function stripFrontmatter(text) {
  if (!text.startsWith("---\n")) return text
  const end = text.indexOf("\n---", 4)
  return end === -1 ? text : text.slice(end + 4).trim()
}

async function readDocuments() {
  const files = await listFiles(membersDir)
  const docs = []

  for (const file of files) {
    if (file.endsWith("index.md")) continue
    const text = await fs.readFile(file, "utf8")
    const metadata = parseFrontmatter(text)
    if (metadata.summary_target === "false") continue

    const relative = path.relative(path.join(root, "content"), file)
    const parts = relative.split(path.sep)
    const member = parts[1] ?? "unknown"
    const category = metadata.category || parts[2] || "기타"
    const title = metadata.title || path.basename(file, ".md")

    docs.push({
      file,
      relative,
      member,
      category,
      title,
      status: metadata.status || "",
      updated: metadata.updated || "",
      content: stripFrontmatter(text).slice(0, 6000),
    })
  }

  return docs
}

function frontmatter(title) {
  return [
    "---",
    `title: ${title}`,
    "author: framewave-labs",
    "category: 00_통합요약",
    "status: draft",
    `created: ${today}`,
    `updated: ${today}`,
    "tags:",
    "  - 통합요약",
    "summary_target: false",
    "---",
    "",
  ].join("\n")
}

function docLink(doc) {
  return `[[${doc.relative.replace(/\.md$/, "")}|${doc.title}]]`
}

function fallbackSummary(title, docs) {
  const lines = [frontmatter(title), `# ${title}`, ""]

  if (docs.length === 0) {
    lines.push("요약 대상 문서가 아직 없습니다.", "")
    return lines.join("\n")
  }

  lines.push("## 문서 목록", "")
  for (const doc of docs) {
    const meta = [doc.member, doc.status, doc.updated].filter(Boolean).join(" / ")
    lines.push(`- ${docLink(doc)}${meta ? ` (${meta})` : ""}`)
  }
  lines.push("")
  lines.push("## 요약")
  lines.push("")
  lines.push("OPENAI_API_KEY가 설정되면 GitHub Actions에서 자동 요약 내용으로 갱신됩니다.")
  lines.push("")
  return lines.join("\n")
}

async function aiSummary(title, docs) {
  if (!process.env.OPENAI_API_KEY || docs.length === 0) {
    return fallbackSummary(title, docs)
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.5"
  const input = [
    "다음은 Framewave Labs 팀 문서입니다.",
    "한국어로 핵심 요약, 결정 사항, 남은 할 일을 간결하게 정리하세요.",
    "",
    ...docs.map((doc) => [
      `문서: ${doc.title}`,
      `작성자: ${doc.member}`,
      `카테고리: ${doc.category}`,
      `상태: ${doc.status}`,
      doc.content,
      "",
    ].join("\n")),
  ].join("\n")

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
      max_output_tokens: 1800,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI summary failed: ${response.status} ${error}`)
  }

  const data = await response.json()
  const text = data.output_text || fallbackSummary(title, docs)
  return `${frontmatter(title)}# ${title}\n\n${text.trim()}\n`
}

async function writeSummary(filename, title, docs) {
  const text = await aiSummary(title, docs)
  await fs.writeFile(path.join(summaryDir, filename), text)
}

const docs = await readDocuments()
await fs.mkdir(summaryDir, { recursive: true })

await writeSummary("전체_요약.md", "전체 요약", docs)

for (const category of categories) {
  const title = `${category} 요약`
  await writeSummary(`${category}_요약.md`, title, docs.filter((doc) => doc.category === category))
}

const recentLines = [
  frontmatter("최근 변경사항"),
  "# 최근 변경사항",
  "",
  ...docs
    .slice()
    .sort((a, b) => String(b.updated).localeCompare(String(a.updated)))
    .slice(0, 30)
    .map((doc) => `- ${doc.updated || "날짜 없음"}: ${docLink(doc)} (${doc.member})`),
  "",
]
await fs.writeFile(path.join(summaryDir, "최근_변경사항.md"), recentLines.join("\n"))

console.log(`Generated summaries for ${docs.length} docs.`)

