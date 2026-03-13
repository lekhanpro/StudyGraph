(function () {
  const app = window.StudyGraph;
  const state = app.state;

  function cacheElements() {
    state.elements = {
      statsGrid: document.getElementById('stats-grid'),
      queuePanel: document.getElementById('queue-panel'),
      recommendationPanel: document.getElementById('recommendation-panel'),
      detailPanel: document.getElementById('detail-panel'),
      categoryProgress: document.getElementById('category-progress'),
      signalsPanel: document.getElementById('signals-panel'),
      searchInput: document.getElementById('search-input'),
      categoryFilters: document.getElementById('category-filters'),
      statusFilters: document.getElementById('status-filters'),
      difficultyFilter: document.getElementById('difficulty-filter'),
      clearFiltersButton: document.getElementById('clear-filters-button'),
      visibleCountBadge: document.getElementById('visible-count-badge'),
      canvasScroll: document.querySelector('.canvas-scroll'),
      graphStage: document.getElementById('graph-stage'),
      graphNodes: document.getElementById('graph-nodes'),
      graphEdges: document.getElementById('graph-edges'),
      topicDialog: document.getElementById('topic-dialog'),
      topicDialogTitle: document.getElementById('topic-dialog-title'),
      topicForm: document.getElementById('topic-form'),
      topicId: document.getElementById('topic-id'),
      topicTitle: document.getElementById('topic-title'),
      topicDescription: document.getElementById('topic-description'),
      topicCategory: document.getElementById('topic-category'),
      topicDifficulty: document.getElementById('topic-difficulty'),
      topicHours: document.getElementById('topic-hours'),
      topicMastery: document.getElementById('topic-mastery'),
      dependencyDialog: document.getElementById('dependency-dialog'),
      dependencyForm: document.getElementById('dependency-form'),
      dependencyFrom: document.getElementById('dependency-from'),
      dependencyTo: document.getElementById('dependency-to'),
      topicButton: document.getElementById('topic-button'),
      dependencyButton: document.getElementById('dependency-button'),
      exportButton: document.getElementById('export-button'),
      resetButton: document.getElementById('reset-button'),
      closeTopicDialog: document.getElementById('close-topic-dialog'),
      cancelTopicButton: document.getElementById('cancel-topic-button'),
      closeDependencyDialog: document.getElementById('close-dependency-dialog'),
      cancelDependencyButton: document.getElementById('cancel-dependency-button')
    };
  }

  function openTopicDialog(topic) {
    state.elements.topicCategory.innerHTML = app.categoryList().map(function (category) {
      return '<option value="' + category + '">' + category + '</option>';
    }).join('');

    if (topic) {
      state.elements.topicDialogTitle.textContent = 'Edit topic';
      state.elements.topicId.value = topic.id;
      state.elements.topicTitle.value = topic.title;
      state.elements.topicDescription.value = topic.description;
      state.elements.topicCategory.value = topic.category;
      state.elements.topicDifficulty.value = String(topic.difficulty);
      state.elements.topicHours.value = String(topic.estimatedHours);
      state.elements.topicMastery.value = String(topic.mastery);
    } else {
      state.elements.topicDialogTitle.textContent = 'Add topic';
      state.elements.topicForm.reset();
      state.elements.topicId.value = '';
      state.elements.topicCategory.value = app.categoryList()[0];
      state.elements.topicDifficulty.value = '2';
      state.elements.topicHours.value = '3';
      state.elements.topicMastery.value = '0';
    }

    state.elements.topicDialog.showModal();
  }

  function openDependencyDialog() {
    const options = state.topics.map(function (topic) {
      return '<option value="' + topic.id + '">' + app.escapeHtml(topic.title) + '</option>';
    }).join('');
    state.elements.dependencyFrom.innerHTML = options;
    state.elements.dependencyTo.innerHTML = options;
    if (state.analysis && state.analysis.recommendation) {
      state.elements.dependencyTo.value = state.analysis.recommendation.id;
    }
    state.elements.dependencyDialog.showModal();
  }

  function closeTopicDialog() {
    state.elements.topicDialog.close();
  }

  function closeDependencyDialog() {
    state.elements.dependencyDialog.close();
  }

  function handleTopicSubmit(event) {
    event.preventDefault();
    const formData = new FormData(state.elements.topicForm);
    const title = String(formData.get('title') || '').trim();
    if (!title) return;
    app.upsertTopic({
      id: String(formData.get('topicId') || ''),
      title: title,
      description: String(formData.get('description') || '').trim(),
      category: String(formData.get('category') || 'Foundations'),
      difficulty: app.clamp(Number(formData.get('difficulty')), 1, 5),
      estimatedHours: app.clamp(Number(formData.get('estimatedHours')), 1, 40),
      mastery: app.clamp(Number(formData.get('mastery')), 0, 100)
    });
    closeTopicDialog();
    app.renderAll();
  }

  function handleDependencySubmit(event) {
    event.preventDefault();
    const formData = new FormData(state.elements.dependencyForm);
    app.addEdge(String(formData.get('from') || ''), String(formData.get('to') || ''));
    closeDependencyDialog();
    app.renderAll();
  }

  function handlePanelTopicSelect(event) {
    const button = event.target.closest('[data-topic-select]');
    if (!button) return;
    state.selectedTopicId = button.dataset.topicSelect;
    app.renderAll();
  }

  function handleDetailClicks(event) {
    const target = event.target;
    if (target.matches('[data-edit-selected]')) {
      openTopicDialog(app.getSelectedTopic());
      return;
    }
    if (target.matches('[data-delete-selected]')) {
      const selected = app.getSelectedTopic();
      if (selected && window.confirm('Delete "' + selected.title + '" and remove all of its prerequisite links?')) {
        app.deleteTopic(selected.id);
        app.renderAll();
      }
      return;
    }
    if (target.matches('[data-mastery-step]')) {
      const selectedTopic = app.getSelectedTopic();
      if (selectedTopic) {
        app.stepMastery(selectedTopic.id, Number(target.dataset.masteryStep));
        app.renderAll();
      }
      return;
    }
    if (target.matches('[data-focus-topic]')) {
      state.selectedTopicId = target.dataset.focusTopic;
      app.renderAll();
      return;
    }
    if (target.matches('[data-remove-edge]')) {
      app.removeEdge(target.dataset.from, target.dataset.to);
      app.renderAll();
    }
  }

  function handleDetailInputs(event) {
    if (!event.target.matches('[data-mastery-slider]')) return;
    const selectedTopic = app.getSelectedTopic();
    if (!selectedTopic) return;
    app.setMastery(selectedTopic.id, Number(event.target.value));
    app.renderAll();
  }

  function handlePointerDown(event) {
    const node = event.target.closest('.topic-node');
    if (!node || event.button !== 0) return;
    const topic = state.topics.find(function (item) { return item.id === node.dataset.id; });
    if (!topic) return;
    const stageRect = state.elements.canvasScroll.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    state.drag = {
      id: topic.id,
      pointerId: event.pointerId,
      offsetX: event.clientX - nodeRect.left,
      offsetY: event.clientY - nodeRect.top,
      stageLeft: stageRect.left,
      stageTop: stageRect.top,
      moved: false
    };
  }

  function handlePointerMove(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) return;
    const topic = state.topics.find(function (item) { return item.id === state.drag.id; });
    if (!topic) return;
    topic.x = Math.round(app.clamp(event.clientX - state.drag.stageLeft - state.drag.offsetX + state.elements.canvasScroll.scrollLeft, 24, 2400));
    topic.y = Math.round(app.clamp(event.clientY - state.drag.stageTop - state.drag.offsetY + state.elements.canvasScroll.scrollTop, 24, 1800));
    state.drag.moved = true;
    app.renderGraph();
  }

  function handlePointerUp(event) {
    if (!state.drag || event.pointerId !== state.drag.pointerId) return;
    if (!state.drag.moved) state.selectedTopicId = state.drag.id;
    else app.saveState();
    state.drag = null;
    app.renderAll();
  }

  function bindEvents() {
    state.elements.searchInput.addEventListener('input', function (event) {
      state.filters.search = event.target.value.trim().toLowerCase();
      app.renderAll();
    });
    state.elements.difficultyFilter.addEventListener('change', function (event) {
      state.filters.difficulty = event.target.value;
      app.renderAll();
    });
    state.elements.clearFiltersButton.addEventListener('click', function () {
      state.filters = { search: '', category: 'all', status: 'all', difficulty: 'all' };
      state.elements.searchInput.value = '';
      state.elements.difficultyFilter.value = 'all';
      app.renderAll();
    });
    state.elements.topicButton.addEventListener('click', function () { openTopicDialog(); });
    state.elements.dependencyButton.addEventListener('click', openDependencyDialog);
    state.elements.exportButton.addEventListener('click', app.exportGraph);
    state.elements.resetButton.addEventListener('click', function () { app.resetDemo(); app.renderAll(); });
    state.elements.closeTopicDialog.addEventListener('click', closeTopicDialog);
    state.elements.cancelTopicButton.addEventListener('click', closeTopicDialog);
    state.elements.closeDependencyDialog.addEventListener('click', closeDependencyDialog);
    state.elements.cancelDependencyButton.addEventListener('click', closeDependencyDialog);
    state.elements.topicForm.addEventListener('submit', handleTopicSubmit);
    state.elements.dependencyForm.addEventListener('submit', handleDependencySubmit);
    state.elements.graphNodes.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    state.elements.graphNodes.addEventListener('click', function (event) {
      const node = event.target.closest('.topic-node');
      if (!node || (state.drag && state.drag.moved)) return;
      state.selectedTopicId = node.dataset.id;
      app.renderAll();
    });
    state.elements.detailPanel.addEventListener('click', handleDetailClicks);
    state.elements.detailPanel.addEventListener('input', handleDetailInputs);
    state.elements.recommendationPanel.addEventListener('click', handlePanelTopicSelect);
    state.elements.queuePanel.addEventListener('click', handlePanelTopicSelect);
  }

  cacheElements();
  app.loadState();
  bindEvents();
  app.renderAll();
})();

