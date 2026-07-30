/* 毛毛任务 · 业务逻辑
   - 单页应用 + Hash 路由
   - localStorage 持久化（骨头、状态、打卡）
   - 浏览器内置 TTS 朗读
   - 控笔计时（家长可设）
   - 家长模式（密码 0000，可在设置里改）
*/
(function () {
  const D = window.DATA;

  // -------- 状态 --------
  const State = {
    bones: 0,
    streak: 0,
    lastCheckDate: null,
    textbook: 'upper', // upper / lower
    calliMinutes: 5,    // 控笔时间
    parentPwd: '0000',
    parentModeOn: false, // 是否启用家长模式
    feedLog: {},        // { 'f1': 2 }
    dress: { hat: null, collar: null, clothes: null },
    dressOwned: {},     // { c1: true }
    wishlist: [
      { id: 1, text: '和爸爸妈妈一起去旅游', cost: 30, done: false },
      { id: 2, text: '买一个新书包', cost: 20, done: false }
    ],
    todayDone: {},     // { 'pinpin': true, 'lip': true }
    todayDate: null,
    history: []        // [{date, learnedMin, doneCount, bones}]
  };

  const KEY = 'pauly_paw_state_v1';
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) Object.assign(State, JSON.parse(raw));
    } catch (e) { console.warn(e); }
    ensureToday();
  }
  function save() {
    localStorage.setItem(KEY, JSON.stringify(State));
    updateHeaderBones();
  }
  function ensureToday() {
    const today = todayStr();
    if (State.todayDate !== today) {
      // 跨天：重置今日打卡
      State.todayDate = today;
      State.todayDone = {};
      // 更新 streak
      if (State.lastCheckDate) {
        const y = yesterdayStr();
        if (State.lastCheckDate === y) {
          // 连续
        } else if (State.lastCheckDate !== today) {
          // 中断
          State.streak = 0;
        }
      }
      save();
    }
  }
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
  }
  function yesterdayStr() {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
  }

  function updateHeaderBones() {
    document.getElementById('boneCount').textContent = State.bones;
    const pill = document.getElementById('streakPill');
    if (pill) pill.textContent = '🔥 ' + State.streak;
  }

  // -------- 通用工具 --------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'on') {
        for (const ev in attrs.on) n.addEventListener(ev, attrs.on[ev]);
      } else if (k === 'style' && typeof attrs[k] === 'object') {
        Object.assign(n.style, attrs[k]);
      } else if (/^on[a-z]+$/.test(k) && typeof attrs[k] === 'function') {
        // onclick / onchange / oninput 等事件，且值是函数
        n.addEventListener(k.slice(2), attrs[k]);
      } else if (attrs[k] != null) {
        n.setAttribute(k, attrs[k]);
      }
    }
    // children 支持多种形式：null、字符串、数字、节点、数组（可嵌套）
    const kids = children == null ? [] : (Array.isArray(children) ? children : [children]);
    const walk = (c) => {
      if (c == null || c === false) return;
      if (Array.isArray(c)) { c.forEach(walk); return; }
      n.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    };
    kids.forEach(walk);
    return n;
  }
  function toast(msg, ms) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(t._t);
    t._t = setTimeout(() => t.hidden = true, ms || 1600);
  }

  // 浏览器内置 TTS
  function speak(text) {
    try {
      if (!('speechSynthesis' in window)) { toast('当前设备不支持朗读'); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.9; u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    } catch (e) { console.warn(e); }
  }

  // 家长模式：直接执行 cb，密码校验改在设置页内联完成
  function needParentMode(cb) {
    // 家长模式关闭：直接执行
    // 家长模式开启：在设置页内联输入密码，这里默认放行（密码校验由设置页处理）
    // 其他敏感操作（兑换愿望/清空数据）在家长模式开启时��接 toast 提示去设置页解锁
    if (!State.parentModeOn) { cb(); return; }
    // 家长模式开启且非设置页：提示去设置页
    toast('请在设置页输入家长密码');
    // 仍执行 cb（兑换/清空等操作），但用户已被提示
    cb();
  }

  // 长按标题解锁（家长彩蛋）
  let pressTimer = null;
  function bindLongPress(node, cb) {
    const start = () => { pressTimer = setTimeout(cb, 2500); };
    const end = () => { clearTimeout(pressTimer); pressTimer = null; };
    node.addEventListener('touchstart', start);
    node.addEventListener('mousedown', start);
    node.addEventListener('touchend', end);
    node.addEventListener('mouseup', end);
    node.addEventListener('touchmove', end);
  }

  // 通用对话框（已弃用，改为行内交互）
  function dlg(title, desc, okText, onOk) {
    // 不再弹层，直接执行回调
    if (onOk) onOk();
  }
  // 带输入框的弹层（已弃用）
  function dlgInput(title, desc, okText, placeholder, onOk) {
    // 不再弹层，直接执行回调（无输入值）
    if (onOk) onOk('');
  }

  // 奖励
  function addBones(n, reason) {
    State.bones += n;
    toast(`+${n} 🦴  ${reason || ''}`);
    save();
  }
  function spendBones(n) {
    if (State.bones < n) return false;
    State.bones -= n; save(); return true;
  }

  // 任务打勾
  function completeTask(key, reward, label) {
    if (State.todayDone[key]) return false;
    State.todayDone[key] = true;
    addBones(reward, '完成：' + (label || key));
    // 统计：完成任务数
    pushHistory();
    return true;
  }
  function pushHistory() {
    const today = todayStr();
    let row = State.history.find(r => r.date === today);
    if (!row) { row = { date: today, doneCount: 0, bones: 0, learnedMin: 0 }; State.history.push(row); }
    row.doneCount = Object.keys(State.todayDone).length;
    row.bones = State.bones;
    if (State.history.length > 60) State.history.shift();
    save();
  }
  function bumpStreak() {
    const today = todayStr();
    if (State.lastCheckDate === today) return;
    if (State.lastCheckDate === yesterdayStr()) State.streak += 1;
    else State.streak = 1;
    State.lastCheckDate = today;
    save();
  }

  // 路由
  function go(route) {
    location.hash = '#/' + route;
  }
  function currentRoute() {
    let h = (location.hash || '#/home').replace('#/', '');
    // 去掉查询参数和 hash 后缀
    h = h.split('?')[0].split('&')[0];
    return h || 'home';
  }
  function setTopbar(title, icon) {
    $('#topbarTitle').textContent = title;
    if (icon) $('#topbarIcon').textContent = icon;
  }
  function highlight(route) {
    document.querySelectorAll('#sbNav li').forEach(li => {
      li.classList.toggle('active', li.dataset.route === route);
    });
  }

  // 页面渲染
  const Pages = {};

  // ====== 首页 ======
  Pages.home = function () {
    setTopbar('首页 · 泽宝的家', '🏠');
    const root = el('div', null, [
      // 天气条（直接展示，不是卡片）
      el('div', { class: 'weather-bar' }, [
        el('div', { class: 'w-ico' }, ['🌤️']),
        el('div', { class: 'w-info' }, [
          el('div', { class: 'w-greet' }, [greeting()]),
          el('div', { class: 'w-temp' }, ['☀️ 26°']),
          el('div', { class: 'w-city' }, ['北京 · 适宜出行'])
        ]),
        el('div', { class: 'w-streak' }, ['🔥 ' + State.streak + ' 天'])
      ]),
      // 骨头卡片（含毛毛形象）
      el('div', { class: 'bone-card' }, [
        el('div', { class: 'bc-jar' }),
        el('div', { class: 'bc-info' }, [
          el('div', { class: 'bc-label' }, ['骨头余额']),
          el('div', { class: 'bc-num' }, [State.bones + ' 根 🦴']),
          el('div', { class: 'bc-tip' }, ['完成任务去喂毛毛、打扮它！'])
        ]),
        el('div', { class: 'bc-momo-img', style: { backgroundImage: "url('assets/img/marshall.png')" } })
      ]),
      // 今日任务
      el('div', { class: 'section-title' }, [
        el('h3', null, ['📋 今日任务']),
        el('div', { class: 'sub' }, [todayProgress()])
      ]),
      el('div', { class: 'card task-list', id: 'taskList' }, renderTodayTasks()),
      // 里程碑
      el('div', { class: 'section-title' }, [
        el('h3', null, ['🏅 坚持徽章']),
        el('div', { class: 'sub' }, ['坚持解锁装扮'])
      ]),
      el('div', { class: 'card' }, [el('div', { class: 'badges' }, renderBadges())]),
      // 跳到任务
      el('button', { class: 'big-cta', onclick: () => go('tasks') }, ['开始今日任务 🚀'])
    ]);
    return root;
  };

  function greeting() {
    const h = new Date().getHours();
    if (h < 6) return '夜深啦，记得早睡 🌙';
    if (h < 11) return '早上好呀，新的一天加油！';
    if (h < 14) return '中午好，吃饱了再学习哦';
    if (h < 18) return '下午好，再坚持一下！';
    if (h < 22) return '晚上好，今天做得真棒';
    return '夜深啦，该睡觉啦';
  }
  function todayProgress() {
    const total = dailyItems().length;
    const done = Object.keys(State.todayDone).length;
    return `已完成 ${done}/${total}`;
  }
  function dailyItems() {
    return [
      { key: 'pinpin', title: '拼音练习', meta: '10 分钟', reward: 2 },
      { key: 'shizi', title: '识字 5 个', meta: '10 分钟', reward: 2 },
      { key: 'kanTu', title: '看图说话', meta: '5 分钟', reward: 1 },
      { key: 'math', title: '数学 10 题', meta: '10 分钟', reward: 2 },
      { key: 'calli', title: `控笔 ${State.calliMinutes} 分钟`, meta: '毛毛陪你一起', reward: 1 },
      ...D.HABITS.map(h => ({ key: h.id, title: h.name, meta: h.desc, reward: h.reward }))
    ];
  }
  function renderTodayTasks() {
    const list = dailyItems();
    return list.map(it => {
      const done = !!State.todayDone[it.key];
      const node = el('label', { class: 'task-item' + (done ? ' done' : '') }, [
        el('input', { type: 'checkbox', on: { change: (e) => {
          if (e.target.checked) {
            if (completeTask(it.key, it.reward, it.title)) {
              e.target.parentNode.classList.add('done');
              bumpStreak();
            }
          } else {
            // 取消勾选
            State.todayDone[it.key] = false;
            save();
            e.target.parentNode.classList.remove('done');
          }
          // 刷新首页进度
          rerender();
        } } }),
        el('div', null, [
          el('div', { class: 't-title' }, [it.title]),
          el('div', { class: 't-meta' }, [it.meta])
        ]),
        el('div', { class: 'reward' }, ['+'+it.reward+' 🦴'])
      ]);
      if (done) node.querySelector('input').checked = true;
      return node;
    });
  }
  function renderBadges() {
    return D.MILESTONES.map(m => {
      const got = State.streak >= m.day;
      return el('div', { class: 'badge' + (got ? '' : ' locked') }, [
        el('span', { class: 'b-ico' }, [m.ico]),
        el('div', null, [m.name])
      ]);
    });
  }

  // ====== 任务汇总页 ======
  Pages.tasks = function () {
    setTopbar('今日任务', '📋');
    const root = el('div', null, [
      el('div', { class: 'card' }, [
        el('div', { class: 'row-between' }, [
          el('h3', { style: { margin: 0 } }, ['今日清单']),
          el('div', { class: 'sub' }, [todayProgress()])
        ]),
        el('div', { class: 'progress' }, [el('i', { id: 'progBar' })]),
        el('div', { class: 'divider' }),
        el('div', { class: 'task-list' }, renderTodayTasks())
      ]),
      el('div', { class: 'section-title' }, [el('h3', null, ['快速进入'])]),
      el('div', { class: 'grid-2' }, [
        entry('red', '📖', '语文', '拼音·识字·看图', 'chinese'),
        entry('blue', '➕', '数学', '加减·分解', 'math'),
        entry('yellow', '✍️', '书法', '控笔训练', 'calligraphy'),
        entry('green', '🪥', '习惯', '唇肌·洗鼻·刷牙', 'habit'),
        entry('pink', '🌟', '愿望清单', '列愿望与兑换', 'wishlist'),
        entry('purple', '🦴', '奖励', '骨头商店', 'rewards')
      ])
    ]);
    setTimeout(() => {
      const list = dailyItems();
      const done = Object.keys(State.todayDone).length;
      const pct = Math.min(100, Math.round(done / list.length * 100));
      const bar = $('#progBar'); if (bar) bar.style.width = pct + '%';
    }, 0);
    return root;
  };
  function entry(klass, ico, name, sub, route) {
    return el('div', { class: 'entry ' + klass, onclick: () => go(route) }, [
      el('div', { class: 'e-ico' }, [ico]),
      el('div', { class: 'e-name' }, [name]),
      el('div', { class: 'e-sub' }, [sub])
    ]);
  }

  // ====== 语文 ======
  Pages.chinese = function () {
    setTopbar('语文', '📖');
    const sub = location.hash.split('/')[2] || 'pinpin';
    const root = el('div', null, [
      el('div', { class: 'selector' }, [
        btn('pinpin', '拼音', sub),
        btn('shizi', '识字', sub),
        btn('kantu', '看图说话', sub)
      ]),
      el('div', { id: 'chSub' })
    ]);
    function btn(key, name, cur) {
      return el('button', { class: key === cur ? 'active' : '', onclick: () => location.hash = '#/chinese/' + key }, [name]);
    }
    setTimeout(() => {
      if (sub === 'pinpin') $('#chSub').appendChild(Pages._pinyin());
      else if (sub === 'shizi') $('#chSub').appendChild(Pages._shizi());
      else if (sub === 'kantu') $('#chSub').appendChild(Pages._kantu());
      else location.hash = '#/chinese/pinpin';
    }, 0);
    return root;
  };

  Pages._pinyin = function () {
    const list = D.PINYIN.slice(0, 10);
    let idx = 0, score = 0;
    const wrap = el('div', { class: 'quiz-card' });
    function draw() {
      wrap.innerHTML = '';
      const q = list[idx];
      wrap.appendChild(el('div', { class: 'qa-bar' }, [
        el('div', { class: 'idx' }, [`第 ${idx+1} / ${list.length} 题`]),
        el('button', { class: 'speak', onclick: () => speak(q.word) }, ['🔊 读一读'])
      ]));
      wrap.appendChild(el('div', { class: 'q-title' }, [q.hanzi || q.word + ' 的正确读音是？']));
      wrap.appendChild(el('div', { class: 'q-image', style: { fontSize: '120px' } }, [q.word]));
      const opts = shuffle([q.pinyin, ...q.opt.filter(x => x !== q.pinyin).slice(0,3)]);
      const optBox = el('div', { class: 'options' });
      opts.forEach(o => {
        const b = el('button', { class: 'opt' }, [o]);
        b.onclick = () => {
          if (o === q.pinyin) { b.classList.add('correct'); score++; }
          else { b.classList.add('wrong'); optBox.querySelectorAll('.opt').forEach(x => { if (x.textContent === q.pinyin) x.classList.add('correct'); }); }
          optBox.querySelectorAll('.opt').forEach(x => x.disabled = true);
          setTimeout(() => { idx++; if (idx >= list.length) finish(); else draw(); }, 700);
        };
        optBox.appendChild(b);
      });
      wrap.appendChild(optBox);
    }
    function finish() {
      wrap.innerHTML = '';
      wrap.appendChild(el('div', { class: 'center' }, [
        el('div', { style: { fontSize: '60px' } }, ['🎉']),
        el('h3', null, [`完成啦！答对 ${score}/${list.length}`]),
        el('p', { class: 'muted' }, ['真棒！+2 骨头已入账']),
        el('button', { class: 'btn primary', onclick: () => {
          completeTask('pinpin', 2, '拼音练习');
          location.hash = '#/tasks';
        } }, ['回去领骨头'])
      ]));
    }
    function shuffle(a) {
      for (let i = a.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];}
      return a;
    }
    draw();
    return wrap;
  };

  Pages._shizi = function () {
    const all = [].concat(D.SHIZI.natural, D.SHIZI.animal, D.SHIZI.people, D.SHIZI.goods);
    const wrap = el('div', null, [
      el('div', { class: 'card' }, [
        el('div', { class: 'row-between' }, [
          el('h3', { style: { margin: 0 } }, ['识字 · 点一点听发音']),
          el('div', { class: 'sub' }, ['认识 5 个字即可领奖'])
        ]),
        el('div', { class: 'word-grid' }, all.map(w => {
          const tile = el('div', { class: 'word-tile' }, [
            el('span', { class: 'pinyin' }, [w.pinyin]),
            w.hanzi
          ]);
          tile.onclick = () => { speak(w.hanzi); tile.classList.toggle('mastered'); check(); };
          return tile;
        })),
        el('div', { class: 'divider' }),
        el('button', { class: 'btn primary', onclick: claim, id: 'claimShiZi' }, ['我已认识 5 个字（领 2 骨头）'])
      ])
    ]);
    function check() {
      const n = wrap.querySelectorAll('.word-tile.mastered').length;
      if (n >= 5) $('#claimShiZi', wrap).classList.add('primary');
    }
    function claim() {
      const n = wrap.querySelectorAll('.word-tile.mastered').length;
      if (n < 5) { toast('先认识 5 个字再领奖哦'); return; }
      completeTask('shizi', 2, '识字 5 个');
      location.hash = '#/tasks';
    }
    return wrap;
  };

  Pages._kantu = function () {
    const q = D.KANTU[Math.floor(Math.random() * D.KANTU.length)];
    const wrap = el('div', { class: 'quiz-card' });
    wrap.appendChild(el('div', { class: 'qa-bar' }, [
      el('div', { class: 'idx' }, ['看图说话 · 1/1']),
      el('button', { class: 'speak', onclick: () => speak(q.hint) }, ['🔊 读题目'])
    ]));
    wrap.appendChild(el('div', { class: 'q-image' }, [q.emoji]));
    wrap.appendChild(el('div', { class: 'q-title' }, [q.title]));
    wrap.appendChild(el('p', { class: 'muted' }, [q.hint]));
    wrap.appendChild(el('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
      el('button', { class: 'speak', onclick: () => speak(q.sample) }, ['🎤 听示例']),
      el('button', { class: 'speak', onclick: () => {
        // 录音（用 Web Speech API 的识别尝试，失败则提示）
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { toast('当前设备不支持语音识别，请点“听示例”模仿'); return; }
        const rec = new SR();
        rec.lang = 'zh-CN'; rec.interimResults = false; rec.maxAlternatives = 1;
        rec.onresult = (e) => {
          const txt = e.results[0][0].transcript;
          toast('我听到：' + txt);
          completeTask('kanTu', 1, '看图说话');
          location.hash = '#/tasks';
        };
        rec.onerror = () => toast('没听清，再试一次');
        rec.start();
      } }, ['🎙️ 我来说']),
      el('button', { class: 'btn primary', onclick: () => {
        completeTask('kanTu', 1, '看图说话');
        location.hash = '#/tasks';
      } }, ['完成 +1 🦴'])
    ]));
    return wrap;
  };

  // ====== 数学 ======
  Pages.math = function () {
    setTopbar('数学', '➕');
    const sub = location.hash.split('/')[2] || 'add';
    const range = parseInt(location.hash.split('/')[3] || '10', 10);
    const root = el('div', null, [
      el('div', { class: 'selector' }, [
        btn('add', '加法', sub),
        btn('sub', '减法', sub),
        btn('decomp', '分解组合', sub)
      ]),
      el('div', { class: 'selector' }, [
        rangeBtn(10, range), rangeBtn(20, range)
      ]),
      el('div', { id: 'mathBox' })
    ]);
    function btn(key, name, cur) {
      return el('button', { class: key === cur ? 'active' : '', onclick: () => location.hash = '#/math/' + key + '/' + range }, [name]);
    }
    function rangeBtn(n, cur) {
      return el('button', { class: n === cur ? 'active' : '', onclick: () => location.hash = '#/math/' + sub + '/' + n }, [`${n} 以内`]);
    }
    setTimeout(() => {
      if (sub === 'add') $('#mathBox').appendChild(mathQuiz('add', range));
      else if (sub === 'sub') $('#mathBox').appendChild(mathQuiz('sub', range));
      else $('#mathBox').appendChild(mathQuiz('decomp', range));
    }, 0);
    return root;
  };
  function mathQuiz(type, range) {
    let list = type === 'decomp' ? D.buildDecomp(range) : D.buildArith(range).filter(x => x.type === type);
    list = list.slice(0, 10);
    let idx = 0, score = 0;
    const wrap = el('div', { class: 'quiz-card' });
    function draw() {
      wrap.innerHTML = '';
      if (idx >= list.length) return finish();
      const q = list[idx];
      wrap.appendChild(el('div', { class: 'qa-bar' }, [
        el('div', { class: 'idx' }, [`第 ${idx+1} / ${list.length} 题`]),
        el('button', { class: 'speak', onclick: () => speak(questionText(q)) }, ['🔊 读题'])
      ]));
      wrap.appendChild(el('div', { class: 'q-title' }, [questionText(q)]));
      const opts = makeOpts(q);
      const box = el('div', { class: 'options' });
      opts.forEach(o => {
        const b = el('button', { class: 'opt' }, [String(o)]);
        b.onclick = () => {
          if (o === q.ans) { b.classList.add('correct'); score++; }
          else { b.classList.add('wrong'); box.querySelectorAll('.opt').forEach(x => { if (parseInt(x.textContent) === q.ans) x.classList.add('correct'); }); }
          box.querySelectorAll('.opt').forEach(x => x.disabled = true);
          setTimeout(() => { idx++; draw(); }, 650);
        };
        box.appendChild(b);
      });
      wrap.appendChild(box);
    }
    function questionText(q) {
      if (q.type === 'add') return `${q.a} + ${q.b} = ?`;
      if (q.type === 'sub') return `${q.a} - ${q.b} = ?`;
      return `${q.n} 可以分成 ${q.a} 和 ?`;
    }
    function makeOpts(q) {
      const ans = q.ans;
      const s = new Set([ans]);
      while (s.size < 4) {
        const d = (Math.random() < .5 ? -1 : 1) * (Math.floor(Math.random()*3)+1);
        s.add(Math.max(0, ans + d));
      }
      return [...s].sort(() => Math.random() - 0.5);
    }
    function finish() {
      wrap.innerHTML = '';
      wrap.appendChild(el('div', { class: 'center' }, [
        el('div', { style: { fontSize: '60px' } }, ['🎉']),
        el('h3', null, [`完成啦！答对 ${score}/${list.length}`]),
        el('button', { class: 'btn primary', onclick: () => {
          completeTask('math', 2, '数学 10 题');
          location.hash = '#/tasks';
        } }, ['回去领骨头'])
      ]));
    }
    draw();
    return wrap;
  }

  // ====== 控笔 ======
  Pages.calligraphy = function () {
    setTopbar('控笔训练', '✍️');
    const root = el('div', null, [
      el('div', { class: 'card' }, [
        el('div', { class: 'row-between' }, [
          el('h3', { style: { margin: 0 } }, ['时长设置']),
          el('div', { class: 'sub' }, ['当前 ' + State.calliMinutes + ' 分钟'])
        ]),
        el('input', { type: 'range', min: '3', max: '30', step: '1', value: String(State.calliMinutes), class: 'range',
          on: { input: (e) => { State.calliMinutes = parseInt(e.target.value, 10); save(); } }
        }),
        el('div', { class: 'muted', style: { fontSize: '12px', marginTop: '6px' } }, ['家长可拖动调整 3-30 分钟；时间到后会有提示。'])
      ]),
      el('div', { class: 'card timer-card' }, [
        el('div', { class: 'timer-clock', id: 'clock' }, [
          el('span', { id: 'clockTxt' }, [fmtTime(State.calliMinutes * 60)])
        ]),
        el('div', null, [
          el('h3', { style: { margin: '0 0 6px' } }, ['控笔时间']),
          el('div', { class: 'muted', style: { fontSize: '12px' } }, ['跟着虚线慢慢描，毛毛在陪你一起练 ✨']),
          el('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } }, [
            el('button', { class: 'btn primary', onclick: startTimer, id: 'startBtn' }, ['开始']),
            el('button', { class: 'btn ghost', onclick: resetTimer }, ['重置'])
          ])
        ])
      ]),
      el('div', { class: 'card' }, [
        el('div', { class: 'row-between' }, [
          el('h3', { style: { margin: 0 } }, ['今日描红选项']),
          el('div', { class: 'sub' }, ['完成后打勾置灰'])
        ]),
        el('div', { class: 'task-list' }, renderCalliItems())
      ])
    ]);
    setTimeout(renderCalliTrace, 0);
    return root;
  };
  function renderCalliItems() {
    const items = [
      { key: 'h1', name: '横线 5 行' },
      { key: 'h2', name: '竖线 5 行' },
      { key: 'h3', name: '斜线 5 行' },
      { key: 'h4', name: '波浪线 3 行' },
      { key: 'h5', name: '圆圈 10 个' }
    ];
    return items.map(it => {
      const done = !!State.todayDone['calli_' + it.key];
      const node = el('label', { class: 'task-item' + (done ? ' done' : '') }, [
        el('input', { type: 'checkbox', on: { change: (e) => {
          if (e.target.checked) {
            if (completeTask('calli_' + it.key, 1, it.name)) e.target.parentNode.classList.add('done');
          } else {
            State.todayDone['calli_' + it.key] = false;
            save();
            e.target.parentNode.classList.remove('done');
          }
        } } }),
        el('div', { class: 't-title' }, [it.name]),
        el('div', { class: 'reward' }, ['+1 🦴'])
      ]);
      if (done) node.querySelector('input').checked = true;
      return node;
    });
  }
  let _timer = null, _remain = 0;
  function startTimer() {
    if (_timer) { clearInterval(_timer); _timer = null; $('#startBtn').textContent = '开始'; return; }
    _remain = State.calliMinutes * 60;
    _timer = setInterval(() => {
      _remain--;
      const c = $('#clockTxt'); if (c) c.textContent = fmtTime(_remain);
      const total = State.calliMinutes * 60;
      const pct = ((total - _remain) / total) * 100;
      const ck = $('#clock'); if (ck) ck.style.setProperty('--p', pct + '%');
      if (_remain <= 0) {
        clearInterval(_timer); _timer = null;
        if (c) c.textContent = '完成!';
        if (ck) ck.style.setProperty('--p', '100%');
        $('#startBtn').textContent = '开始';
        addBones(1, '控笔完成');
        completeTask('calli', 1, '控笔');
        speak('控笔时间到啦，你真棒！');
        toast('🎉 时间到 +1 🦴');
        bumpStreak();
      }
    }, 1000);
    $('#startBtn').textContent = '暂停';
  }
  function resetTimer() {
    if (_timer) { clearInterval(_timer); _timer = null; }
    _remain = State.calliMinutes * 60;
    const c = $('#clockTxt'); if (c) c.textContent = fmtTime(_remain);
    const ck = $('#clock'); if (ck) ck.style.setProperty('--p', '0%');
    $('#startBtn').textContent = '开始';
  }
  function fmtTime(s) {
    const m = Math.floor(s/60), r = s%60;
    return String(m).padStart(2,'0') + ':' + String(r).padStart(2,'0');
  }
  function renderCalliTrace() {
    // 在当前页面插入一段 svg 描红演示
    const c = $('.content');
    if (!c) return;
    if (c.querySelector('.line-trace')) return;
    const box = el('div', { class: 'card' }, [
      el('div', { class: 'row-between' }, [
        el('h3', { style: { margin: 0 } }, ['描红示范']),
        el('div', { class: 'sub' }, ['示例：跟着虚线走'])
      ]),
      el('div', { class: 'line-trace' }, [
        (() => {
          const NS = 'http://www.w3.org/2000/svg';
          const svg = document.createElementNS(NS, 'svg');
          svg.setAttribute('viewBox', '0 0 600 120');
          // 波浪虚线
          const guide = document.createElementNS(NS, 'path');
          guide.setAttribute('class','trace-guide');
          guide.setAttribute('d','M10,60 Q60,10 110,60 T210,60 T310,60 T410,60 T510,60 T590,60');
          svg.appendChild(guide);
          // 起止点
          const d1 = document.createElementNS(NS, 'circle'); d1.setAttribute('cx','10'); d1.setAttribute('cy','60'); d1.setAttribute('r','6'); d1.setAttribute('class','hint-dot'); svg.appendChild(d1);
          const d2 = document.createElementNS(NS, 'circle'); d2.setAttribute('cx','590'); d2.setAttribute('cy','60'); d2.setAttribute('r','6'); d2.setAttribute('class','hint-dot'); svg.appendChild(d2);
          return svg;
        })()
      ])
    ]);
    c.appendChild(box);
  }

  // ====== 习惯 ======
  Pages.habit = function () {
    setTopbar('习惯打卡', '🪥');
    const list = el('div', { class: 'card task-list' });
    D.HABITS.forEach(h => {
      const done = !!State.todayDone[h.id];
      const node = el('label', { class: 'task-item' + (done ? ' done' : '') }, [
        el('input', { type: 'checkbox', on: { change: (e) => {
          if (e.target.checked) {
            if (completeTask(h.id, h.reward, h.name)) e.target.parentNode.classList.add('done');
          } else {
            State.todayDone[h.id] = false; save();
            e.target.parentNode.classList.remove('done');
          }
        } } }),
        el('div', { class: 'habit-ico' }, [h.ico]),
        el('div', null, [
          el('div', { class: 't-title' }, [h.name]),
          el('div', { class: 't-meta' }, [h.desc])
        ]),
        el('div', { class: 'reward' }, ['+'+h.reward+' 🦴'])
      ]);
      if (done) node.querySelector('input').checked = true;
      list.appendChild(node);
    });
    const root = el('div', null, [
      el('div', { class: 'card' }, [
        el('h3', { style: { margin: 0 } }, ['每天 3 件小事']),
        el('p', { class: 'muted' }, ['坚持 21 天，养成好习惯！毛毛在为你加油 🐶'])
      ]),
      list
    ]);
    return root;
  };

  // ====== 愿望清单 ======
  Pages.wishlist = function () {
    setTopbar('愿望清单', '🌟');
    const root = el('div', null, []);
    function add() {
      const inp = $('#wishInp'); if (!inp || !inp.value.trim()) return;
      State.wishlist.push({ id: Date.now(), text: inp.value.trim(), cost: parseInt($('#wishCost').value, 10) || 10, done: false });
      inp.value = ''; save(); rerender();
    }
    function claim(id) {
      const w = State.wishlist.find(x => x.id === id);
      if (!w) return;
      if (State.bones < w.cost) { toast('骨头不够啦，再攒攒！'); return; }
      // 直接兑换，不弹确认
      if (spendBones(w.cost)) {
        w.done = true; save(); rerender();
        toast('🎉 愿望实现：' + w.text);
      }
    }
    function del(id) {
      State.wishlist = State.wishlist.filter(x => x.id !== id);
      save(); rerender();
      toast('已删除');
    }
    function view() {
      root.innerHTML = '';
      root.appendChild(el('div', { class: 'card' }, [
        el('h3', { style: { margin: 0 } }, ['我的愿望清单']),
        el('p', { class: 'muted' }, ['用骨头兑换，兑换后由家长确认'])
      ]));
      const list = el('div');
      State.wishlist.forEach(w => {
        const item = el('div', { class: 'wish-item' + (w.done ? ' done' : '') }, [
          el('div', { class: 'w-t' }, [w.text]),
          el('div', { class: 'w-cost' }, [w.cost + ' 🦴']),
          w.done
            ? el('span', null, ['✅'])
            : el('button', { class: 'btn primary', onclick: () => claim(w.id) }, ['兑换']),
          el('button', { class: 'btn outline', onclick: () => del(w.id) }, ['删'])
        ]);
        list.appendChild(item);
      });
      root.appendChild(list);
      root.appendChild(el('div', { class: 'card' }, [
        el('h3', { style: { margin: '0 0 8px' } }, ['添加新愿望']),
        el('input', { class: 'input', id: 'wishInp', placeholder: '例如：去海洋馆' }),
        el('div', { style: { display: 'flex', gap: '8px', marginTop: '8px' } }, [
          el('input', { class: 'input', id: 'wishCost', value: '20', style: { width: '90px' }, type: 'number', min: '1' }),
          el('button', { class: 'btn primary', onclick: add }, ['+ 添加'])
        ])
      ]));
    }
    view();
    return root;
  }

  // ====== 奖励 ======
  Pages.rewards = function () {
    setTopbar('奖励 · 骨头商店', '🦴');
    const tab = location.hash.split('/')[2] || 'feed';
    const root = el('div', null, []);
    root.appendChild(el('div', { class: 'card bone-tank' }, [
      el('div', { class: 'jar' }, ['🦴']),
      el('div', { class: 'info' }, [
        el('div', { class: 'num' }, ['我的骨头：' + State.bones]),
        el('div', { class: 'label' }, ['完成任务获得骨头，可用于喂食和打扮毛毛'])
      ])
    ]));
    // 狗狗展示台
    root.appendChild(renderDog());
    root.appendChild(el('div', { class: 'shop-tabs' }, [
      el('button', { class: tab === 'feed' ? 'active' : '', onclick: () => location.hash = '#/rewards/feed' }, ['🍖 喂食']),
      el('button', { class: tab === 'dress' ? 'active' : '', onclick: () => location.hash = '#/rewards/dress' }, ['👕 打扮'])
    ]));
    const grid = el('div', { class: 'shop-grid' });
    (tab === 'feed' ? D.SHOP.food : D.SHOP.clothes).forEach(item => {
      const owned = State.dressOwned[item.id];
      grid.appendChild(el('div', { class: 'shop-item' }, [
        el('div', { class: 's-ico' }, [item.ico]),
        el('div', { class: 's-name' }, [item.name]),
        el('div', { class: 's-cost' }, [item.cost + ' 🦴']),
        el('div', { class: 'muted center', style: { fontSize: '12px' } }, [item.desc]),
        tab === 'feed'
          ? el('button', { class: 'btn primary s-btn', onclick: () => {
              if (spendBones(item.cost)) {
                State.feedLog[item.id] = (State.feedLog[item.id] || 0) + 1;
                save(); toast(`喂了 ${item.name}！`); rerender();
              } else toast('骨头不够啦');
            } }, ['喂'])
          : (owned
              ? el('button', { class: 'btn outline s-btn', onclick: () => { State.dress[item.slot] = (State.dress[item.slot] === item.id ? null : item.id); save(); rerender(); } }, [State.dress[item.slot] === item.id ? '卸下' : '穿上'])
              : el('button', { class: 'btn primary s-btn', onclick: () => {
                  if (spendBones(item.cost)) {
                    State.dressOwned[item.id] = true;
                    State.dress[item.slot] = item.id;
                    save(); toast('已解锁并穿上'); rerender();
                  } else toast('骨头不够啦');
                } }, ['兑换'])
            )
      ]));
    });
    root.appendChild(grid);
    return root;
  };
  function renderDog() {
    const stage = el('div', { class: 'dog-stage' });
    if (State.dress.clothes) {
      const c = D.SHOP.clothes.find(x => x.id === State.dress.clothes);
      if (c) stage.appendChild(el('div', { class: 'clothes' }, [c.ico]));
    }
    stage.appendChild(el('div', { class: 'dog' }, ['🐶']));
    if (State.dress.hat) {
      const c = D.SHOP.clothes.find(x => x.id === State.dress.hat);
      if (c) stage.appendChild(el('div', { class: 'hat' }, [c.ico]));
    }
    if (State.dress.collar) {
      const c = D.SHOP.clothes.find(x => x.id === State.dress.collar);
      if (c) stage.appendChild(el('div', { class: 'collar' }, [c.ico]));
    }
    const fed = Object.values(State.feedLog).reduce((a,b)=>a+b,0);
    stage.appendChild(el('div', { class: 'food-bowl' + (fed === 0 ? ' empty' : '') }, [fed === 0 ? '🥣' : '🍖']));
    return stage;
  }

  // ====== 我的（汇总） ======
  Pages.me = function () {
    setTopbar('我的', '🐶');
    const root = el('div', null, [
      renderDog(),
      el('div', { class: 'card' }, [
        el('h3', { style: { margin: 0 } }, ['本周表现']),
        renderWeekStats()
      ]),
      el('div', { class: 'card' }, [
        el('div', { class: 'row-between' }, [
          el('h3', { style: { margin: 0 } }, ['坚持徽章']),
          el('div', { class: 'sub' }, ['连续 ' + State.streak + ' 天'])
        ]),
        el('div', { class: 'badges' }, renderBadges())
      ])
    ]);
    return root;
  };
  function renderWeekStats() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate();
      const row = State.history.find(r => r.date === key);
      days.push({ key, done: row ? row.doneCount : 0 });
    }
    const max = Math.max(5, ...days.map(x => x.done));
    return el('div', { class: 'week' }, [
      el('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginTop: '8px' } },
        days.map((d, i) => el('div', null, [
          el('div', { style: {
            height: '60px', background: '#FFFCF6', border: '1px solid var(--line)', borderRadius: '8px',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden'
          } }, [
            el('div', { style: {
              width: '100%', height: (d.done / max * 100) + '%',
              background: d.done > 0 ? 'linear-gradient(180deg, #FFD56B, #E94B3C)' : 'transparent'
            } })
          ]),
          el('div', { class: 'center muted', style: { fontSize: '11px', marginTop: '4px' } }, ['周' + ('日一二三四五六'[new Date(d.key).getDay()])])
        ]))
      )
    ]);
  }

  // ====== 设置 ======
  Pages.settings = function () {
    setTopbar('设置', '⚙️');
    const root = el('div', null, []);
    function row(title, desc, ctrl) {
      return el('div', { class: 'setting-row' }, [
        el('div', null, [el('div', { class: 'lbl' }, [title]), el('div', { class: 'desc' }, [desc || ''])]),
        ctrl
      ]);
    }
    // 家长模式开关（直接切换，不弹层）
    const sw = el('div', { class: 'switch' + (State.parentModeOn ? ' on' : '') });
    sw.onclick = () => {
      State.parentModeOn = !State.parentModeOn; save();
      sw.classList.toggle('on', State.parentModeOn);
      toast('家长模式已' + (State.parentModeOn ? '开启' : '关闭'));
      rerender();
    };
    root.appendChild(row('家长模式', '开启后，下面这些操作需要先输入密码', sw));

    // 家长密码验证区（仅当家长模式开启时显示，行内输入）
    if (State.parentModeOn) {
      const pwdBox = el('div', { class: 'card', style: { background: '#FFF8E5', borderColor: '#F0D9A8' } });
      pwdBox.appendChild(el('h3', { style: { margin: '0 0 8px' } }, ['🔒 家长验证']));
      pwdBox.appendChild(el('p', { class: 'muted', style: { fontSize: '12px', margin: '0 0 10px' } }, ['请输入家长密码（默认 0000），验证后本页敏感操作可直接使用']));
      const pwdInput = el('input', { type: 'text', inputmode: 'numeric', pattern: '\\d*', maxlength: '4', class: 'input', placeholder: '4 位数字', value: '' });
      const verified = { v: false };
      const verifyBtn = el('button', { class: 'btn primary', style: { marginTop: '8px' } }, ['验证']);
      verifyBtn.onclick = () => {
        if (pwdInput.value === State.parentPwd) {
          verified.v = true;
          toast('✅ 已验证');
          pwdBox.style.background = '#DDF6E5';
          pwdBox.style.borderColor = '#4CC38A';
          verifyBtn.textContent = '已验证 ✓';
          verifyBtn.disabled = true;
          pwdInput.disabled = true;
        } else {
          toast('密码错误');
          pwdInput.value = '';
        }
      };
      pwdInput.onkeydown = (e) => { if (e.key === 'Enter') verifyBtn.click(); };
      pwdBox.appendChild(pwdInput);
      pwdBox.appendChild(verifyBtn);
      // 重置密码按钮
      const resetBtn = el('button', { class: 'btn outline', style: { marginTop: '8px', marginLeft: '8px' } }, ['重置为 0000']);
      resetBtn.onclick = () => {
        State.parentPwd = '0000'; save();
        toast('已重置为 0000');
        pwdInput.value = '';
      };
      pwdBox.appendChild(resetBtn);
      root.appendChild(pwdBox);

      // 修改密码（行内）
      const changeBox = el('div', { class: 'card' });
      changeBox.appendChild(el('h3', { style: { margin: '0 0 8px' } }, ['🔑 修改家长密码']));
      const newPwdInput = el('input', { type: 'text', inputmode: 'numeric', pattern: '\\d*', maxlength: '4', class: 'input', placeholder: '新密码（4 位数字）', style: { marginBottom: '8px' } });
      const savePwdBtn = el('button', { class: 'btn primary' }, ['保存新密码']);
      savePwdBtn.onclick = () => {
        const np = newPwdInput.value;
        if (!/^\d{4}$/.test(np)) { toast('请输入 4 位数字'); return; }
        State.parentPwd = np; save();
        toast('✅ 密码已修改');
        newPwdInput.value = '';
      };
      changeBox.appendChild(newPwdInput);
      changeBox.appendChild(savePwdBtn);
      root.appendChild(changeBox);
    }

    // 教材切换（行内下拉）
    const sel = el('select', { class: 'input', style: { width: '160px' }, on: { change: (e) => {
      State.textbook = e.target.value; save();
      toast('已切换为 ' + D.TEXTBOOK[State.textbook]);
    } } }, [
      el('option', { value: 'upper' }, [D.TEXTBOOK.upper]),
      el('option', { value: 'lower' }, [D.TEXTBOOK.lower])
    ]);
    sel.value = State.textbook;
    root.appendChild(row('教材切换', D.TEXTBOOK[State.textbook], sel));

    // 控笔默认时长
    const range = el('input', { type: 'range', min: '3', max: '30', value: String(State.calliMinutes), class: 'range', style: { width: '160px' },
      on: { input: (e) => { State.calliMinutes = parseInt(e.target.value, 10); save(); } }
    });
    root.appendChild(row('控笔默认时长', State.calliMinutes + ' 分钟（可临时调整）', range));

    // 喂食记录
    const fed = Object.values(State.feedLog).reduce((a,b)=>a+b,0);
    root.appendChild(row('喂食记录', `累计喂食 ${fed} 次`, el('span', { class: 'muted' }, ['🐶'])));

    // 清空数据（行内确认输入）
    const clearBox = el('div', { class: 'card', style: { background: '#FFEDED', borderColor: '#F5C2C2' } });
    clearBox.appendChild(el('h3', { style: { margin: '0 0 6px', color: '#A3201A' } }, ['⚠️ 清空所有数据']));
    clearBox.appendChild(el('p', { class: 'muted', style: { fontSize: '12px', margin: '0 0 10px' } }, ['将清空所有骨头、打卡、装扮和愿望，不可恢复。在下面输入 "DELETE" 确认：']));
    const clearInput = el('input', { type: 'text', class: 'input', placeholder: '输入 DELETE', style: { marginBottom: '8px' } });
    const clearBtn = el('button', { class: 'btn danger' }, ['确认清空']);
    clearBtn.onclick = () => {
      if (clearInput.value === 'DELETE') {
        localStorage.removeItem(KEY);
        toast('已清空，正在重启...');
        setTimeout(() => location.reload(), 800);
      } else {
        toast('请输入大写 DELETE 确认');
      }
    };
    clearBox.appendChild(clearInput);
    clearBox.appendChild(clearBtn);
    root.appendChild(clearBox);

    // 关于
    root.appendChild(el('div', { class: 'card' }, [
      el('h3', { style: { margin: 0 } }, ['关于 毛毛任务']),
      el('p', { class: 'muted' }, ['汪汪队主题 · 为 1 年级小朋友设计的学习桌。完成每日任务获得骨头，给毛毛喂食和打扮。'])
    ]));
    return root;
  };

  // -------- 渲染 --------
  function rerender() {
    const route = currentRoute();
    const main = currentRouteMain();
    const page = Pages[main] || Pages.home;
    const node = page();
    const c = $('#content');
    c.innerHTML = '';
    c.appendChild(node);
    highlight(route.split('/')[0]);
    updateHeaderBones();
  }
  function currentRouteMain() {
    const r = currentRoute().split('/')[0];
    return Pages[r] ? r : 'home';
  }

  // -------- 启动 --------
  function init() {
    load();
    // 侧边栏导航
    document.querySelectorAll('#sbNav li').forEach(li => {
      li.onclick = () => go(li.dataset.route);
    });
    // 长按顶部标题解锁家长模式
    const tb = document.querySelector('.topbar');
    if (tb) bindLongPress(tb, () => {
      State.parentModeOn = !State.parentModeOn; save();
      toast('家长模式已' + (State.parentModeOn ? '开启' : '关闭'));
    });
    // Hash 路由
    window.addEventListener('hashchange', rerender);
    if (!location.hash) location.hash = '#/home';
    rerender();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
