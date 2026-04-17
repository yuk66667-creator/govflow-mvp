// ── GovFlow Frontend ──────────────────────────────────────────

// ── API helper ───────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: { error: text } }; }
}

function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type}`;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = 'toast hidden', 3200);
}

function daysUntil(d) {
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Navigation ───────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    const page = item.dataset.page;
    document.getElementById(`page-${page}`).classList.add('active');
    ({ dashboard: loadDashboard, programs: loadPrograms, admin: loadAdmin,
       users: loadUsers, match: ()=>{}, documents: loadDocumentForm,
       email: ()=>{}, history: loadHistory })[page]?.();
  });
});

// ── Dashboard ────────────────────────────────────────────────
async function loadDashboard() {
  const [pR, uR, hR] = await Promise.all([
    api('GET', '/api/programs'),
    api('GET', '/api/users'),
    api('GET', '/api/admin/history')
  ]);

  const programs = pR.ok ? pR.data.programs : [];
  const users    = uR.ok ? uR.data.users    : [];
  const hist     = hR.ok ? hR.data          : { count: 0 };

  const urgent = programs
    .map(p => ({ ...p, days: daysUntil(p.deadline) }))
    .filter(p => p.days >= 0 && p.days <= 30)
    .sort((a, b) => a.days - b.days);

  document.getElementById('stat-programs').textContent = programs.length;
  document.getElementById('stat-users').textContent    = users.length;
  document.getElementById('stat-urgent').textContent   = urgent.length;
  document.getElementById('stat-history').textContent  = hist.count || 0;

  const el = document.getElementById('dashboard-urgent-list');
  if (!urgent.length) { el.innerHTML = '<div class="empty">30일 이내 마감 공고가 없습니다.</div>'; return; }
  el.innerHTML = urgent.map(p => {
    const cls = p.days <= 7 ? 'd-red' : p.days <= 14 ? 'd-orange' : 'd-yellow';
    const label = p.days === 0 ? 'D-Day' : `D-${p.days}`;
    return `<div class="urgent-item">
      <div>
        <div style="font-weight:600;font-size:13px">${escHtml(p.title)}</div>
        <div style="color:#6b7a99;font-size:11px;margin-top:2px">${escHtml(p.ministry||'')} · ${escHtml(p.amount)}</div>
      </div>
      <span class="d-badge ${cls}">${label}</span>
    </div>`;
  }).join('');
}

// ── Programs (browse) ────────────────────────────────────────
let _allPrograms = [];

async function loadPrograms() {
  const res = await api('GET', '/api/programs');
  _allPrograms = res.ok ? res.data.programs : [];
  renderProgramCards(_allPrograms);
}

function renderProgramCards(list) {
  const el = document.getElementById('programs-list');
  if (!list.length) { el.innerHTML = '<div class="empty">검색 결과가 없습니다.</div>'; return; }
  el.innerHTML = list.map(p => {
    const days = daysUntil(p.deadline);
    const dLabel = days < 0 ? '마감' : days === 0 ? 'D-Day' : `D-${days}`;
    const dColor = days >= 0 && days <= 7 ? 'color:#dc2626' : 'color:#6b7a99';
    const link = p.link ? `<a href="${escHtml(p.link)}" target="_blank" style="font-size:11px;color:#4a90e2">공고 바로가기 →</a>` : '';
    return `<div class="program-card">
      <div class="p-title">${escHtml(p.title)}</div>
      <div class="p-amount">${escHtml(p.amount)}</div>
      <div class="p-meta">${escHtml(p.ministry||'')}${p.category?' · '+escHtml(p.category):''}</div>
      <div class="p-meta">${escHtml(p.eligibility||'')}</div>
      <div class="p-deadline" style="${dColor}">마감: ${p.deadline} (${dLabel})</div>
      <div class="p-tags">${(p.keywords||[]).map(k=>`<span class="tag">${escHtml(k)}</span>`).join('')}</div>
      <div style="margin-top:8px">${link}</div>
    </div>`;
  }).join('');
}

document.getElementById('btn-program-search').addEventListener('click', async () => {
  const q = document.getElementById('program-search').value.trim();
  if (!q) { renderProgramCards(_allPrograms); return; }
  const res = await api('GET', `/api/programs/search?q=${encodeURIComponent(q)}`);
  renderProgramCards(res.ok ? res.data.programs : []);
});
document.getElementById('program-search').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-program-search').click();
});
document.getElementById('btn-program-reset').addEventListener('click', () => {
  document.getElementById('program-search').value = '';
  renderProgramCards(_allPrograms);
});

// ── Admin (program CRUD) ──────────────────────────────────────
async function loadAdmin() {
  const res = await api('GET', '/api/programs');
  const list = res.ok ? res.data.programs : [];
  const el = document.getElementById('admin-programs-list');
  if (!list.length) { el.innerHTML = '<div class="empty">등록된 공고가 없습니다. 공고를 추가하세요.</div>'; return; }

  el.innerHTML = `<table class="admin-table">
    <thead><tr>
      <th>#</th><th>공고명</th><th>지원금액</th><th>마감일</th><th>기관</th><th>카테고리</th><th></th>
    </tr></thead>
    <tbody>${list.map(p => `<tr>
      <td style="color:#9ba8c0;font-size:12px">${p.id}</td>
      <td class="cell-title">${escHtml(p.title)}${p.link?` <a href="${escHtml(p.link)}" target="_blank" style="font-size:11px;color:#4a90e2">↗</a>`:''}</td>
      <td class="cell-amount">${escHtml(p.amount)}</td>
      <td class="cell-deadline">${p.deadline||'-'}</td>
      <td style="font-size:12px">${escHtml(p.ministry||'-')}</td>
      <td style="font-size:12px">${escHtml(p.category||'-')}</td>
      <td><div class="btn-row">
        <button class="btn-edit" onclick="openEditModal(${p.id})">수정</button>
        <button class="btn-del"  onclick="deleteProgram(${p.id})">삭제</button>
      </div></td>
    </tr>`).join('')}</tbody>
  </table>`;
}

// CSV import panel
document.getElementById('btn-show-import').addEventListener('click', () => {
  document.getElementById('import-panel').classList.toggle('hidden');
});
document.getElementById('btn-cancel-import').addEventListener('click', () => {
  document.getElementById('import-panel').classList.add('hidden');
  document.getElementById('csv-input').value = '';
  document.getElementById('import-result').textContent = '';
});
document.getElementById('btn-import-csv').addEventListener('click', async () => {
  const csv = document.getElementById('csv-input').value.trim();
  if (!csv) { toast('CSV를 입력하세요.', 'error'); return; }
  const res = await api('POST', '/api/admin/programs/import', { csv });
  const el  = document.getElementById('import-result');
  if (res.ok) {
    el.className = 'ok';
    el.textContent = `✓ ${res.data.imported}건 가져오기 완료${res.data.errors.length ? ' · 오류: ' + res.data.errors.join(', ') : ''}`;
    toast(`${res.data.imported}건 가져오기 완료`, 'success');
    loadAdmin();
  } else {
    el.className = 'err';
    el.textContent = '오류: ' + (res.data.error || '알 수 없는 오류');
    toast('가져오기 실패', 'error');
  }
});
document.getElementById('btn-dl-template').addEventListener('click', () => {
  window.location.href = '/api/admin/programs/template';
});
document.getElementById('btn-add-program').addEventListener('click', () => openAddModal());

async function deleteProgram(id) {
  if (!confirm('이 공고를 삭제하시겠습니까?')) return;
  const res = await api('DELETE', `/api/admin/programs/${id}`);
  if (res.ok) { toast('삭제 완료', 'success'); loadAdmin(); }
  else toast(res.data.error || '삭제 실패', 'error');
}

// ── Modal (add/edit) ──────────────────────────────────────────
let _editingId = null;

function openAddModal() {
  _editingId = null;
  document.getElementById('modal-title').textContent = '공고 추가';
  clearModalForm();
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function openEditModal(id) {
  _editingId = id;
  document.getElementById('modal-title').textContent = '공고 수정';
  api('GET', '/api/programs').then(res => {
    if (!res.ok) return;
    const p = res.data.programs.find(x => x.id === id);
    if (!p) return;
    document.getElementById('m-title').value       = p.title       || '';
    document.getElementById('m-amount').value      = p.amount      || '';
    document.getElementById('m-deadline').value    = p.deadline    || '';
    document.getElementById('m-ministry').value    = p.ministry    || '';
    document.getElementById('m-category').value    = p.category    || '';
    document.getElementById('m-region').value      = p.region      || '';
    document.getElementById('m-link').value        = p.link        || '';
    document.getElementById('m-keywords').value    = (p.keywords    || []).join(', ');
    document.getElementById('m-industries').value  = (p.industries  || ['전체']).join(', ');
    document.getElementById('m-companyTypes').value= (p.companyTypes|| ['전체']).join(', ');
    document.getElementById('m-minAge').value      = p.minAge != null ? p.minAge : '';
    document.getElementById('m-maxAge').value      = p.maxAge != null ? p.maxAge : '';
    document.getElementById('m-eligibility').value = p.eligibility  || '';
    document.getElementById('m-description').value = p.description  || '';
    document.getElementById('modal-overlay').classList.remove('hidden');
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  _editingId = null;
}
function clearModalForm() {
  ['m-title','m-amount','m-deadline','m-ministry','m-category','m-region',
   'm-link','m-keywords','m-industries','m-companyTypes','m-minAge','m-maxAge',
   'm-eligibility','m-description'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('m-industries').value  = '전체';
  document.getElementById('m-companyTypes').value = '전체';
}

document.getElementById('btn-modal-close').addEventListener('click', closeModal);
document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

document.getElementById('btn-modal-save').addEventListener('click', async () => {
  const title = document.getElementById('m-title').value.trim();
  if (!title) { toast('공고명은 필수입니다.', 'error'); return; }

  const body = {
    title,
    amount:       document.getElementById('m-amount').value.trim(),
    deadline:     document.getElementById('m-deadline').value,
    ministry:     document.getElementById('m-ministry').value.trim(),
    category:     document.getElementById('m-category').value.trim(),
    region:       document.getElementById('m-region').value.trim() || '전국',
    link:         document.getElementById('m-link').value.trim(),
    keywords:     document.getElementById('m-keywords').value.split(',').map(s=>s.trim()).filter(Boolean),
    industries:   document.getElementById('m-industries').value.split(',').map(s=>s.trim()).filter(Boolean),
    companyTypes: document.getElementById('m-companyTypes').value.split(',').map(s=>s.trim()).filter(Boolean),
    minAge:       document.getElementById('m-minAge').value !== '' ? Number(document.getElementById('m-minAge').value) : null,
    maxAge:       document.getElementById('m-maxAge').value !== '' ? Number(document.getElementById('m-maxAge').value) : null,
    eligibility:  document.getElementById('m-eligibility').value.trim(),
    description:  document.getElementById('m-description').value.trim()
  };

  const res = _editingId
    ? await api('PUT',  `/api/admin/programs/${_editingId}`, body)
    : await api('POST', '/api/admin/programs', body);

  if (res.ok) {
    toast(_editingId ? '수정 완료' : '추가 완료', 'success');
    closeModal();
    loadAdmin();
  } else {
    toast(res.data.error || '저장 실패', 'error');
  }
});

// ── Users ────────────────────────────────────────────────────
async function loadUsers() {
  const res = await api('GET', '/api/users');
  const users = res.ok ? res.data.users : [];
  const el = document.getElementById('users-list');
  if (!users.length) { el.innerHTML = '<div class="empty">등록된 사용자가 없습니다.</div>'; return; }
  el.innerHTML = `<table class="user-table">
    <thead><tr><th>이메일</th><th>키워드</th><th>업종</th><th>기업형태</th><th>업력</th><th>등록일</th><th></th></tr></thead>
    <tbody>${users.map(u => `<tr>
      <td>${escHtml(u.email)}</td>
      <td>${(u.keywords||[]).map(k=>`<span class="tag">${escHtml(k)}</span>`).join(' ')}</td>
      <td style="font-size:12px">${escHtml(u.industry||'-')}</td>
      <td style="font-size:12px">${escHtml(u.companyType||'-')}</td>
      <td style="font-size:12px">${u.age!=null?u.age+'년':'-'}</td>
      <td style="color:#9ba8c0;font-size:11px">${u.registeredAt?u.registeredAt.slice(0,10):'-'}</td>
      <td><button class="del-btn" onclick="deleteUser('${escHtml(u.email)}')">삭제</button></td>
    </tr>`).join('')}</tbody>
  </table>`;
}

document.getElementById('btn-register').addEventListener('click', async () => {
  const email    = document.getElementById('reg-email').value.trim();
  const keywords = document.getElementById('reg-keywords').value.split(',').map(k=>k.trim()).filter(Boolean);
  if (!email || !keywords.length) { toast('이메일과 키워드를 입력하세요.', 'error'); return; }
  const res = await api('POST', '/api/users/register', {
    email, keywords,
    industry:    document.getElementById('reg-industry').value,
    companyType: document.getElementById('reg-companyType').value,
    age:         document.getElementById('reg-age').value || null
  });
  if (res.ok) {
    toast(res.data.message, 'success');
    ['reg-email','reg-keywords','reg-age'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('reg-industry').value = '';
    document.getElementById('reg-companyType').value = '';
    loadUsers();
  } else toast(res.data.error || '오류', 'error');
});

document.getElementById('btn-unregister').addEventListener('click', async () => {
  const email = document.getElementById('unreg-email').value.trim();
  if (!email) { toast('이메일을 입력하세요.', 'error'); return; }
  if (!confirm(`${email} 수신을 거부하시겠습니까?`)) return;
  const res = await api('DELETE', '/api/users/unregister', { email });
  if (res.ok) { toast('수신 거부 완료', 'success'); document.getElementById('unreg-email').value = ''; loadUsers(); }
  else toast(res.data.error || '오류', 'error');
});

async function deleteUser(email) {
  if (!confirm(`${email} 을(를) 삭제하시겠습니까?`)) return;
  const res = await api('DELETE', '/api/users/unregister', { email });
  if (res.ok) { toast('삭제 완료', 'success'); loadUsers(); }
  else toast(res.data.error || '오류', 'error');
}

// ── Match ────────────────────────────────────────────────────
document.getElementById('btn-match').addEventListener('click', async () => {
  const email = document.getElementById('match-email').value.trim();
  if (!email) { toast('이메일을 입력하세요.', 'error'); return; }
  const res = await api('GET', `/api/match?email=${encodeURIComponent(email)}`);
  const el  = document.getElementById('match-result');
  el.classList.remove('hidden');
  if (!res.ok) { el.innerHTML = `<div class="card"><div class="empty">${escHtml(res.data.error)}</div></div>`; return; }

  const { keywords, industry, companyType, matched } = res.data;
  const tags = (keywords||[]).map(k=>`<span class="tag matched">${escHtml(k)}</span>`).join(' ');
  const meta = [industry&&`업종: ${industry}`, companyType&&`형태: ${companyType}`].filter(Boolean).join(' · ');

  el.innerHTML = `
    <div class="match-header">
      <div class="mh-email">${escHtml(email)}</div>
      <div class="mh-meta">${tags}${meta?`<span style="font-size:12px;color:#6b7a99;margin-left:6px">${escHtml(meta)}</span>`:''}</div>
    </div>
    ${matched.length
      ? `<div class="match-cards">${matched.map(p => {
          const reasons = (p.reasons||[]).join(' · ') || '키워드 매칭';
          return `<div class="program-card">
            <div class="p-title">${escHtml(p.title)}</div>
            <div class="p-amount">${escHtml(p.amount)}</div>
            <div class="p-meta">${escHtml(p.ministry||'')}</div>
            <div class="p-deadline">마감: ${p.deadline}</div>
            <div style="font-size:11px;background:#f0f4ff;padding:5px 8px;border-radius:4px;margin-top:8px;color:#4a5568">
              ${escHtml(reasons)} · 점수: ${p.score}
            </div>
            ${p.link?`<a href="${escHtml(p.link)}" target="_blank" style="font-size:11px;color:#4a90e2;margin-top:6px;display:block">공고 바로가기 →</a>`:''}
          </div>`;
        }).join('')}</div>`
      : '<div class="card"><div class="empty">매칭된 공고가 없습니다.</div></div>'
    }`;
});
document.getElementById('match-email').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-match').click();
});

// ── Documents ────────────────────────────────────────────────
async function loadDocumentForm() {
  const res = await api('GET', '/api/programs');
  const programs = res.ok ? res.data.programs : [];
  const sel = document.getElementById('doc-program');
  sel._programs = programs;
  sel.innerHTML = '<option value="">공고를 선택하세요</option>' +
    programs.map(p => `<option value="${p.id}">${escHtml(p.title)} (${escHtml(p.amount)})</option>`).join('');
}

document.getElementById('btn-doc-preview').addEventListener('click', async () => {
  const name   = document.getElementById('doc-company-name').value.trim();
  const progId = document.getElementById('doc-program').value;
  if (!name)   { toast('기업명을 입력하세요.', 'error'); return; }
  if (!progId) { toast('공고를 선택하세요.', 'error'); return; }

  const sel = document.getElementById('doc-program');
  const program = (sel._programs||[]).find(p => String(p.id) === progId);
  if (!program) { toast('공고 정보를 찾을 수 없습니다.', 'error'); return; }

  const company = {
    name:     name,
    industry: document.getElementById('doc-industry').value,
    size:     document.getElementById('doc-size').value,
    revenue:  document.getElementById('doc-revenue').value,
    age:      document.getElementById('doc-age').value,
    ceo:      document.getElementById('doc-ceo').value,
    need:     document.getElementById('doc-need').value,
    plan:     document.getElementById('doc-plan').value,
    expected: document.getElementById('doc-expected').value,
    budget:   document.getElementById('doc-budget').value
  };

  const res = await fetch('/api/documents/preview', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company, program })
  });
  if (!res.ok) { toast('생성 실패', 'error'); return; }
  const html = await res.text();
  const url  = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  window.open(url, '_blank');
  toast('새 탭에서 열렸습니다. Ctrl+P → PDF 저장', 'info');
});

// ── Email send ───────────────────────────────────────────────
document.getElementById('btn-send-now').addEventListener('click', async () => {
  const email = document.getElementById('send-email').value.trim();
  if (!email) { toast('이메일을 입력하세요.', 'error'); return; }
  toast('발송 중...', 'info');
  const res = await api('POST', '/api/send-now', { email });
  const el  = document.getElementById('send-result');
  if (res.ok && res.data.success) {
    toast('발송 완료!', 'success');
    el.innerHTML = `<div class="result-item result-ok">✓ ${escHtml(email)} 발송 성공 · ${res.data.matched.length}건 매칭</div>`;
  } else {
    const msg = res.data?.error || '발송 실패 (이메일 설정 확인)';
    toast(msg, 'error');
    el.innerHTML = `<div class="result-item result-fail">✗ ${escHtml(email)}: ${escHtml(msg)}</div>`;
  }
});

document.getElementById('btn-run-job').addEventListener('click', async () => {
  if (!confirm('모든 사용자에게 이메일을 발송합니다. 계속하시겠습니까?')) return;
  toast('전체 발송 시작...', 'info');
  const res = await api('POST', '/api/run-job');
  document.getElementById('send-result').innerHTML =
    `<div class="result-item result-ok">✓ ${escHtml(res.data.message)}</div>`;
});

// ── History ──────────────────────────────────────────────────
async function loadHistory() {
  const res = await api('GET', '/api/admin/history');
  const el  = document.getElementById('history-list');
  if (!res.ok) { el.innerHTML = '<div class="empty">이력을 불러올 수 없습니다.</div>'; return; }
  const list = res.data.history || [];
  if (!list.length) { el.innerHTML = '<div class="empty">발송 이력이 없습니다.</div>'; return; }

  el.innerHTML = `<table class="history-table">
    <thead><tr><th>발송 시각</th><th>이메일</th><th>매칭 수</th><th>상태</th><th>추천 공고</th></tr></thead>
    <tbody>${list.map(h => `<tr>
      <td style="white-space:nowrap">${h.sentAt.replace('T',' ').slice(0,19)}</td>
      <td>${escHtml(h.email)}</td>
      <td style="text-align:center">${h.matchCount}</td>
      <td>${h.success?'<span class="badge-ok">성공</span>':'<span class="badge-fail">실패</span>'}</td>
      <td style="color:#6b7a99">${(h.matched||[]).map(m=>escHtml(m.title)).join(', ')||'-'}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}

// ── Init ─────────────────────────────────────────────────────
loadDashboard();
loadPrograms();
