// ============================================================
// SANKEY ENGINE  –  Health Metrics Explorer
// ============================================================

// ── Colorblind-safe palette (7 for metrics, fixed for Q/S) ───
// Wong (2011) palette — distinguishable under protanopia, deuteranopia, tritanopia
const METRIC_PALETTE = ['#E69F00','#56B4E9','#009E73','#F0E442','#90446E','#5A1212','#51C421'];
const Q_COLOR = '#82BEA5';   // question nodes/links
const S_COLOR = '#9A232E';   // solution nodes/links

// Fallback base colors (used when metricColors map has no entry)
const COLORS = {
  metric:   { link: 'rgba(230,159,0,'  },   // orange
  question: { link: 'rgba(130,190,165,'  },   // green
  solution: { link: 'rgba(154,35,46,'  },   // dark red
};

const LINK_OPACITY_DEFAULT = 0.22;
const LINK_OPACITY_DIM     = 0.03;
const LINK_OPACITY_HI      = 0.62;
const NODE_OPACITY_DIM     = 0.18;

class SankeyChart {
  constructor(svgEl, tooltipEl) {
    this.svg          = svgEl;
    this.tooltip      = tooltipEl;
    this.highlighted  = null; // { type: 'node'|'link', id }
    // Map: metric node id → hex colour (set externally by App)
    this.metricColors = {};
  }

  // ── Entry point ──────────────────────────────────────────
  render(nodes, links, { width,padX = 160, nodeW = 20, padY = 40, minH = 500} = {}) {
    this.svg.innerHTML = '';
    this.nodes = nodes;
    this.links = links;
    this.padX  = padX;
    this.nodeW = nodeW;
    this.nodeEls = {};
    this.linkEls = {};

    const rightBuffer = 35; // Amount of space to reserve for the long solution labels
    const svgW = (width || this.svg.parentElement.clientWidth - 40);
// Subtract the buffer from the 'inner' calculation so nodes stop earlier
    const inner = svgW - (padX * 2) - rightBuffer;
    const colW  = inner / 2;

    this.colX = {
      metric:   padX,
      question: padX + colW,
      solution: padX + colW * 2,
    };

    const headerH = 36;
    const gap = 2;

    // 1. DYNAMIC HEIGHT: Find the column with the most nodes
    const counts = ['metric', 'question', 'solution'].map(col =>
        nodes.filter(n => n.col === col).length
    );
    const maxInCol = Math.max(...counts);

    const maxNodes = Math.max(
      nodes.filter(n => n.col === 'metric').length,
      nodes.filter(n => n.col === 'question').length,
      nodes.filter(n => n.col === 'solution').length
    );

    // const availH = Math.max(minH, maxNodes * (30 + gap));
    // const svgH = headerH + padY / 2 + availH + 120;
    // Compute available height dynamically based on node count to match v1 compression
    // const metricCount = nodes.filter(n => n.col === 'metric').length;
    // const availH = Math.max(minH, metricCount * 52); // v1's scaling formula
    // const svgH = availH + headerH + padY;
// Auto-expand: each node gets at least 45px of space
    const availH = Math.max(minH, maxInCol * 65);
    const svgH = availH + headerH + padY + 30; // Extra buffer for bottom labels
    // Layout nodes per column — sorted by total descending
    ['metric', 'question', 'solution'].forEach(col => {
      const colNodes = nodes.filter(n => n.col === col).sort((a, b) => b.total - a.total);
      const colTotal = colNodes.reduce((s, n) => s + n.total, 0);

      // v1 uses a more flexible usableH calculation
      const usableH = availH - gap * (colNodes.length - 1);
      let y = headerH + padY / 2;

      colNodes.forEach(n => {
        // Ensure nodes have a minimum height for visibility (v1 used 14, v2 used 18)
        n.h = colTotal === 0 ? 14 : Math.max(14, (n.total / colTotal) * usableH);
        n.x = this.colX[col];
        n.y = y;
        y += n.h + gap;
      });
    });

    this.svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    this.svg.setAttribute('width', svgW);
    this.svg.setAttribute('height', svgH);

    // Column headers
    const colLabels = { metric: 'Metric Categories', question: 'Question Categories', solution: 'Solution Categories' };
    ['metric','question','solution'].forEach(col => {
      const t = this._el('text', {
        x: this.colX[col] + nodeW / 2,
        y: headerH / 2,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        class: 'col-header',
      });
      t.textContent = colLabels[col];
      this.svg.appendChild(t);
    });

    // Links first (behind nodes)
    this._computeLinkOffsets();
    links.forEach(l => this._drawLink(l));

    // Nodes on top
    nodes.forEach(n => this._drawNode(n));
  }

  // ── Link offset computation ───────────────────────────────
  _computeLinkOffsets() {
    this.nodes.forEach(n => { n._out = 0; n._in = 0; });

    // metric → question
    this.links.forEach(l => {
      const src = this.nodes.find(n => n.id === l.metric   && n.col === 'metric');
      const tgt = this.nodes.find(n => n.id === l.question && n.col === 'question');
      if (!src || !tgt) return;
      l._mq_srcY = src.y + src._out;
      l._mq_tgtY = tgt.y + tgt._in;
      l._mq_h    = (l.weight / src.total) * src.h;
      l._mq_th   = (l.weight / tgt.total) * tgt.h;
      src._out += l._mq_h;
      tgt._in  += l._mq_th;
    });

    this.nodes.forEach(n => { n._in = 0; n._out = 0; });

    // question → solution
    this.links.forEach(l => {
      const src = this.nodes.find(n => n.id === l.question && n.col === 'question');
      const tgt = this.nodes.find(n => n.id === l.solution && n.col === 'solution');
      if (!src || !tgt) return;
      l._qs_srcY = src.y + src._out;
      l._qs_tgtY = tgt.y + tgt._in;
      l._qs_h    = (l.weight / src.total) * src.h;
      l._qs_th   = (l.weight / tgt.total) * tgt.h;
      src._out += l._qs_h;
      tgt._in  += l._qs_th;
    });
  }

  // ── Resolve fill colour for a link segment ───────────────
  // linkCol: 'metric' segment uses the metric node's colour;
  // 'question' segment uses the question node's colour.
  _linkColor(l, opacity, linkCol) {
    const nodeId = linkCol === 'question' ? l.question : l.metric;
    const hex = this.metricColors[nodeId];
    if (!hex) return COLORS[linkCol || 'metric'].link + opacity + ')';
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${opacity})`;
  }

  // ── Draw a link ───────────────────────────────────────────
  _drawLink(l) {
    const nw = this.nodeW;
    const g  = this._el('g');
    g.dataset.metric   = l.metric;
    g.dataset.question = l.question;
    g.dataset.solution = l.solution;
    g.dataset.weight   = l.weight;

    const linkPad = 1.5;
    const segments = [
      {
        x1: this.colX.metric   + nw, x2: this.colX.question,
        y1s: l._mq_srcY+ linkPad, y1e: l._mq_srcY + l._mq_h - linkPad,
        y2s: l._mq_tgtY+ linkPad, y2e: l._mq_tgtY + l._mq_th- linkPad,
        col: 'metric',
      },
      {
        x1: this.colX.question + nw, x2: this.colX.solution,
        y1s: l._qs_srcY+ linkPad, y1e: l._qs_srcY + l._qs_h- linkPad,
        y2s: l._qs_tgtY+ linkPad, y2e: l._qs_tgtY + l._qs_th- linkPad,
        col: 'question',
      },
    ];

    segments.forEach(s => {
      const path = this._el('path');
      const mx   = (s.x1 + s.x2) / 2;
      path.setAttribute('d', [
        `M ${s.x1} ${s.y1s}`,
        `C ${mx} ${s.y1s}, ${mx} ${s.y2s}, ${s.x2} ${s.y2s}`,
        `L ${s.x2} ${s.y2e}`,
        `C ${mx} ${s.y2e}, ${mx} ${s.y1e}, ${s.x1} ${s.y1e}`,
        'Z'
      ].join(' '));
      path.setAttribute('class', 'link-path');
      path.setAttribute('fill', this._linkColor(l, LINK_OPACITY_DEFAULT, s.col));
      path.dataset.linkId   = `${l.metric}|${l.question}|${l.solution}`;
      path.dataset.col      = s.col;
      path.dataset.metricId = l.metric;
      path.dataset.questionId = l.question;

      path.addEventListener('mouseenter', e => this._onLinkHover(l, path, e));
      path.addEventListener('mouseleave', () => this._hideTooltip());
      path.addEventListener('click', () => this._onLinkClick(l));
      g.appendChild(path);
    });

    this.svg.insertBefore(g, this.svg.firstChild);
    this.linkEls[`${l.metric}|${l.question}|${l.solution}`] = g;
  }

  // ── Draw a node ───────────────────────────────────────────
  _drawNode(n) {
    const g = this._el('g', { class: 'node-group' });
    const color = this.metricColors[n.id] || (n.col === 'question' ? Q_COLOR : S_COLOR);

    const rect = this._el('rect', {
      x: n.x, y: n.y, width: this.nodeW, height: Math.max(n.h, 4),
      fill: color, rx: 3, class: 'node-rect'
    });

    // 1. Determine "Smallness"
    // If the bar height (n.h) is less than 24px, we consider it "small"
    const isSmall = n.h < 24;
    const labelWidth = n.col === 'solution' ? 200 : 160;

    // 2. Dynamic Typography Settings
    const fontSize   = isSmall ? '10px' : '12px';
    const lineHeight = isSmall ? '1.0'  : '1.2';
    const fontColor  = isSmall ? '#4a4a48' : '#1a1a18'; // Slightly softer color for small labels

    // 3. Vertical Alignment Shift
    // If the node is tiny, we shift the label slightly higher to center it against the bar
    const vOffset = isSmall ? -2 : -5;

    let foX = n.col === 'metric' ? n.x - labelWidth - 15 : n.x + this.nodeW + 15;

    const fo = this._el('foreignObject', {
      x: foX,
      y: n.y + vOffset,
      width: labelWidth,
      height: 100
    });

    const div = document.createElement('div');
    div.style.cssText = `
    font-size: ${fontSize}; 
    line-height: ${lineHeight}; 
    color: ${fontColor}; 
    text-align: ${n.col === 'metric' ? 'right' : 'left'}; 
    overflow-wrap: break-word; 
    white-space: normal;      
    font-family: system-ui, -apple-system, sans-serif;
    transition: all 0.2s ease; /* Smooth transition when filtering */
  `;

    div.innerHTML = `${n.label}<br><span style="font-size: 0.85em; opacity: 0.6">${n.total}</span>`;
    fo.appendChild(div);
    g.appendChild(rect);
    g.appendChild(fo);

    g.addEventListener('mouseenter', e => this._onNodeHover(n, e));
    g.addEventListener('mouseleave', () => this._hideTooltip());
    g.addEventListener('click', () => this._onNodeClick(n));
    this.svg.appendChild(g);
    this.nodeEls[n.id] = g;
  }

  // ── Interactions ──────────────────────────────────────────
  _onNodeClick(n) {
    if (this.highlighted?.type === 'node' && this.highlighted.id === n.id) {
      this._clearHighlight();
      if (this.onNodeSelected) this.onNodeSelected(null); // Notify App
    } else {
      this._highlightNode(n);
      if (this.onNodeSelected) this.onNodeSelected(n);    // Notify App
    }
  }

  _onLinkClick(l) {
    const id = `${l.metric}|${l.question}|${l.solution}`;
    if (this.highlighted?.type === 'link' && this.highlighted.id === id) {
      this._clearHighlight();
    } else {
      this._highlightLink(l);
    }
  }

  _highlightNode(n) {
    this.highlighted = { type: 'node', id: n.id, col: n.col };

    const relatedLinks = this.links.filter(l => l[n.col] === n.id);
    const relatedIds   = new Set(relatedLinks.map(l => `${l.metric}|${l.question}|${l.solution}`));
    const relatedNodes = new Set();
    relatedLinks.forEach(l => {
      relatedNodes.add(l.metric);
      relatedNodes.add(l.question);
      relatedNodes.add(l.solution);
    });

    Object.entries(this.linkEls).forEach(([id, g]) => {
      const isRelated = relatedIds.has(id);
      const [mId,,qId] = id.split('|');  // metric|question|solution
      g.querySelectorAll('path').forEach(p => {
        const col = p.dataset.col;
        const lProxy = { metric: p.dataset.metricId, question: p.dataset.questionId };
        const opacity = isRelated ? LINK_OPACITY_HI : LINK_OPACITY_DIM;
        p.setAttribute('fill', this._linkColor(lProxy, opacity, col));
      });
    });

    Object.entries(this.nodeEls).forEach(([id, g]) => {
      g.style.opacity = relatedNodes.has(id) ? '1' : String(NODE_OPACITY_DIM);
    });
  }

  _highlightLink(l) {
    const id = `${l.metric}|${l.question}|${l.solution}`;
    this.highlighted = { type: 'link', id };
    const relatedNodes = new Set([l.metric, l.question, l.solution]);

    Object.entries(this.linkEls).forEach(([lid, g]) => {
      const isRelated = lid === id;
      g.querySelectorAll('path').forEach(p => {
        const col = p.dataset.col;
        const lProxy = { metric: p.dataset.metricId, question: p.dataset.questionId };
        const opacity = isRelated ? LINK_OPACITY_HI : LINK_OPACITY_DIM;
        p.setAttribute('fill', this._linkColor(lProxy, opacity, col));
      });
    });

    Object.entries(this.nodeEls).forEach(([id, g]) => {
      g.style.opacity = relatedNodes.has(id) ? '1' : String(NODE_OPACITY_DIM);
    });
  }

  _clearHighlight() {
    this.highlighted = null;
    Object.values(this.linkEls).forEach(g => {
      g.querySelectorAll('path').forEach(p => {
        const col = p.dataset.col;
        const lProxy = { metric: p.dataset.metricId, question: p.dataset.questionId };
        p.setAttribute('fill', this._linkColor(lProxy, LINK_OPACITY_DEFAULT, col));
      });
    });
    Object.values(this.nodeEls).forEach(g => g.style.opacity = '1');
  }

  // ── Tooltip ───────────────────────────────────────────────
  _onNodeHover(n, e) {
    const colLabel = n.col === 'metric' ? 'Metric' : n.col === 'question' ? 'Question' : 'Solution';
    this.tooltip.innerHTML =
      `<strong>${n.label}</strong><span>${n.total} connections · ${colLabel}</span>`;
    this._showTooltip(e);
  }

  _onLinkHover(l, path, e) {
    const mNode = this.nodes.find(n => n.id === l.metric);
    const qNode = this.nodes.find(n => n.id === l.question);
    const sNode = this.nodes.find(n => n.id === l.solution);
    this.tooltip.innerHTML =
      `<strong>${l.weight} connection${l.weight !== 1 ? 's' : ''}</strong>` +
      `<span class="tip-path">${mNode?.label || l.metric}<br>→ ${qNode?.label || l.question}<br>→ ${sNode?.label || l.solution}</span>`;
    this._showTooltip(e);
  }

  _showTooltip(e) {
    this.tooltip.classList.add('visible');
    this._moveTooltip(e);
    document.addEventListener('mousemove', this._moveHandler = ev => this._moveTooltip(ev));
  }

  _moveTooltip(e) {
    const t = this.tooltip;
    let x = e.clientX + 14, y = e.clientY - 10;
    if (x + 270 > window.innerWidth)  x = e.clientX - 270;
    if (y + 80  > window.innerHeight) y = e.clientY - 80;
    t.style.left = x + 'px';
    t.style.top  = y + 'px';
  }

  _hideTooltip() {
    this.tooltip.classList.remove('visible');
    document.removeEventListener('mousemove', this._moveHandler);
  }

  // ── SVG helper ────────────────────────────────────────────
  _el(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }
}

// ============================================================
// APP CONTROLLER
// ============================================================

class App {
  constructor() {
    this.expandedMetric   = null;
    this.expandedQuestion = null;
    this.expandedSolution = null;
    this.metricColorMap   = {};

    // Stable mapping: category key → palette index (set once, never shuffles)
    this._catColorIndex = {};
  }

  init() {
    this.svg     = document.getElementById('sankey-svg');
    this.tooltip = document.getElementById('tooltip');
    this.chart   = new SankeyChart(this.svg, this.tooltip);

    // ADD THIS: Listen for node clicks from the Sankey
    this.chart.onNodeSelected = (node) => {
      this._updateTitle(node);
    };

    this._buildCategoryColorIndex();
    this._buildFilterUI();
    this._updateChipVisibility();
    this._updateTitle(); // Initial call
    this._render();

    window.addEventListener('resize', () => this._render());
  }

  // ── Pre-assign a stable palette index to each metric category ─
  // Sort by total weight descending so the largest cat = colour 0.
  _buildCategoryColorIndex() {
    const totals = this._getCategoryTotals('metric');
    Object.keys(DATA.metrics.categories)
      .sort((a, b) => (totals[b] || 0) - (totals[a] || 0))
      .forEach((key, i) => { this._catColorIndex[key] = i; });
  }

  // ── Compute per-category weight totals ────────────────────
  _getCategoryTotals(col) {
    const colKey  = col;
    const codesObj = col === 'metric'   ? DATA.metrics.codes
                   : col === 'question' ? DATA.questions.codes
                   : DATA.solutions.codes;
    const totals = {};
    DATA.rows.forEach(r => {
      const code = r[colKey];
      if (!codesObj[code]) return;
      const cat = codesObj[code].category;
      totals[cat] = (totals[cat] || 0) + (r.weight || 1);
    });
    return totals;
  }

  // ── Build filter chips (sorted by weight desc) ────────────
  _buildFilterUI() {
    this._buildChips('metric',   'metric-filters',   DATA.metrics.categories);
    this._buildChips('question', 'question-filters', DATA.questions.categories);
    this._buildChips('solution', 'solution-filters', DATA.solutions.categories);

    document.getElementById('reset-all').addEventListener('click', () => {
      this.expandedMetric   = null;
      this.expandedQuestion = null;
      this.expandedSolution = null;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      this._updateChipVisibility();
      this._updateTitle();
      this._render();
    });
  }

  _buildChips(col, containerId, categories) {
    const container = document.getElementById(containerId);
    const totals    = this._getCategoryTotals(col);
    const sorted    = Object.entries(categories)
      .sort((a, b) => (totals[b[0]] || 0) - (totals[a[0]] || 0));

    sorted.forEach(([key, cat]) => {
      const chip = document.createElement('button');
      chip.className   = `chip ${col}-chip`;
      chip.textContent = cat.label;
      chip.dataset.key = key;

      // Colour the chip border/dot to match its palette colour for metrics
      if (col === 'metric') {
        const hex = METRIC_PALETTE[this._catColorIndex[key] % METRIC_PALETTE.length];
        chip.style.setProperty('--chip-color', hex);
        chip.style.borderColor = hex;
        chip.style.setProperty('--chip-active-bg', hex);
      }

      chip.addEventListener('click', () => this._onChipClick(col, key, chip));
      container.appendChild(chip);
    });
  }

  _onChipClick(col, key, chip) {
    const prop = `expanded${col.charAt(0).toUpperCase() + col.slice(1)}`;
    const wasActive = this[prop] === key;

    document.querySelectorAll(`.${col}-chip`).forEach(c => c.classList.remove('active'));

    this[prop] = wasActive ? null : key;
    if (!wasActive) chip.classList.add('active');

    // Reset the focus when a new pill is clicked to avoid confusion
    this.chart.highlighted = null;

    this._updateTitle(null); // Call with null to clear the "Focusing on" part
    this._updateChipVisibility();
    this._render();
  }

  _updateChipVisibility() {
    ['metric', 'question', 'solution'].forEach(col => {
      const expanded = this[`expanded${col.charAt(0).toUpperCase() + col.slice(1)}`];
      document.querySelectorAll(`.${col}-chip`).forEach(c => {
        // v1 Behavior: Keep all chips visible
        c.style.display = '';
        // Ensure the active one is visually distinct
        if (expanded && c.dataset.key === expanded) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });
    });
  }

  // ── Dynamic chart title ───────────────────────────────────
  // ── Dynamic chart title ───────────────────────────────────
  _updateTitle(focusedNode = null) {
    const el = document.getElementById('chart-title');
    if (!el) return;

    // 1. Get Category Labels from the active Pills
    const getLabel = (type, key) => {
      if (!key) return null;
      const searchType = type.endsWith('s') ? type.slice(0, -1) : type;
      const source = searchType === 'metric' ? DATA.metrics :
          (searchType === 'question' ? DATA.questions : DATA.solutions);
      return source?.categories[key]?.label || null;
    };

    const m = getLabel('metric', this.expandedMetric);
    const q = getLabel('question', this.expandedQuestion);
    const s = getLabel('solution', this.expandedSolution);
    const categoryParts = [m, q, s].filter(Boolean);

    // 2. Build the breadcrumb string
    let titleHTML = '';

    // Part A: Show the Category path if pills are active
    if (categoryParts.length > 0) {
      const path = categoryParts.join(' <span style="opacity:0.3;">→</span> ');
      titleHTML += `<span style="opacity:0.6; font-size:0.9em;">Viewing:</span> <strong>${path}</strong>`;
    } else {
      titleHTML += `<span style="opacity:0.6; font-size:0.9em;">All Categories</span>`;
    }

    // Part B: Append the specific focus if a bar is clicked
    if (focusedNode) {
      titleHTML += `
        <span style="margin: 0 12px; opacity: 0.2;">|</span>
        <span style="opacity:0.6; font-size:0.9em; text-transform:uppercase; letter-spacing:0.5px;">Focusing on:</span> 
        <span style="color:#9A232E; font-weight:600;">${focusedNode.label}</span>
      `;
    }

    el.innerHTML = titleHTML;
  }

  // ── Build colour map for all nodes ────────────────────────
  _buildColorMap(nodes) {
    // ... (rest of your buildColorMap code)
    const map = {};
    nodes.forEach(n => {
      if (n.col === 'metric') {
        const idx = this._catColorIndex[n.category] ?? 0;
        map[n.id] = METRIC_PALETTE[idx % METRIC_PALETTE.length];
      } else if (n.col === 'question') {
        map[n.id] = Q_COLOR;
      } else {
        map[n.id] = S_COLOR;
      }
    });
    return map;
  }

  // ── Build nodes & links ───────────────────────────────────
  _buildGraph() {
    const nodes  = [];
    const nodeMap = {};

    const addNode = (id, label, col, category) => {
      if (!nodeMap[id]) {
        nodeMap[id] = { id, label, col, category, total: 0 };
        nodes.push(nodeMap[id]);
      }
      return nodeMap[id];
    };

    const mLevel = this.expandedMetric;
    const qLevel = this.expandedQuestion;
    const sLevel = this.expandedSolution;
    const linkMap = {};

    DATA.rows.forEach(row => {
      const mCode = row.metric, qCode = row.question, sCode = row.solution;
      if (!DATA.metrics.codes[mCode])   return;
      if (!DATA.questions.codes[qCode]) return;
      if (!DATA.solutions.codes[sCode]) return;

      const mCat = DATA.metrics.codes[mCode].category;
      const qCat = DATA.questions.codes[qCode].category;
      const sCat = DATA.solutions.codes[sCode].category;

      // When a category is expanded, filter to only that category
      if (mLevel && mCat !== mLevel) return;
      if (qLevel && qCat !== qLevel) return;
      if (sLevel && sCat !== sLevel) return;

      const mId = mLevel === mCat ? mCode   : `cat_m_${mCat}`;
      const qId = qLevel === qCat ? qCode   : `cat_q_${qCat}`;
      const sId = sLevel === sCat ? sCode   : `cat_s_${sCat}`;

      const mLabel = mLevel === mCat ? DATA.metrics.codes[mCode].label   : DATA.metrics.categories[mCat].label;
      const qLabel = qLevel === qCat ? DATA.questions.codes[qCode].label : DATA.questions.categories[qCat].label;
      const sLabel = sLevel === sCat ? DATA.solutions.codes[sCode].label : DATA.solutions.categories[sCat].label;

      addNode(mId, mLabel, 'metric',   mCat);
      addNode(qId, qLabel, 'question', qCat);
      addNode(sId, sLabel, 'solution', sCat);

      const lKey = `${mId}|${qId}|${sId}`;
      if (!linkMap[lKey]) linkMap[lKey] = { metric: mId, question: qId, solution: sId, weight: 0 };
      linkMap[lKey].weight += (row.weight || 1);
    });

    const links = Object.values(linkMap);
    nodes.forEach(n => {
      n.total = links.filter(l => l[n.col] === n.id).reduce((s, l) => s + l.weight, 0);
    });

    return { nodes, links };
  }

  // ── Render ────────────────────────────────────────────────
  _render() {
    const { nodes, links } = this._buildGraph();
    const width = this.svg.parentElement.clientWidth - 40;

    const colorMap = this._buildColorMap(nodes);
    this.metricColorMap     = colorMap;
    this.chart.metricColors = colorMap;

    this.chart.render(nodes, links, { width, padX: 160, nodeW: 20, padY: 40, minH: 500 });
  }
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
