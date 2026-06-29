import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const members = ["scy", "lsg"]
const categories = ["01_기획", "02_리서치", "03_엔지니어링", "04_QA", "05_회의록", "06_참고자료"]

async function exists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function copyDirectory(source, target) {
  await fs.mkdir(target, { recursive: true })
  const entries = await fs.readdir(source, { withFileTypes: true })

  for (const entry of entries) {
    const from = path.join(source, entry.name)
    const to = path.join(target, entry.name)

    if (entry.isDirectory()) {
      await copyDirectory(from, to)
    } else {
      await fs.copyFile(from, to)
    }
  }
}

function sourceContentPath(member) {
  const actionSource = path.join(root, "_sources", member, "content")
  const localSource = path.resolve(root, "..", member, "content")
  return { actionSource, localSource }
}

async function writeMemberIndex(member, targetRoot) {
  const lines = [
    "---",
    `title: ${member} 문서`,
    `author: ${member}`,
    "category: members",
    "status: draft",
    "created: 2026-06-29",
    "updated: 2026-06-29",
    "tags:",
    "  - members",
    "summary_target: false",
    "---",
    "",
    `# ${member} 문서`,
    "",
    "## 카테고리",
    "",
    ...categories.map((category) => `- [[${category}]]`),
    "",
  ]

  await fs.writeFile(path.join(targetRoot, "index.md"), lines.join("\n"))
}

for (const member of members) {
  const { actionSource, localSource } = sourceContentPath(member)
  const source = (await exists(actionSource)) ? actionSource : localSource
  const targetRoot = path.join(root, "content", "members", member)

  if (!(await exists(source))) {
    console.warn(`Skip ${member}: source content directory not found.`)
    continue
  }

  await fs.rm(targetRoot, { recursive: true, force: true })
  await fs.mkdir(targetRoot, { recursive: true })

  for (const category of categories) {
    const sourceCategory = path.join(source, category)
    const targetCategory = path.join(targetRoot, category)

    if (await exists(sourceCategory)) {
      await copyDirectory(sourceCategory, targetCategory)
    } else {
      await fs.mkdir(targetCategory, { recursive: true })
    }
  }

  await writeMemberIndex(member, targetRoot)
  console.log(`Collected ${member} docs.`)
}

