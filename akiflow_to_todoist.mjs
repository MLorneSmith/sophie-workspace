import fs from 'fs';

function loadEnv(path) {
  const txt = fs.readFileSync(path, 'utf8');
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    env[k] = v;
  }
  return env;
}

const ENV_PATH = process.env.ENV_PATH || '/home/ubuntu/.clawdbot/.env';
const env = loadEnv(ENV_PATH);

const TODOIST_TOKEN = process.env.TODOIST_API_TOKEN || env.TODOIST_API_TOKEN;
const AKIFLOW_TOKEN = process.env.AKIFLOW_ACCESS_TOKEN || env.AKIFLOW_ACCESS_TOKEN;

if (!TODOIST_TOKEN) throw new Error('Missing TODOIST_API_TOKEN');
if (!AKIFLOW_TOKEN) throw new Error('Missing AKIFLOW_ACCESS_TOKEN');

const DRY_RUN = (process.env.DRY_RUN || '0') === '1';

const headersAkiflow = {
  'authorization': `Bearer ${AKIFLOW_TOKEN}`,
  'accept': 'application/json'
};

const headersTodoist = {
  'authorization': `Bearer ${TODOIST_TOKEN}`,
  'content-type': 'application/json',
  'accept': 'application/json'
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function todoistFetch(url, opts = {}, {retries = 6} = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, { ...opts, headers: { ...headersTodoist, ...(opts.headers || {}) } });
    if (res.status !== 429) return res;
    const retryAfter = res.headers.get('Retry-After');
    const waitMs = retryAfter ? (parseFloat(retryAfter) * 1000) : (1000 * Math.pow(2, attempt));
    await sleep(waitMs);
  }
  throw new Error(`Todoist rate limited too many times: ${url}`);
}

async function akiflowGet(path) {
  const url = `https://api.akiflow.com${path}`;
  const res = await fetch(url, { headers: headersAkiflow });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Akiflow ${path} failed: ${res.status} ${txt.slice(0, 300)}`);
  }
  return res.json();
}

function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normTitle(s) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function main() {
  const [labelsResp, tasksResp] = await Promise.all([
    akiflowGet('/v5/labels?limit=2500'),
    akiflowGet('/v5/tasks?limit=2500')
  ]);
  const labels = labelsResp.data || [];
  const allTasks = tasksResp.data || [];

  const tasks = allTasks.filter(t => !t.done && !t.trashed_at);

  const byLabelId = new Map(labels.map(l => [l.id, l]));
  const topFolders = labels.filter(l => !l.parent_id && !l.deleted_at);

  const usedProjectIds = new Set(tasks.map(t => t.listId).filter(Boolean));
  const projects = [...usedProjectIds].map(id => byLabelId.get(id)).filter(Boolean).filter(l => !l.deleted_at);

  // Sections are labels with type='section'
  const usedSectionIds = new Set(tasks.map(t => t.section_id).filter(Boolean));
  const sections = [...usedSectionIds].map(id => byLabelId.get(id)).filter(Boolean).filter(l => !l.deleted_at);

  // Build project tree: folder -> projects
  const folderById = new Map(topFolders.map(f => [f.id, f]));
  const projectsByFolderId = new Map();
  for (const p of projects) {
    const folderId = p.parent_id;
    if (!projectsByFolderId.has(folderId)) projectsByFolderId.set(folderId, []);
    projectsByFolderId.get(folderId).push(p);
  }

  // Pull existing Todoist projects
  const todoistProjectsRes = await todoistFetch('https://api.todoist.com/rest/v2/projects', { method: 'GET' });
  const todoistProjects = await todoistProjectsRes.json();
  const todoistByNameAndParent = new Map();
  for (const p of todoistProjects) {
    const key = `${normTitle(p.name)}::${p.parent_id || ''}`;
    todoistByNameAndParent.set(key, p);
  }

  async function ensureProject(name, parent_id = null) {
    const key = `${normTitle(name)}::${parent_id || ''}`;
    if (todoistByNameAndParent.has(key)) return todoistByNameAndParent.get(key);

    if (DRY_RUN) {
      const fake = { id: `dry_${key}`, name, parent_id };
      todoistByNameAndParent.set(key, fake);
      return fake;
    }

    const res = await todoistFetch('https://api.todoist.com/rest/v2/projects', {
      method: 'POST',
      body: JSON.stringify({ name, parent_id })
    });
    if (!res.ok) throw new Error(`Todoist create project failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    const created = await res.json();
    todoistByNameAndParent.set(key, created);
    return created;
  }

  // Build mapping Akiflow labelId -> Todoist project
  const akiflowFolderToTodoist = new Map();
  const akiflowProjectToTodoist = new Map();

  // Create folders first
  for (const folder of topFolders) {
    if (!projectsByFolderId.has(folder.id)) continue; // only folders that contain used projects
    const tp = await ensureProject(folder.title);
    akiflowFolderToTodoist.set(folder.id, tp);
  }

  // Create child projects
  for (const [folderId, projs] of projectsByFolderId.entries()) {
    const parent = akiflowFolderToTodoist.get(folderId);
    if (!parent) continue;
    for (const p of projs) {
      const tp = await ensureProject(p.title, parent.id);
      akiflowProjectToTodoist.set(p.id, tp);
    }
  }

  // Sections: create per Todoist project
  const todoistSectionsByProjectId = new Map(); // projectId -> Map(sectionNameNorm -> section)
  async function ensureSection(todoistProjectId, sectionName) {
    if (!todoistSectionsByProjectId.has(todoistProjectId)) {
      // load existing sections (skip if DRY_RUN created a fake project id)
      let secs = [];
      if (!(DRY_RUN && String(todoistProjectId).startsWith('dry_'))) {
        const res = await todoistFetch(`https://api.todoist.com/rest/v2/sections?project_id=${encodeURIComponent(todoistProjectId)}`, { method: 'GET' });
        secs = await res.json();
      }
      const map = new Map(secs.map(s => [normTitle(s.name), s]));
      todoistSectionsByProjectId.set(todoistProjectId, map);
    }
    const map = todoistSectionsByProjectId.get(todoistProjectId);
    const k = normTitle(sectionName);
    if (map.has(k)) return map.get(k);

    if (DRY_RUN) {
      const fake = { id: `dry_section_${todoistProjectId}_${k}`, name: sectionName, project_id: todoistProjectId };
      map.set(k, fake);
      return fake;
    }

    const res = await todoistFetch('https://api.todoist.com/rest/v2/sections', {
      method: 'POST',
      body: JSON.stringify({ name: sectionName, project_id: todoistProjectId })
    });
    if (!res.ok) throw new Error(`Todoist create section failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    const created = await res.json();
    map.set(k, created);
    return created;
  }

  // Build section lookup from Akiflow label id
  const akiflowSectionLabelById = new Map(sections.map(s => [s.id, s]));

  // Prepare dedupe: load existing tasks per project
  const existingTaskTitlesByProject = new Map();
  async function getExistingTitles(todoistProjectId) {
    if (existingTaskTitlesByProject.has(todoistProjectId)) return existingTaskTitlesByProject.get(todoistProjectId);
    // In dry-run we fabricate project ids for projects that don't exist yet.
    if (DRY_RUN && String(todoistProjectId).startsWith('dry_')) {
      const set = new Set();
      existingTaskTitlesByProject.set(todoistProjectId, set);
      return set;
    }
    const res = await todoistFetch(`https://api.todoist.com/rest/v2/tasks?project_id=${encodeURIComponent(todoistProjectId)}`, { method: 'GET' });
    const arr = await res.json();
    const set = new Set(arr.map(t => normTitle(t.content)));
    existingTaskTitlesByProject.set(todoistProjectId, set);
    return set;
  }

  function mapDue(t) {
    // Todoist accepts either due_date or due_datetime (+ due_timezone).
    if (t.datetime) {
      const due = { due_datetime: t.datetime };
      if (t.datetime_tz) due.due_timezone = t.datetime_tz;
      return due;
    }
    if (t.due_date) return { due_date: t.due_date };
    if (t.date) return { due_date: t.date };
    return {};
  }

  function mapPriority(t) {
    // Akiflow priority seems to be 1..4 maybe; Todoist: 1 (low) .. 4 (high)
    const p = t.priority;
    if (!p) return undefined;
    if (p >= 4) return 4;
    if (p <= 1) return 1;
    return p;
  }

  let createdProjects = akiflowFolderToTodoist.size + akiflowProjectToTodoist.size;
  let createdSections = 0;
  let createdTasks = 0;
  let skippedDupes = 0;
  let skippedNoProject = 0;

  for (const t of tasks) {
    const proj = akiflowProjectToTodoist.get(t.listId);
    if (!proj) {
      skippedNoProject++;
      continue;
    }

    const existingSet = await getExistingTitles(proj.id);
    const title = (t.title || '').trim();
    if (!title) continue;

    if (existingSet.has(normTitle(title))) {
      skippedDupes++;
      continue;
    }

    let section_id;
    if (t.section_id) {
      const secLabel = akiflowSectionLabelById.get(t.section_id);
      if (secLabel && secLabel.parent_id === t.listId) {
        const sec = await ensureSection(proj.id, secLabel.title);
        section_id = sec.id;
      }
    }

    const description = htmlToText(t.description);
    const notes = [description].filter(Boolean).join('\n\n');

    const body = {
      content: title,
      project_id: proj.id,
      ...(section_id ? { section_id } : {}),
      ...(notes ? { description: notes } : {}),
      ...(mapDue(t)),
    };

    const pr = mapPriority(t);
    if (pr) body.priority = pr;

    if (DRY_RUN) {
      createdTasks++;
      existingSet.add(normTitle(title));
      if (section_id && String(section_id).startsWith('dry_section_')) createdSections++;
      continue;
    }

    const res = await todoistFetch('https://api.todoist.com/rest/v2/tasks', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Todoist create task failed (${res.status}): ${txt.slice(0, 500)}`);
    }

    await res.json();
    createdTasks++;
    existingSet.add(normTitle(title));
  }

  // Sections count: approximate based on loaded maps
  for (const map of todoistSectionsByProjectId.values()) createdSections += map.size;

  console.log(JSON.stringify({
    dryRun: DRY_RUN,
    akiflow: {
      totalTasks: allTasks.length,
      activeTasks: tasks.length,
      foldersTotal: topFolders.length,
      projectsUsed: projects.length,
      sectionsUsed: sections.length,
    },
    todoist: {
      createdProjects,
      createdTasks,
      skippedDupes,
      skippedNoProject,
      sectionsSeen: createdSections,
    }
  }, null, 2));
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
