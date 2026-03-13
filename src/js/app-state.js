(function () {
  const storageKey = "studygraph.v2";
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

  const roadmapLibrary = {
    "cs-core": {
      label: "CS Core",
      tagline: "Classic first-year computer science ladder",
      accent: "#67b7ff",
      description: "Build fundamentals, DSA depth, and enough math to transition into ML.",
      graph: {
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
          { from: "variables", to: "loops" }, { from: "loops", to: "functions" }, { from: "functions", to: "arrays" },
          { from: "functions", to: "recursion" }, { from: "c-basics", to: "pointers" }, { from: "functions", to: "pointers" },
          { from: "arrays", to: "linked-lists" }, { from: "pointers", to: "linked-lists" }, { from: "linked-lists", to: "trees" },
          { from: "arrays", to: "trees" }, { from: "arrays", to: "probability" }, { from: "linear-algebra", to: "ml-basics" }, { from: "probability", to: "ml-basics" }
        ]
      }
    },
    "web-builder": {
      label: "Web Builder",
      tagline: "From HTML to a portfolio-grade full-stack frontend",
      accent: "#59d4d0",
      description: "Map the progression from browser basics to React, APIs, auth, and deployment.",
      graph: {
        topics: [
          { id: "html", title: "HTML Semantics", description: "Build accessible page structure and content hierarchy.", category: "Web", difficulty: 1, estimatedHours: 2, mastery: 85, x: 120, y: 220 },
          { id: "css", title: "CSS Systems", description: "Layout, spacing, responsive rules, and component styling.", category: "Web", difficulty: 2, estimatedHours: 4, mastery: 68, x: 360, y: 220 },
          { id: "js-core", title: "JavaScript Core", description: "Control flow, objects, arrays, and functions in the browser.", category: "Foundations", difficulty: 2, estimatedHours: 5, mastery: 62, x: 620, y: 220 },
          { id: "dom", title: "DOM Manipulation", description: "Events, updates, and interactive UI wiring.", category: "Web", difficulty: 2, estimatedHours: 4, mastery: 35, x: 890, y: 160 },
          { id: "async", title: "Async JavaScript", description: "Promises, fetch, and asynchronous thinking.", category: "Web", difficulty: 3, estimatedHours: 4, mastery: 10, x: 890, y: 360 },
          { id: "react", title: "React Fundamentals", description: "Components, props, state, and composition.", category: "Web", difficulty: 3, estimatedHours: 6, mastery: 0, x: 1160, y: 160 },
          { id: "next", title: "Next.js App Patterns", description: "Routing, layouts, and shipping polished web apps.", category: "Web", difficulty: 4, estimatedHours: 6, mastery: 0, x: 1420, y: 160 },
          { id: "apis", title: "REST APIs", description: "Requests, payloads, error handling, and data contracts.", category: "Systems", difficulty: 3, estimatedHours: 5, mastery: 20, x: 1160, y: 360 },
          { id: "auth", title: "Authentication", description: "User sessions, tokens, and protected routes.", category: "Systems", difficulty: 4, estimatedHours: 6, mastery: 0, x: 1420, y: 360 },
          { id: "deploy", title: "Deployment", description: "Preview builds, environments, and production release flow.", category: "Web", difficulty: 2, estimatedHours: 3, mastery: 0, x: 1680, y: 260 }
        ],
        edges: [
          { from: "html", to: "css" }, { from: "css", to: "js-core" }, { from: "js-core", to: "dom" },
          { from: "js-core", to: "async" }, { from: "dom", to: "react" }, { from: "async", to: "react" },
          { from: "react", to: "next" }, { from: "async", to: "apis" }, { from: "apis", to: "auth" },
          { from: "next", to: "deploy" }, { from: "auth", to: "deploy" }
        ]
      }
    },
    "ai-lab": {
      label: "AI Lab",
      tagline: "Math, Python, ML, and modern GenAI systems",
      accent: "#49d18f",
      description: "Balance fundamentals, model thinking, and applied AI shipping skills.",
      graph: {
        topics: [
          { id: "python", title: "Python Basics", description: "Syntax, data structures, notebooks, and scripting flow.", category: "Foundations", difficulty: 1, estimatedHours: 3, mastery: 88, x: 120, y: 280 },
          { id: "numpy", title: "NumPy", description: "Arrays, vectorized math, and data shaping.", category: "AI", difficulty: 2, estimatedHours: 4, mastery: 54, x: 380, y: 280 },
          { id: "lin-alg", title: "Linear Algebra", description: "Vectors, matrices, and transformations for ML intuition.", category: "Math", difficulty: 3, estimatedHours: 6, mastery: 46, x: 640, y: 160 },
          { id: "prob", title: "Probability", description: "Randomness, distributions, and uncertainty reasoning.", category: "Math", difficulty: 3, estimatedHours: 5, mastery: 28, x: 640, y: 400 },
          { id: "data-prep", title: "Data Preparation", description: "Cleaning, splitting, scaling, and feature setup.", category: "AI", difficulty: 2, estimatedHours: 4, mastery: 18, x: 900, y: 280 },
          { id: "ml", title: "ML Fundamentals", description: "Training loops, loss, evaluation, and baseline models.", category: "AI", difficulty: 4, estimatedHours: 7, mastery: 0, x: 1160, y: 180 },
          { id: "nn", title: "Neural Networks", description: "Layers, activations, gradient intuition, and overfitting.", category: "AI", difficulty: 4, estimatedHours: 8, mastery: 0, x: 1420, y: 180 },
          { id: "prompt", title: "Prompt Engineering", description: "Reliable prompting patterns and eval-driven iteration.", category: "AI", difficulty: 2, estimatedHours: 3, mastery: 35, x: 1160, y: 420 },
          { id: "rag", title: "RAG Systems", description: "Retrieval, embeddings, grounding, and answer orchestration.", category: "AI", difficulty: 4, estimatedHours: 6, mastery: 0, x: 1420, y: 420 },
          { id: "ship-ai", title: "AI Product Shipping", description: "Deploying AI features with UX, observability, and iteration loops.", category: "Systems", difficulty: 3, estimatedHours: 5, mastery: 0, x: 1680, y: 300 }
        ],
        edges: [
          { from: "python", to: "numpy" }, { from: "numpy", to: "data-prep" }, { from: "lin-alg", to: "ml" },
          { from: "prob", to: "ml" }, { from: "data-prep", to: "ml" }, { from: "ml", to: "nn" },
          { from: "ml", to: "prompt" }, { from: "prompt", to: "rag" }, { from: "nn", to: "ship-ai" },
          { from: "rag", to: "ship-ai" }
        ]
      }
    }
  };

  const defaultGraph = roadmapLibrary["cs-core"].graph;

  const state = {
    topics: [],
    edges: [],
    selectedTopicId: null,
    filters: { search: "", category: "all", status: "all", difficulty: "all" },
    cycleAlert: null,
    analysis: null,
    drag: null,
    elements: {},
    ui: {
      activeTemplate: "cs-core",
      weeklyHours: 10,
      simulationMastery: 0,
      activeAnalyticsView: "progress",
      activeInspectorView: "focus"
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
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
      const parsed = persisted ? JSON.parse(persisted) : {};
      const templateKey = parsed.ui && parsed.ui.activeTemplate && roadmapLibrary[parsed.ui.activeTemplate] ? parsed.ui.activeTemplate : "cs-core";
      const fallbackGraph = clone(roadmapLibrary[templateKey].graph);
      state.topics = Array.isArray(parsed.topics) ? parsed.topics : fallbackGraph.topics;
      state.edges = Array.isArray(parsed.edges) ? parsed.edges : fallbackGraph.edges;
      state.selectedTopicId = parsed.selectedTopicId || (state.topics[0] && state.topics[0].id) || null;
      state.ui = Object.assign({
        activeTemplate: templateKey,
        weeklyHours: 10,
        simulationMastery: 0,
        activeAnalyticsView: "progress",
        activeInspectorView: "focus"
      }, parsed.ui || {});
    } catch (error) {
      const fallbackGraph = clone(defaultGraph);
      state.topics = fallbackGraph.topics;
      state.edges = fallbackGraph.edges;
      state.selectedTopicId = state.topics[0] ? state.topics[0].id : null;
      state.ui = {
        activeTemplate: "cs-core",
        weeklyHours: 10,
        simulationMastery: 0,
        activeAnalyticsView: "progress",
        activeInspectorView: "focus"
      };
    }
  }

  function saveState() {
    window.localStorage.setItem(storageKey, JSON.stringify({
      topics: state.topics,
      edges: state.edges,
      selectedTopicId: state.selectedTopicId,
      ui: state.ui
    }));
  }

  function selectTopic(topicId) {
    state.selectedTopicId = topicId;
    const topic = state.topics.find(function (item) { return item.id === topicId; });
    if (topic) {
      state.ui.simulationMastery = topic.mastery;
      state.ui.activeInspectorView = "details";
    }
  }

  function analyzeState() {
    state.analysis = window.GraphEngine.analyze(state.topics, state.edges, { masteryThreshold: masteryThreshold });
    if (!state.selectedTopicId || !state.analysis.metaById[state.selectedTopicId]) {
      state.selectedTopicId = state.analysis.recommendation ? state.analysis.recommendation.id : (state.topics[0] && state.topics[0].id);
    }
    if (state.analysis.cyclePath.length && !state.cycleAlert) {
      state.cycleAlert = { message: "The stored roadmap has a cycle. Remove one of the highlighted links.", path: state.analysis.cyclePath };
    }
    const selectedTopic = getSelectedTopic();
    if (selectedTopic && (state.ui.simulationMastery === null || state.ui.simulationMastery === undefined)) {
      state.ui.simulationMastery = selectedTopic.mastery;
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
      state.ui.simulationMastery = payload.mastery;
    }
    state.cycleAlert = null;
    saveState();
  }

  function setMastery(topicId, mastery) {
    const topic = state.topics.find(function (item) { return item.id === topicId; });
    if (!topic) return;
    topic.mastery = clamp(Number(mastery), 0, 100);
    if (state.selectedTopicId === topicId) {
      state.ui.simulationMastery = topic.mastery;
    }
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
      ui: state.ui,
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

  function importGraphText(rawText) {
    const parsed = JSON.parse(rawText);
    if (!parsed || !Array.isArray(parsed.topics) || !Array.isArray(parsed.edges)) {
      throw new Error("Invalid roadmap JSON. Expected topics and edges arrays.");
    }
    state.topics = parsed.topics;
    state.edges = parsed.edges;
    state.selectedTopicId = parsed.selectedTopicId || (parsed.topics[0] && parsed.topics[0].id) || null;
    state.ui.activeTemplate = parsed.ui && parsed.ui.activeTemplate ? parsed.ui.activeTemplate : "custom";
    state.ui.weeklyHours = parsed.ui && parsed.ui.weeklyHours ? clamp(Number(parsed.ui.weeklyHours), 4, 24) : state.ui.weeklyHours;
    state.ui.simulationMastery = state.selectedTopicId ? (parsed.topics.find(function (topic) { return topic.id === state.selectedTopicId; }) || { mastery: 0 }).mastery : 0;
    state.cycleAlert = null;
    saveState();
  }

  function setWeeklyHours(hours) {
    state.ui.weeklyHours = clamp(Number(hours), 4, 24);
    saveState();
  }

  function setSimulationMastery(value) {
    state.ui.simulationMastery = clamp(Number(value), 0, 100);
  }

  function setAnalyticsView(view) {
    const allowedViews = { progress: true, signals: true, sprint: true };
    if (!allowedViews[view]) return;
    state.ui.activeAnalyticsView = view;
    saveState();
  }

  function setInspectorView(view) {
    const allowedViews = { focus: true, details: true, simulate: true };
    if (!allowedViews[view]) return;
    state.ui.activeInspectorView = view;
    saveState();
  }
  function getRoadmapEntries() {
    return Object.keys(roadmapLibrary).map(function (key) {
      const roadmap = roadmapLibrary[key];
      return {
        key: key,
        label: roadmap.label,
        tagline: roadmap.tagline,
        accent: roadmap.accent,
        description: roadmap.description,
        topicCount: roadmap.graph.topics.length,
        edgeCount: roadmap.graph.edges.length
      };
    });
  }

  function loadTemplate(key) {
    if (!roadmapLibrary[key]) return;
    const nextGraph = clone(roadmapLibrary[key].graph);
    state.topics = nextGraph.topics;
    state.edges = nextGraph.edges;
    state.selectedTopicId = nextGraph.topics[0] ? nextGraph.topics[0].id : null;
    state.ui.activeTemplate = key;
    state.ui.simulationMastery = nextGraph.topics[0] ? nextGraph.topics[0].mastery : 0;
    state.ui.activeInspectorView = "focus";
    state.cycleAlert = null;
    saveState();
  }

  function getSprintPlan() {
    const totalHours = state.ui.weeklyHours;
    const days = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"].map(function (label) {
      return { label: label, capacity: Math.max(1, totalHours / 5), remaining: Math.max(1, totalHours / 5), sessions: [] };
    });
    const candidates = (state.analysis.recommendations || []).map(function (entry) {
      return state.analysis.indexes.topicById[entry.id];
    }).concat(state.analysis.topics.filter(function (topic) {
      const meta = state.analysis.metaById[topic.id];
      return meta.unlocked && meta.state !== "mastered";
    }));
    const seen = new Set();
    let scheduledHours = 0;

    candidates.forEach(function (topic) {
      if (!topic || seen.has(topic.id)) return;
      seen.add(topic.id);
      let remainingTopicHours = Math.max(1, Math.round(topic.estimatedHours * Math.max(0.35, (100 - topic.mastery) / 100)));
      for (let index = 0; index < days.length && remainingTopicHours > 0; index += 1) {
        const day = days[index];
        if (day.remaining <= 0.35) continue;
        const sessionHours = Math.min(day.remaining, Math.min(2.5, remainingTopicHours));
        if (sessionHours <= 0.35) continue;
        day.sessions.push({
          topicId: topic.id,
          title: topic.title,
          hours: Math.round(sessionHours * 10) / 10,
          reason: state.analysis.recommendation && state.analysis.recommendation.id === topic.id ? "highest recommendation" : "ready to advance"
        });
        day.remaining = Math.round((day.remaining - sessionHours) * 10) / 10;
        remainingTopicHours = Math.round((remainingTopicHours - sessionHours) * 10) / 10;
        scheduledHours += sessionHours;
      }
    });

    return {
      totalHours: totalHours,
      scheduledHours: Math.round(scheduledHours * 10) / 10,
      unscheduledHours: Math.max(0, Math.round((totalHours - scheduledHours) * 10) / 10),
      days: days
    };
  }

  function getSimulation() {
    const selectedTopic = getSelectedTopic();
    if (!selectedTopic) return null;
    const projectedTopics = clone(state.topics);
    const projectedTopic = projectedTopics.find(function (topic) { return topic.id === selectedTopic.id; });
    if (!projectedTopic) return null;
    projectedTopic.mastery = clamp(Number(state.ui.simulationMastery), 0, 100);
    const projectedAnalysis = window.GraphEngine.analyze(projectedTopics, state.edges, { masteryThreshold: masteryThreshold });
    const currentUnlocked = new Set(state.analysis.topics.filter(function (topic) {
      const meta = state.analysis.metaById[topic.id];
      return meta.unlocked && meta.state !== "mastered";
    }).map(function (topic) { return topic.id; }));
    const newlyUnlocked = projectedAnalysis.topics.filter(function (topic) {
      const meta = projectedAnalysis.metaById[topic.id];
      return meta.unlocked && meta.state !== "mastered" && !currentUnlocked.has(topic.id) && topic.id !== selectedTopic.id;
    });

    return {
      selectedId: selectedTopic.id,
      projectedMastery: projectedTopic.mastery,
      projectedState: projectedAnalysis.metaById[selectedTopic.id].state,
      newlyUnlocked: newlyUnlocked,
      nextRecommendation: projectedAnalysis.recommendation,
      projectedAverageMastery: projectedAnalysis.stats.averageMastery
    };
  }

  function getHeroMetrics() {
    const stats = state.analysis.stats;
    const recommendation = state.analysis.recommendation;
    const totalTopics = Math.max(1, stats.totalTopics);
    const unlockedRatio = stats.unlockedTopics / totalTopics;
    const masteredRatio = stats.masteredTopics / totalTopics;
    const readiness = Math.round(stats.averageMastery * 0.45 + unlockedRatio * 100 * 0.35 + masteredRatio * 100 * 0.2);
    const momentum = Math.round(((stats.inProgressTopics + stats.masteredTopics) / totalTopics) * 100);
    const blockerLoad = Math.round((stats.blockedTopics / totalTopics) * 100);
    const activeRoadmap = roadmapLibrary[state.ui.activeTemplate] || {
      label: "Custom Roadmap",
      tagline: "Imported roadmap",
      accent: "#67b7ff",
      description: "Use the graph engine to sequence what you study next."
    };
    return {
      readiness: readiness,
      momentum: momentum,
      blockerLoad: blockerLoad,
      activeRoadmap: activeRoadmap,
      recommendation: recommendation,
      totalEdges: state.edges.length,
      weeklyHours: state.ui.weeklyHours
    };
  }

  function resetDemo() {
    loadTemplate("cs-core");
  }

  window.StudyGraph = {
    state: state,
    storageKey: storageKey,
    masteryThreshold: masteryThreshold,
    graphPadding: graphPadding,
    categoryMeta: categoryMeta,
    statusFilters: statusFilters,
    roadmapLibrary: roadmapLibrary,
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
    selectTopic: selectTopic,
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
    importGraphText: importGraphText,
    setWeeklyHours: setWeeklyHours,
    setSimulationMastery: setSimulationMastery,
    setAnalyticsView: setAnalyticsView,
    setInspectorView: setInspectorView,
    getRoadmapEntries: getRoadmapEntries,
    loadTemplate: loadTemplate,
    getSprintPlan: getSprintPlan,
    getSimulation: getSimulation,
    getHeroMetrics: getHeroMetrics,
    resetDemo: resetDemo
  };
})();

