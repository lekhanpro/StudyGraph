(function () {
  const storageKey = "studygraph.v1";
  const masteryThreshold = 75;
  const graphPadding = 220;

  const categoryMeta = {
    Foundations: { color: "#67b7ff", tint: "rgba(103, 183, 255, 0.16)" },
    DSA: { color: "#70a7ff", tint: "rgba(112, 167, 255, 0.16)" },
    Systems: { color: "#ff8e73", tint: "rgba(255, 142, 115, 0.18)" },
    Math: { color: "#f6c667", tint: "rgba(246, 198, 103, 0.18)" },
    AI: { color: "#49d18f", tint: "rgba(73, 209, 143, 0.18)" },
    Web: { color: "#59d4d0", tint: "rgba(89, 212, 208, 0.18)" }
  };

  const statusFilters = [
    { value: "all", label: "All" },
    { value: "recommended", label: "Recommended" },
    { value: "unlocked", label: "Unlocked" },
    { value: "in-progress", label: "In progress" },
    { value: "locked", label: "Locked" },
    { value: "mastered", label: "Mastered" }
  ];

  const defaultGraph = {
    topics: [
      { id: "c-basics", title: "C Basics", description: "Variables, data types, compilation, and the mental model for memory.", category: "Systems", difficulty: 2, estimatedHours: 4, mastery: 80, x: 120, y: 150 },
      { id: "variables", title: "Variables", description: "State, assignment, and data flow for beginner programs.", category: "Foundations", difficulty: 1, estimatedHours: 2, mastery: 100, x: 120, y: 360 },
      { id: "loops", title: "Loops", description: "Iteration patterns and tracing execution over repeated steps.", category: "Foundations", difficulty: 2, estimatedHours: 3, mastery: 90, x: 380, y: 360 },
      { id: "functions", title: "Functions", description: "Reusable logic, parameters, return values, and decomposition.", category: "Foundations", difficulty: 2, estimatedHours: 4, mastery: 76, x: 640, y: 360 },
      { id: "arrays", title: "Arrays", description: "Indexed storage, traversal, and fixed-size data layouts.", category: "DSA", difficulty: 3, estimatedHours: 5, mastery: 55, x: 900, y: 240 },
      { id: "pointers", title: "Pointers", description: "Memory addresses, references, dereferencing, and aliasing.", category: "Systems", difficulty: 4, estimatedHours: 6, mastery: 20, x: 900, y: 480 },
      { id: "recursion", title: "Recursion", description: "Recursive thinking, base cases, and stack-driven execution.", category: "DSA", difficulty: 3, estimatedHours: 5, mastery: 15, x: 1160, y: 240 },
      { id: "linked-lists", title: "Linked Lists", description: "Nodes, pointers, and dynamic structures that trade indexing for flexibility.", category: "DSA", difficulty: 4, estimatedHours: 6, mastery: 0, x: 1160, y: 520 },
      { id: "trees", title: "Trees", description: "Hierarchies, traversals, and recursive relationships between nodes.", category: "DSA", difficulty: 4, estimatedHours: 7, mastery: 0, x: 1420, y: 520 },
      { id: "linear-algebra", title: "Linear Algebra", description: "Vectors, matrices, and geometric intuition used in ML.", category: "Math", difficulty: 3, estimatedHours: 6, mastery: 48, x: 620, y: 110 },
      { id: "probability", title: "Probability", description: "Random variables, distributions, expectation, and uncertainty.", category: "Math", difficulty: 3, estimatedHours: 5, mastery: 0, x: 900, y: 40 },
      { id: "ml-basics", title: "ML Basics", description: "Features, training loops, evaluation, and the language of models.", category: "AI", difficulty: 4, estimatedHours: 8, mastery: 0, x: 1170, y: 40 }
    ],
    edges: [
      { from: "variables", to: "loops" },
      { from: "loops", to: "functions" },
      { from: "functions", to: "arrays" },
      { from: "functions", to: "recursion" },
      { from: "c-basics", to: "pointers" },
      { from: "functions", to: "pointers" },
      { from: "arrays", to: "linked-lists" },
      { from: "pointers", to: "linked-lists" },
      { from: "linked-lists", to: "trees" },
      { from: "arrays", to: "trees" },
      { from: "arrays", to: "probability" },
      { from: "linear-algebra", to: "ml-basics" },
      { from: "probability", to: "ml-basics" }
    ]
  };

  const state = {
    topics: [],
    edges: [],
    selectedTopicId: null,
    filters: { search: "", category: "all", status: "all", difficulty: "all" },
    cycleAlert: null,
    analysis: null,
    drag: null,
    elements: {}
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function capitalize(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
  }

  function categoryList() {
    return Object.keys(categoryMeta);
  }

  function getCategoryMeta(category) {
    return categoryMeta[category] || { color: "#67b7ff", tint: "rgba(103, 183, 255, 0.16)" };
  }

  function stateColor(status) {
    if (status === "mastered") return "#49d18f";
    if (status === "in-progress") return "#f6c667";
    if (status === "unlocked") return "#67b7ff";
    return "#7687a4";
  }

  function slugify(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "topic";
  }

  function dedupeId(id) {
    if (!state.topics.some(function (topic) { return topic.id === id; })) return id;
    let suffix = 2;
    while (state.topics.some(function (topic) { return topic.id === id + "-" + suffix; })) suffix += 1;
    return id + "-" + suffix;
  }

  function loadState() {
    try {
      const persisted = window.localStorage.getItem(storageKey);
      const parsed = persisted ? JSON.parse(persisted) : clone(defaultGraph);
      state.topics = Array.isArray(parsed.topics) ? parsed.topics : clone(defaultGraph.topics);
      state.edges = Array.isArray(parsed.edges) ? parsed.edges : clone(defaultGraph.edges);
      state.selectedTopicId = parsed.selectedTopicId || (state.topics[0] && state.topics[0].id) || null;
    } catch (error) {
      state.topics = clone(defaultGraph.topics);
      state.edges = clone(defaultGraph.edges);
      state.selectedTopicId = state.topics[0] ? state.topics[0].id : null;
    }
  }

  function saveState() {
    window.localStorage.setItem(storageKey, JSON.stringify({
      topics: state.topics,
      edges: state.edges,
      selectedTopicId: state.selectedTopicId
    }));
  }

  function analyzeState() {
    state.analysis = window.GraphEngine.analyze(state.topics, state.edges, { masteryThreshold: masteryThreshold });
    if (!state.selectedTopicId || !state.analysis.metaById[state.selectedTopicId]) {
      state.selectedTopicId = state.analysis.recommendation ? state.analysis.recommendation.id : (state.topics[0] && state.topics[0].id);
    }
    if (state.analysis.cyclePath.length && !state.cycleAlert) {
      state.cycleAlert = { message: "The stored roadmap has a cycle. Remove one of the highlighted links.", path: state.analysis.cyclePath };
    }
  }

  function getSelectedTopic() {
    return state.topics.find(function (topic) { return topic.id === state.selectedTopicId; }) || null;
  }

  function topicNameList(topicIds) {
    return topicIds.map(function (topicId) {
      const topic = state.analysis && state.analysis.indexes.topicById[topicId];
      return topic ? topic.title : topicId;
    }).join(", ");
  }

  function buildUnlockCopy(topic, meta) {
    if (meta.state === "mastered") return escapeHtml(topic.title) + " is already mastered and can act as a prerequisite for deeper topics.";
    if (!meta.blockedBy.length) return escapeHtml(topic.title) + " is unlocked because every prerequisite is at or above " + masteryThreshold + "% mastery.";
    return "To unlock " + escapeHtml(topic.title) + ", complete " + escapeHtml(topicNameList(meta.blockedBy)) + " first.";
  }

  function getFilteredTopics() {
    const search = state.filters.search;
    return state.analysis.topics.filter(function (topic) {
      const meta = state.analysis.metaById[topic.id];
      const matchesSearch = !search || topic.title.toLowerCase().includes(search) || topic.description.toLowerCase().includes(search);
      const matchesCategory = state.filters.category === "all" || topic.category === state.filters.category;
      const statusValue = meta.recommended ? "recommended" : meta.state;
      const matchesStatus = state.filters.status === "all" || state.filters.status === meta.state || state.filters.status === statusValue;
      const matchesDifficulty = state.filters.difficulty === "all"
        || (state.filters.difficulty === "easy" && topic.difficulty <= 2)
        || (state.filters.difficulty === "medium" && topic.difficulty === 3)
        || (state.filters.difficulty === "hard" && topic.difficulty >= 4);
      return matchesSearch && matchesCategory && matchesStatus && matchesDifficulty;
    });
  }

  function getGraphBounds(topics) {
    if (!topics.length) return { width: 1280, height: 760 };
    const maxX = topics.reduce(function (current, topic) { return Math.max(current, topic.x); }, 0);
    const maxY = topics.reduce(function (current, topic) { return Math.max(current, topic.y); }, 0);
    return { width: maxX + graphPadding, height: maxY + graphPadding };
  }

  function getNextTopicPosition() {
    if (!state.topics.length) return { x: 120, y: 160 };
    const column = state.topics.length % 4;
    const row = Math.floor(state.topics.length / 4);
    return { x: 140 + column * 240, y: 140 + row * 180 };
  }

  function upsertTopic(payload) {
    if (payload.id) {
      const topic = state.topics.find(function (item) { return item.id === payload.id; });
      if (!topic) return;
      Object.assign(topic, payload);
    } else {
      const nextPosition = getNextTopicPosition();
      const newId = dedupeId(slugify(payload.title));
      state.topics.push(Object.assign({ x: nextPosition.x, y: nextPosition.y }, payload, { id: newId }));
      state.selectedTopicId = newId;
    }
    state.cycleAlert = null;
    saveState();
  }

  function setMastery(topicId, mastery) {
    const topic = state.topics.find(function (item) { return item.id === topicId; });
    if (!topic) return;
    topic.mastery = clamp(Number(mastery), 0, 100);
    state.cycleAlert = null;
    saveState();
  }

  function stepMastery(topicId, delta) {
    const topic = state.topics.find(function (item) { return item.id === topicId; });
    if (!topic) return;
    setMastery(topicId, topic.mastery + delta);
  }

  function deleteTopic(topicId) {
    state.topics = state.topics.filter(function (topic) { return topic.id !== topicId; });
    state.edges = state.edges.filter(function (edge) { return edge.from !== topicId && edge.to !== topicId; });
    state.selectedTopicId = state.topics[0] ? state.topics[0].id : null;
    state.cycleAlert = null;
    saveState();
  }

  function removeEdge(fromId, toId) {
    state.edges = state.edges.filter(function (edge) { return !(edge.from === fromId && edge.to === toId); });
    state.cycleAlert = null;
    saveState();
  }

  function addEdge(fromId, toId) {
    if (!fromId || !toId) return { ok: false };
    if (fromId === toId) {
      state.cycleAlert = { message: "A topic cannot depend on itself.", path: [fromId, toId] };
      return { ok: false };
    }
    if (state.edges.some(function (edge) { return edge.from === fromId && edge.to === toId; })) return { ok: false };
    const cycleCheck = window.GraphEngine.wouldCreateCycle(state.topics, state.edges, fromId, toId);
    if (cycleCheck.wouldCycle) {
      state.cycleAlert = { message: "That link creates a cycle and would break prerequisite order.", path: cycleCheck.path };
      return { ok: false };
    }
    state.edges.push({ from: fromId, to: toId });
    state.cycleAlert = null;
    saveState();
    return { ok: true };
  }

  function exportGraph() {
    const payload = {
      exportedAt: new Date().toISOString(),
      masteryThreshold: masteryThreshold,
      topics: state.topics,
      edges: state.edges
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "studygraph-roadmap.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetDemo() {
    state.topics = clone(defaultGraph.topics);
    state.edges = clone(defaultGraph.edges);
    state.selectedTopicId = state.topics[0] ? state.topics[0].id : null;
    state.cycleAlert = null;
    saveState();
  }

  window.StudyGraph = {
    state: state,
    storageKey: storageKey,
    masteryThreshold: masteryThreshold,
    graphPadding: graphPadding,
    categoryMeta: categoryMeta,
    statusFilters: statusFilters,
    defaultGraph: defaultGraph,
    clone: clone,
    clamp: clamp,
    escapeHtml: escapeHtml,
    capitalize: capitalize,
    categoryList: categoryList,
    getCategoryMeta: getCategoryMeta,
    stateColor: stateColor,
    loadState: loadState,
    saveState: saveState,
    analyzeState: analyzeState,
    getSelectedTopic: getSelectedTopic,
    topicNameList: topicNameList,
    buildUnlockCopy: buildUnlockCopy,
    getFilteredTopics: getFilteredTopics,
    getGraphBounds: getGraphBounds,
    upsertTopic: upsertTopic,
    setMastery: setMastery,
    stepMastery: stepMastery,
    deleteTopic: deleteTopic,
    removeEdge: removeEdge,
    addEdge: addEdge,
    exportGraph: exportGraph,
    resetDemo: resetDemo
  };
})();


