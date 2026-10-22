(() => {
  const PLAN_KEY = 'tempo.standalone.plan.v1'
  let plan = JSON.parse(localStorage.getItem(PLAN_KEY) || 'null') || null
  let breakEvery = 90

  const minutes = (value) => {
    const [hours, mins] = value.split(':').map(Number)
    return hours * 60 + mins
  }
  const clock = (value) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
  const priorityValue = { High: 0, Medium: 1, Low: 2, Fixed: -1 }
  const fixedBlocks = () => tasks.filter((task) => task.fixed).map((task) => ({ ...task, start: minutes(task.time), end: minutes(task.time) + task.duration }))

  function buildPlan() {
    const fixed = fixedBlocks()
    const blocks = fixed.map((task) => ({ ...task, kind: 'fixed', start: clock(task.start), end: clock(task.end), reason: 'Protected as a fixed commitment.' }))
    const flexible = tasks.filter((task) => !task.fixed && !task.done).sort((a, b) => priorityValue[a.priority] - priorityValue[b.priority])
    let cursor = 9 * 60
    let focused = 0
    const unscheduled = []

    flexible.forEach((task) => {
      let start = Math.max(cursor, minutes(task.time || '09:00'))
      let conflict = fixed.find((item) => start < item.end && start + task.duration > item.start)
      if (conflict) start = conflict.end
      if (focused >= breakEvery) {
        blocks.push({ kind: 'break', title: 'Breathing room', start: clock(start), end: clock(start + 15), reason: 'A short reset keeps the next block sustainable.' })
        start += 15
        focused = 0
      }
      conflict = fixed.find((item) => start < item.end && start + task.duration > item.start)
      if (conflict) start = conflict.end
      if (start + task.duration > 18 * 60) {
        unscheduled.push({ title: task.title, reason: 'Not enough open time before 18:00.' })
        return
      }
      const end = start + task.duration
      const next = { ...task, kind: 'task', start: clock(start), end: clock(end), reason: task.priority === 'High' ? 'Placed first because it has the highest priority.' : 'Placed after fixed commitments with a transition buffer.' }
      blocks.push(next)
      task.time = clock(start)
      cursor = end + 10
      focused += task.duration
    })
    blocks.sort((a, b) => minutes(a.start) - minutes(b.start))
    plan = { blocks, unscheduled, generatedAt: Date.now() }
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
    save()
    return plan
  }

  function planMarkup(result) {
    const taskBlocks = result.blocks.filter((block) => block.kind === 'task' || block.kind === 'fixed')
    return `<div class="message plan"><div class="plan-title">Here is a formatted plan based on that.</div>${taskBlocks.map((block) => `<div class="plan-row"><span>${block.start} - ${block.end}</span><strong>${escapeHtml(block.title)}</strong><button onclick="editTask(${tasks.findIndex((task) => task.title === block.title)})">Edit</button></div>`).join('')}<p class="muted">${result.blocks.filter((block) => block.kind === 'break').length} break(s) and 10-minute transition buffers included. ${result.unscheduled.length ? `${result.unscheduled.length} task(s) moved to your fallback list.` : 'Everything fit without scheduling over a fixed commitment.'}</p><button class="button secondary" onclick="window.render('schedule')">Review and edit full schedule →</button></div>`
  }

  window.sendPrompt = function sendPrompt(prompt) {
    if (!prompt || !prompt.trim()) return
    const box = document.getElementById('messages')
    if (!box) return
    box.innerHTML += `<div class="message user">${escapeHtml(prompt)}</div>`
    const lower = prompt.toLowerCase()
    if (lower.includes('30 minute')) {
      tasks = tasks.filter((task) => task.fixed || task.priority === 'High').map((task) => task.fixed ? task : { ...task, duration: Math.min(30, task.duration) })
    }
    if (lower.includes('exercise') && !tasks.some((task) => task.title.toLowerCase().includes('exercise'))) {
      tasks.push({ title: 'Exercise', duration: 30, priority: 'Medium', energy: 'Medium', time: '08:00' })
    }
    if (lower.includes('break') || lower.includes('intense')) breakEvery = 60
    if (lower.includes('priorit') && lower.includes('exam')) {
      const exam = tasks.find((task) => task.title.toLowerCase().includes('biology') || task.title.toLowerCase().includes('exam'))
      if (exam) exam.priority = 'High'
    }
    const result = buildPlan()
    box.innerHTML += planMarkup(result)
    box.scrollTop = box.scrollHeight
  }

  window.schedulePage = function schedulePage() {
    const result = plan || buildPlan()
    const taskRows = result.blocks.map((block) => block.kind === 'break'
      ? `<div class="item"><div class="time">${block.start}<small>${block.end}</small></div><div class="rail"></div><div class="item-body"><b>${block.title}</b><small>${block.reason}</small></div></div>`
      : `<div class="item ${block.kind === 'fixed' ? 'fixed' : ''}"><div class="time">${block.start}<small>${block.end}</small></div><div class="rail"></div><div class="item-body"><b>${escapeHtml(block.title)}</b><span class="energy ${block.energy === 'High' ? 'high' : ''}">${block.fixed ? 'Fixed' : block.energy}</span><small>${block.reason} <button class="button secondary" onclick="editTask(${tasks.findIndex((task) => task.title === block.title)})">Edit</button></small></div></div>`).join('')
    const overflow = result.unscheduled.length ? `<div class="warning"><b>Fallback list:</b> ${result.unscheduled.map((task) => `${escapeHtml(task.title)} - ${task.reason}`).join(' ')}</div>` : ''
    return `<div class="page">${head('Plan view', 'Your schedule', '<button class="button secondary" onclick="window.render(\'chat\')">Change with Tempo</button>')}<section class="schedule-board"><div class="card-head"><div><h3>Generated plan</h3><span class="muted">Built from your latest request. Edit any flexible block before you start.</span></div><button class="button" onclick="window.sendPrompt('Regenerate this plan with more breathing room')">Regenerate</button></div><div class="timeline">${taskRows}</div>${overflow || '<div class="warning">Nothing overlaps your fixed commitments. Buffers and breaks are included.</div>'}</section></div>`
  }

  const originalRender = window.render
  window.render = function render(view) {
    if (view === 'schedule') {
      document.querySelectorAll('.nav button').forEach((button) => button.classList.toggle('active', button.dataset.view === view))
      document.getElementById('crumb').textContent = 'Schedule'
      document.getElementById('content').innerHTML = window.schedulePage()
      return
    }
    originalRender(view)
  }

  if (!plan) buildPlan()
})()
