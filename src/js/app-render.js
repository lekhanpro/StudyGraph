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

  function formatBreakdownLabel(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, function (character) { return character.toUpperCase(); });
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

  function renderTemplates() {
    const state = app.state;
    state.elements.templatePanel.innerHTML = app.getRoadmapEntries().map(function (entry) {
      return [
        '<button class="template-card' + (state.ui.activeTemplate === entry.key ? ' active' : '') + '" type="button" data-template-key="' + entry.key + '" style="--template-accent:' + entry.accent + ';">',
        '<span class="template-kicker">' + app.escapeHtml(entry.tagline) + '</span>',
        '<strong>' + app.escapeHtml(entry.label) + '</strong>',
        '<span class="template-copy">' + app.escapeHtml(entry.description) + '</span>',
        '<span class="template-meta">' + entry.topicCount + ' topics | ' + entry.edgeCount + ' links</span>',
        '</button>'
      ].join('');
    }).join('');
  }

  function renderHero() {
    const hero = app.getHeroMetrics();
    const recommendation = hero.recommendation;
    const recommendationMarkup = recommendation
      ? '<div class="hero-spotlight"><p class="eyebrow">Best Next Move</p><h2>' + app.escapeHtml(recommendation.title) + '</h2><p class="queue-copy">Score ' + recommendation.score + ' with a weekly plan tuned for ' + hero.weeklyHours + ' study hours.</p><button class="primary-button" type="button" data-focus-recommendation>Focus Recommendation</button></div>'
      : '<div class="hero-spotlight"><p class="eyebrow">Best Next Move</p><h2>Nothing unlocked yet</h2><p class="queue-copy">Raise prerequisite mastery to unlock the next study candidates.</p></div>';

    app.state.elements.heroPanel.innerHTML = [
      '<div class="hero-copy">',
      '<p class="eyebrow">Advanced study OS</p>',
      '<h2>Plan roadmaps, simulate unlocks, and turn your graph into a weekly sprint.</h2>',
      '<p class="queue-copy">' + app.escapeHtml(hero.activeRoadmap.description) + '</p>',
      '<div class="hero-pill-row">',
      '<span class="status-pill">Blueprint: ' + app.escapeHtml(hero.activeRoadmap.label) + '</span>',
      '<span class="status-pill subtle">' + hero.totalEdges + ' prerequisite links</span>',
      '<span class="status-pill subtle">' + hero.weeklyHours + 'h sprint capacity</span>',
      '</div>',
      '</div>',
      '<div class="hero-grid">',
      '<article class="hero-metric-card"><span class="hero-metric-label">Readiness</span><strong class="hero-metric-value">' + hero.readiness + '%</strong><span class="hero-metric-copy">How ready this roadmap is for forward progress right now.</span></article>',
      '<article class="hero-metric-card"><span class="hero-metric-label">Momentum</span><strong class="hero-metric-value">' + hero.momentum + '%</strong><span class="hero-metric-copy">Portion of topics already in progress or fully mastered.</span></article>',
      '<article class="hero-metric-card"><span class="hero-metric-label">Blocker Load</span><strong class="hero-metric-value">' + hero.blockerLoad + '%</strong><span class="hero-metric-copy">How much of the roadmap is still gated by prerequisites.</span></article>',
      '</div>',
      recommendationMarkup
    ].join('');
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

    const edgeMarkup = ['<defs>', '<marker id="arrowhead" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="rgba(140, 165, 206, 0.48)"></path></marker>', '</defs>'];

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
    app.state.elements.recommendationPanel.innerHTML = app.state.analysis.recommendations.slice(0, 4).map(function (entry, index) {
      const topic = app.state.analysis.indexes.topicById[entry.id];
      const reasons = entry.reasons.slice(0, 3).map(function (reason) { return '<span class="detail-tag">' + app.escapeHtml(reason) + '</span>'; }).join('');
      return '<article class="recommendation-card"><div class="recommendation-score">Rank ' + (index + 1) + ' | Score ' + entry.score + '</div><h3 class="queue-title">' + app.escapeHtml(topic.title) + '</h3><p class="queue-copy">' + app.escapeHtml(topic.description) + '</p><div class="queue-tag-row">' + reasons + '</div><button class="ghost-button" type="button" data-topic-select="' + entry.id + '">Inspect topic</button></article>';
    }).join('');
  }

  function renderSimulation() {
    const simulation = app.getSimulation();
    const selectedTopic = app.getSelectedTopic();
    if (!simulation || !selectedTopic) {
      app.state.elements.simulationPanel.innerHTML = buildEmptyCard('Select a topic to simulate how more mastery changes your unlock graph.');
      return;
    }

    app.state.elements.simulationValue.textContent = simulation.projectedMastery + '%';
    app.state.elements.simulationSlider.value = String(simulation.projectedMastery);
    app.state.elements.simulationPanel.innerHTML = [
      '<article class="detail-card"><h3 class="detail-title">Projected outcome for ' + app.escapeHtml(selectedTopic.title) + '</h3><p class="detail-copy">At ' + simulation.projectedMastery + '% mastery, this topic would be <strong>' + app.escapeHtml(app.capitalize(simulation.projectedState)) + '</strong>.</p><div class="detail-tag-row"><span class="detail-tag positive">Projected avg mastery ' + simulation.projectedAverageMastery + '%</span>' + (simulation.nextRecommendation ? '<span class="detail-tag">Next recommendation: ' + app.escapeHtml(simulation.nextRecommendation.title) + '</span>' : '') + '</div></article>',
      simulation.newlyUnlocked.length ? '<article class="detail-card"><h3 class="detail-title">Newly unlocked topics</h3><div class="detail-tag-row">' + simulation.newlyUnlocked.slice(0, 5).map(function (topic) { return '<button class="tag-button" type="button" data-topic-select="' + topic.id + '">' + app.escapeHtml(topic.title) + '</button>'; }).join('') + '</div></article>' : buildEmptyCard('No additional topics would unlock yet. Push prerequisite mastery further or unblock sibling topics.')
    ].join('');
  }

  function renderDetails() {
    const topic = app.getSelectedTopic();
    if (!topic) {
      app.state.elements.detailPanel.innerHTML = buildEmptyCard('Select a topic to inspect its dependencies, mastery, impact, and unlock path.');
      return;
    }

    const meta = app.state.analysis.metaById[topic.id];
    const selectedRecommendation = app.state.analysis.recommendations.find(function (entry) { return entry.id === topic.id; });
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
    const breakdownMarkup = selectedRecommendation ? Object.keys(selectedRecommendation.breakdown).map(function (key) {
      return '<span class="detail-tag">' + formatBreakdownLabel(key) + ': ' + selectedRecommendation.breakdown[key] + '</span>';
    }).join('') : '<span class="micro-copy">This topic is not in the current top recommendation set.</span>';
    const cycleMarkup = app.state.cycleAlert ? '<article class="detail-card"><h3 class="detail-title">Cycle alert</h3><p class="detail-copy">' + app.escapeHtml(app.state.cycleAlert.message) + '</p><div class="detail-tag-row">' + (app.state.cycleAlert.path || []).map(function (id) {
      const linkedTopic = app.state.analysis.indexes.topicById[id];
      return '<span class="detail-tag negative">' + app.escapeHtml(linkedTopic ? linkedTopic.title : id) + '</span>';
    }).join('') + '</div></article>' : '';

    app.state.elements.detailPanel.innerHTML = [
      cycleMarkup,
      '<article class="detail-card"><h3 class="detail-title">' + app.escapeHtml(topic.title) + '</h3><p class="detail-copy">' + app.escapeHtml(topic.description) + '</p><div class="detail-meta"><span class="detail-tag">' + app.escapeHtml(topic.category) + '</span><span class="detail-tag">Difficulty ' + topic.difficulty + '</span><span class="detail-tag">' + topic.estimatedHours + 'h estimate</span><span class="detail-tag">' + app.capitalize(meta.state) + '</span>' + (meta.recommended ? '<span class="detail-tag positive">Current best recommendation</span>' : '') + '</div><div class="mastery-shell"><div class="mastery-meta"><span class="micro-copy">Mastery tracker</span><span class="mastery-value">' + topic.mastery + '%</span></div><input data-mastery-slider type="range" min="0" max="100" step="5" value="' + topic.mastery + '"><div class="mastery-actions"><button class="mastery-button" type="button" data-mastery-step="-25">-25%</button><button class="mastery-button" type="button" data-mastery-step="25">+25%</button><button class="ghost-button" type="button" data-edit-selected>Edit topic</button><button class="ghost-button" type="button" data-delete-selected>Delete</button></div></div></article>',
      '<article class="detail-card"><h3 class="detail-title">Unlock explanation</h3><p class="detail-copy">' + app.buildUnlockCopy(topic, meta) + '</p><div class="detail-tag-row">' + blockerMarkup + '</div></article>',
      '<article class="detail-card"><h3 class="detail-title">Recommendation score breakdown</h3><div class="detail-tag-row">' + breakdownMarkup + '</div></article>',
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
    const analysis = app.state.analysis;
    const inProgress = analysis.topics.filter(function (topic) { return analysis.metaById[topic.id].state === 'in-progress'; });
    const locked = analysis.topics.filter(function (topic) { return analysis.metaById[topic.id].state === 'locked'; });
    const highImpact = analysis.topics.slice().sort(function (left, right) {
      return analysis.metaById[right.id].dependents.length - analysis.metaById[left.id].dependents.length;
    }).slice(0, 3);
    const nearFinish = analysis.topics.filter(function (topic) { return topic.mastery >= 70 && topic.mastery < 100; }).slice(0, 3);

    app.state.elements.signalsPanel.innerHTML = [
      '<article class="signal-card"><h3 class="signal-title">Momentum lane</h3><p class="signal-copy">' + (inProgress.length ? inProgress.map(function (topic) { return topic.title + ' (' + topic.mastery + '%)'; }).join(', ') : 'No topics are in progress right now.') + '</p></article>',
      '<article class="signal-card"><h3 class="signal-title">Blocker pressure</h3><p class="signal-copy">' + (locked[0] ? locked[0].title + ' is blocked by ' + app.topicNameList(analysis.metaById[locked[0].id].blockedBy) + '.' : 'No blocked topics right now.') + '</p></article>',
      '<article class="signal-card"><h3 class="signal-title">High-impact topics</h3><p class="signal-copy">' + (highImpact.length ? highImpact.map(function (topic) { return topic.title + ' (' + analysis.metaById[topic.id].dependents.length + ' downstream)'; }).join(', ') : 'No dependency impact data available.') + '</p></article>',
      '<article class="signal-card"><h3 class="signal-title">Close to mastery</h3><p class="signal-copy">' + (nearFinish.length ? nearFinish.map(function (topic) { return topic.title + ' (' + topic.mastery + '%)'; }).join(', ') : 'No topics are close to the finish line yet.') + '</p></article>'
    ].join('');
  }

  function renderSprint() {
    const sprint = app.getSprintPlan();
    app.state.elements.sprintPanel.innerHTML = [
      '<article class="detail-card"><h3 class="detail-title">Weekly allocation</h3><p class="detail-copy">Scheduled ' + sprint.scheduledHours + ' of ' + sprint.totalHours + ' available hours.</p><div class="detail-tag-row"><span class="detail-tag positive">Scheduled ' + sprint.scheduledHours + 'h</span><span class="detail-tag">Unscheduled ' + sprint.unscheduledHours + 'h</span></div></article>',
      '<div class="sprint-grid">' + sprint.days.map(function (day) {
        const sessions = day.sessions.length ? day.sessions.map(function (session) {
          return '<div class="sprint-session"><strong>' + app.escapeHtml(session.title) + '</strong><span>' + session.hours + 'h | ' + app.escapeHtml(session.reason) + '</span></div>';
        }).join('') : '<p class="micro-copy">Buffer, revision, or practice set.</p>';
        return '<article class="sprint-day"><div class="section-heading"><span>' + day.label + '</span><span class="micro-copy">' + Math.round((day.capacity - day.remaining) * 10) / 10 + '/' + day.capacity + 'h</span></div>' + sessions + '</article>';
      }).join('') + '</div>'
    ].join('');
  }

  function renderAll() {
    app.analyzeState();
    renderFilters();
    renderTemplates();
    renderHero();
    renderStats();
    renderGraph();
    renderQueue();
    renderRecommendations();
    renderSimulation();
    renderDetails();
    renderCategoryProgress();
    renderSignals();
    renderSprint();
  }

  app.buildEmptyCard = buildEmptyCard;
  app.renderGraph = renderGraph;
  app.renderAll = renderAll;
})();
