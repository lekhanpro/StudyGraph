(function () {
  const app = window.StudyGraph;

  function buildEmptyCard(copy) {
    return '<article class="empty-card"><p class="empty-copy">' + app.escapeHtml(copy) + '</p></article>';
  }

  function buildQueueCard(label, topicId, title, copy) {
    return [
      '<article class="queue-card">',
      '<p class="eyebrow">' + app.escapeHtml(label) + '</p>',
      '<h3 class="queue-title">' + app.escapeHtml(title) + '</h3>',
      '<p class="queue-copy">' + app.escapeHtml(copy) + '</p>',
      '<button class="ghost-button" type="button" data-topic-select="' + topicId + '">Open topic</button>',
      '</article>'
    ].join('');
  }

  function renderFilters() {
    const state = app.state;
    const categoryButtons = ['<button class="chip' + (state.filters.category === 'all' ? ' active' : '') + '" data-category-filter="all" type="button">All</button>']
      .concat(app.categoryList().map(function (category) {
        return '<button class="chip' + (state.filters.category === category ? ' active' : '') + '" data-category-filter="' + category + '" type="button">' + category + '</button>';
      })).join('');
    const statusButtons = app.statusFilters.map(function (filter) {
      return '<button class="chip' + (state.filters.status === filter.value ? ' active' : '') + '" data-status-filter="' + filter.value + '" type="button">' + filter.label + '</button>';
    }).join('');

    state.elements.categoryFilters.innerHTML = categoryButtons;
    state.elements.statusFilters.innerHTML = statusButtons;

    state.elements.categoryFilters.querySelectorAll('[data-category-filter]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.filters.category = button.dataset.categoryFilter;
        renderAll();
      });
    });

    state.elements.statusFilters.querySelectorAll('[data-status-filter]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.filters.status = button.dataset.statusFilter;
        renderAll();
      });
    });
  }

  function renderStats() {
    const stats = app.state.analysis.stats;
    const recommendation = app.state.analysis.recommendation;
    const cards = [
      { label: 'Total topics', value: stats.totalTopics, trend: stats.masteredTopics + ' mastered' },
      { label: 'Average mastery', value: stats.averageMastery + '%', trend: stats.inProgressTopics + ' currently active' },
      { label: 'Unlocked now', value: stats.unlockedTopics, trend: recommendation ? 'Next best: ' + recommendation.title : 'No topic currently unlocked' },
      { label: 'Blocked topics', value: stats.blockedTopics, trend: app.state.analysis.roots.length + ' root topics' }
    ];

    app.state.elements.statsGrid.innerHTML = cards.map(function (card) {
      return '<article class="stats-card"><div class="stats-label">' + app.escapeHtml(card.label) + '</div><div class="stats-value">' + app.escapeHtml(card.value) + '</div><div class="stats-trend">' + app.escapeHtml(card.trend) + '</div></article>';
    }).join('');
  }

  function renderGraph() {
    const state = app.state;
    const filteredTopics = app.getFilteredTopics();
    const visibleIds = new Set(filteredTopics.map(function (topic) { return topic.id; }));
    const bounds = app.getGraphBounds(state.analysis.topics);
    const selectedMeta = state.analysis.metaById[state.selectedTopicId] || null;
    const pathIds = new Set(selectedMeta && selectedMeta.rootPath ? selectedMeta.rootPath : []);
    const cycleIds = new Set(state.cycleAlert && Array.isArray(state.cycleAlert.path) ? state.cycleAlert.path : []);

    state.elements.graphStage.style.width = bounds.width + 'px';
    state.elements.graphStage.style.height = Math.max(760, bounds.height) + 'px';
    state.elements.graphEdges.setAttribute('viewBox', '0 0 ' + bounds.width + ' ' + Math.max(760, bounds.height));
    state.elements.graphEdges.setAttribute('width', bounds.width);
    state.elements.graphEdges.setAttribute('height', Math.max(760, bounds.height));
    state.elements.visibleCountBadge.textContent = filteredTopics.length + ' visible';

    const edgeMarkup = [
      '<defs>',
      '<marker id="arrowhead" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">',
      '<path d="M0,0 L0,6 L7,3 z" fill="rgba(140, 165, 206, 0.48)"></path>',
      '</marker>',
      '</defs>'
    ];

    state.analysis.edges.forEach(function (edge) {
      const fromTopic = state.analysis.indexes.topicById[edge.from];
      const toTopic = state.analysis.indexes.topicById[edge.to];
      if (!fromTopic || !toTopic) return;
      const x1 = fromTopic.x + 154;
      const y1 = fromTopic.y + 55;
      const x2 = toTopic.x + 22;
      const y2 = toTopic.y + 55;
      const curveOffset = Math.max(70, (x2 - x1) * 0.35);
      const d = ['M', x1, y1, 'C', x1 + curveOffset, y1, x2 - curveOffset, y2, x2, y2].join(' ');
      const classes = ['edge'];
      const visible = visibleIds.has(edge.from) && visibleIds.has(edge.to);
      const inPath = pathIds.has(edge.from) && pathIds.has(edge.to);
      const selectedConnection = edge.from === state.selectedTopicId || edge.to === state.selectedTopicId;
      const inCycle = cycleIds.has(edge.from) && cycleIds.has(edge.to);
      const recommendedLink = state.analysis.recommendation && edge.to === state.analysis.recommendation.id;
      if (!visible) classes.push('hidden');
      else if (inCycle) classes.push('cycle');
      else if (recommendedLink) classes.push('recommended');
      else if (inPath || selectedConnection) classes.push('highlight');
      edgeMarkup.push('<path class="' + classes.join(' ') + '" d="' + d + '" marker-end="url(#arrowhead)"></path>');
    });

    state.elements.graphEdges.innerHTML = edgeMarkup.join('');
    state.elements.graphNodes.innerHTML = filteredTopics.map(function (topic) {
      const meta = state.analysis.metaById[topic.id];
      const category = app.getCategoryMeta(topic.category);
      const summary = topic.description.length > 70 ? topic.description.slice(0, 67) + '...' : topic.description;
      const classes = ['topic-node', meta.state];
      if (topic.id === state.selectedTopicId) classes.push('selected');
      if (meta.recommended) classes.push('recommended');
      if (pathIds.has(topic.id)) classes.push('in-path');
      if (cycleIds.has(topic.id)) classes.push('in-cycle');
      return [
        '<article class="' + classes.join(' ') + '" data-id="' + topic.id + '" style="left:' + topic.x + 'px;top:' + topic.y + 'px;">',
        '<div class="node-header">',
        '<span class="node-category"><span class="node-category-dot" style="background:' + category.color + ';"></span>' + app.escapeHtml(topic.category) + '</span>',
        meta.recommended ? '<span class="node-badge recommended">Recommended</span>' : '<span class="node-badge">L' + topic.difficulty + '</span>',
        '</div>',
        '<div><h3 class="node-title">' + app.escapeHtml(topic.title) + '</h3><p class="node-summary">' + app.escapeHtml(summary) + '</p></div>',
        '<div class="node-footer"><div class="node-ring" style="--progress:' + topic.mastery + ';--ring-color:' + category.color + ';">' + topic.mastery + '%</div><span class="status-dot" style="background:' + app.stateColor(meta.state) + ';"></span></div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderQueue() {
    const unlocked = app.state.analysis.topics.filter(function (topic) {
      const meta = app.state.analysis.metaById[topic.id];
      return meta.unlocked && meta.state !== 'mastered';
    });
    const blocked = app.state.analysis.topics.filter(function (topic) {
      return app.state.analysis.metaById[topic.id].state === 'locked';
    });

    app.state.elements.queuePanel.innerHTML = [
      app.state.analysis.recommendation ? buildQueueCard('Focus next', app.state.analysis.recommendation.id, app.state.analysis.recommendation.title, 'Highest score in the current unlock set.') : buildEmptyCard('No topics are currently unlocked.'),
      unlocked.length ? unlocked.slice(0, 4).map(function (topic) {
        const meta = app.state.analysis.metaById[topic.id];
        return buildQueueCard('Ready now', topic.id, topic.title, meta.state === 'in-progress' ? 'Already underway.' : 'All prerequisites are satisfied.');
      }).join('') : buildEmptyCard('Nothing is studyable until more prerequisites are completed.'),
      blocked[0] ? buildQueueCard('Blocked', blocked[0].id, blocked[0].title, 'Still waiting on ' + app.topicNameList(app.state.analysis.metaById[blocked[0].id].blockedBy) + '.') : ''
    ].join('');
  }

  function renderRecommendations() {
    const recommendation = app.state.analysis.recommendation;
    if (!recommendation) {
      app.state.elements.recommendationPanel.innerHTML = buildEmptyCard('Complete prerequisite topics to unlock recommendations.');
      return;
    }
    app.state.elements.recommendationPanel.innerHTML = app.state.analysis.recommendations.slice(0, 3).map(function (entry, index) {
      const topic = app.state.analysis.indexes.topicById[entry.id];
      const reasons = entry.reasons.slice(1, 4).map(function (reason) { return '<span class="detail-tag">' + app.escapeHtml(reason) + '</span>'; }).join('');
      return '<article class="recommendation-card"><div class="recommendation-score">Rank ' + (index + 1) + ' | Score ' + entry.score + '</div><h3 class="queue-title">' + app.escapeHtml(topic.title) + '</h3><p class="queue-copy">' + app.escapeHtml(entry.reasons[0]) + '</p><div class="queue-tag-row">' + reasons + '</div><button class="ghost-button" type="button" data-topic-select="' + entry.id + '">Inspect topic</button></article>';
    }).join('');
  }

  function renderDetails() {
    const topic = app.getSelectedTopic();
    if (!topic) {
      app.state.elements.detailPanel.innerHTML = buildEmptyCard('Select a topic to inspect its dependencies, mastery, and unlock path.');
      return;
    }
    const meta = app.state.analysis.metaById[topic.id];
    const pathMarkup = meta.rootPath.length ? meta.rootPath.map(function (id) {
      return '<button class="tag-button" type="button" data-focus-topic="' + id + '">' + app.escapeHtml(app.state.analysis.indexes.topicById[id].title) + '</button>';
    }).join('') : '<span class="micro-copy">No root path available.</span>';
    const prereqMarkup = meta.prerequisites.length ? meta.prerequisites.map(function (id) {
      return '<button class="tag-button" type="button" data-focus-topic="' + id + '">' + app.escapeHtml(app.state.analysis.indexes.topicById[id].title) + '</button>';
    }).join('') : '<span class="detail-tag positive">Root topic</span>';
    const dependentMarkup = meta.dependents.length ? meta.dependents.map(function (id) {
      const dependent = app.state.analysis.indexes.topicById[id];
      return '<span class="detail-tag-row"><button class="tag-button" type="button" data-focus-topic="' + id + '">' + app.escapeHtml(dependent.title) + '</button><button class="tag-button" type="button" data-remove-edge data-from="' + topic.id + '" data-to="' + id + '">Remove link</button></span>';
    }).join('') : '<span class="micro-copy">Nothing depends on this topic yet.</span>';
    const blockerMarkup = meta.blockedBy.length ? meta.blockedBy.map(function (id) {
      return '<span class="detail-tag negative">' + app.escapeHtml(app.state.analysis.indexes.topicById[id].title) + '</span>';
    }).join('') : '<span class="detail-tag positive">Fully unlocked</span>';
    const cycleMarkup = app.state.cycleAlert ? '<article class="detail-card"><h3 class="detail-title">Cycle alert</h3><p class="detail-copy">' + app.escapeHtml(app.state.cycleAlert.message) + '</p><div class="detail-tag-row">' + (app.state.cycleAlert.path || []).map(function (id) {
      const linkedTopic = app.state.analysis.indexes.topicById[id];
      return '<span class="detail-tag negative">' + app.escapeHtml(linkedTopic ? linkedTopic.title : id) + '</span>';
    }).join('') + '</div></article>' : '';

    app.state.elements.detailPanel.innerHTML = [
      cycleMarkup,
      '<article class="detail-card"><h3 class="detail-title">' + app.escapeHtml(topic.title) + '</h3><p class="detail-copy">' + app.escapeHtml(topic.description) + '</p><div class="detail-meta"><span class="detail-tag">' + app.escapeHtml(topic.category) + '</span><span class="detail-tag">Difficulty ' + topic.difficulty + '</span><span class="detail-tag">' + topic.estimatedHours + 'h estimate</span><span class="detail-tag">' + app.capitalize(meta.state) + '</span>' + (meta.recommended ? '<span class="detail-tag positive">Current best recommendation</span>' : '') + '</div><div class="mastery-shell"><div class="mastery-meta"><span class="micro-copy">Mastery tracker</span><span class="mastery-value">' + topic.mastery + '%</span></div><input data-mastery-slider type="range" min="0" max="100" step="5" value="' + topic.mastery + '"><div class="mastery-actions"><button class="mastery-button" type="button" data-mastery-step="-25">-25%</button><button class="mastery-button" type="button" data-mastery-step="25">+25%</button><button class="ghost-button" type="button" data-edit-selected>Edit topic</button><button class="ghost-button" type="button" data-delete-selected>Delete</button></div></div></article>',
      '<article class="detail-card"><h3 class="detail-title">Unlock explanation</h3><p class="detail-copy">' + app.buildUnlockCopy(topic, meta) + '</p><div class="detail-tag-row">' + blockerMarkup + '</div></article>',
      '<article class="detail-card"><h3 class="detail-title">Prerequisites</h3><div class="detail-tag-row">' + prereqMarkup + '</div></article>',
      '<article class="detail-card"><h3 class="detail-title">Unlocks next</h3><div class="stack-list">' + dependentMarkup + '</div></article>',
      '<article class="detail-card"><h3 class="detail-title">Shortest dependency path</h3><div class="detail-tag-row">' + pathMarkup + '</div></article>'
    ].join('');
  }

  function renderCategoryProgress() {
    app.state.elements.categoryProgress.innerHTML = app.state.analysis.categoryStats.map(function (entry) {
      const category = app.getCategoryMeta(entry.category);
      return '<article class="category-card"><div class="section-heading"><span class="category-title">' + app.escapeHtml(entry.category) + '</span><span class="micro-copy">' + entry.mastered + '/' + entry.count + ' mastered</span></div><div class="progress-bar-shell"><div class="progress-bar-fill" style="width:' + entry.averageMastery + '%;background:' + category.color + ';"></div></div><p class="queue-copy">' + entry.averageMastery + '% average mastery across ' + entry.count + ' topics.</p></article>';
    }).join('');
  }

  function renderSignals() {
    const unlocked = app.state.analysis.topics.filter(function (topic) {
      return app.state.analysis.metaById[topic.id].unlocked && app.state.analysis.metaById[topic.id].state !== 'mastered';
    });
    const locked = app.state.analysis.topics.filter(function (topic) {
      return app.state.analysis.metaById[topic.id].state === 'locked';
    });
    const weakest = app.state.analysis.topics.slice().sort(function (left, right) {
      return left.mastery - right.mastery || left.title.localeCompare(right.title);
    }).slice(0, 3);

    app.state.elements.signalsPanel.innerHTML = [
      '<article class="signal-card"><h3 class="signal-title">Unlocked right now</h3><p class="signal-copy">' + (unlocked.length ? app.topicNameList(unlocked.map(function (topic) { return topic.id; })) : 'No topics are currently ready.') + '</p></article>',
      '<article class="signal-card"><h3 class="signal-title">Blocked focus</h3><p class="signal-copy">' + (locked[0] ? locked[0].title + ' is waiting on ' + app.topicNameList(app.state.analysis.metaById[locked[0].id].blockedBy) + '.' : 'Nothing is blocked.') + '</p></article>',
      '<article class="signal-card"><h3 class="signal-title">Weakest areas</h3><p class="signal-copy">' + (weakest.length ? weakest.map(function (topic) { return topic.title + ' (' + topic.mastery + '%)'; }).join(', ') : 'No weak areas detected.') + '</p></article>'
    ].join('');
  }

  function renderAll() {
    app.analyzeState();
    renderFilters();
    renderStats();
    renderGraph();
    renderQueue();
    renderRecommendations();
    renderDetails();
    renderCategoryProgress();
    renderSignals();
  }

  app.buildEmptyCard = buildEmptyCard;
  app.renderGraph = renderGraph;
  app.renderAll = renderAll;
})();
