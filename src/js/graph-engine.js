(function (globalScope, factory) {
  const exported = factory();
  globalScope.GraphEngine = exported;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DEFAULT_THRESHOLD = 75;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sanitizeTopics(topics) {
    return topics.map(function (topic, index) {
      return {
        id: String(topic.id),
        title: String(topic.title || "Untitled Topic"),
        description: String(topic.description || ""),
        category: String(topic.category || "Foundations"),
        difficulty: clamp(Number(topic.difficulty || 1), 1, 5),
        estimatedHours: clamp(Number(topic.estimatedHours || 1), 1, 40),
        mastery: clamp(Number(topic.mastery || 0), 0, 100),
        x: Number.isFinite(Number(topic.x)) ? Number(topic.x) : 120 + (index % 4) * 240,
        y: Number.isFinite(Number(topic.y)) ? Number(topic.y) : 120 + Math.floor(index / 4) * 180
      };
    });
  }

  function sanitizeEdges(edges, topicIds) {
    const seen = new Set();

    return edges
      .map(function (edge) {
        return {
          from: String(edge.from),
          to: String(edge.to)
        };
      })
      .filter(function (edge) {
        if (!topicIds.has(edge.from) || !topicIds.has(edge.to) || edge.from === edge.to) {
          return false;
        }

        const key = edge.from + "->" + edge.to;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }

  function buildIndexes(topics, edges) {
    const topicById = {};
    const prerequisiteMap = {};
    const dependentMap = {};

    topics.forEach(function (topic) {
      topicById[topic.id] = topic;
      prerequisiteMap[topic.id] = [];
      dependentMap[topic.id] = [];
    });

    edges.forEach(function (edge) {
      prerequisiteMap[edge.to].push(edge.from);
      dependentMap[edge.from].push(edge.to);
    });

    return {
      topicById: topicById,
      prerequisiteMap: prerequisiteMap,
      dependentMap: dependentMap
    };
  }

  function findPath(map, startId, targetId) {
    if (startId === targetId) {
      return [startId];
    }

    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length) {
      const currentPath = queue.shift();
      const currentId = currentPath[currentPath.length - 1];
      const neighbors = map[currentId] || [];

      for (let index = 0; index < neighbors.length; index += 1) {
        const neighborId = neighbors[index];
        if (visited.has(neighborId)) {
          continue;
        }

        const nextPath = currentPath.concat(neighborId);
        if (neighborId === targetId) {
          return nextPath;
        }

        visited.add(neighborId);
        queue.push(nextPath);
      }
    }

    return [];
  }

  function detectCycle(nodeIds, dependentMap) {
    const visiting = new Set();
    const visited = new Set();
    const stack = [];
    let detected = null;

    function dfs(nodeId) {
      if (detected) {
        return;
      }

      visiting.add(nodeId);
      stack.push(nodeId);

      const neighbors = dependentMap[nodeId] || [];
      for (let index = 0; index < neighbors.length; index += 1) {
        const neighborId = neighbors[index];

        if (visiting.has(neighborId)) {
          const cycleStart = stack.indexOf(neighborId);
          detected = stack.slice(cycleStart).concat(neighborId);
          return;
        }

        if (!visited.has(neighborId)) {
          dfs(neighborId);
        }
      }

      stack.pop();
      visiting.delete(nodeId);
      visited.add(nodeId);
    }

    for (let index = 0; index < nodeIds.length; index += 1) {
      const nodeId = nodeIds[index];
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
      if (detected) {
        break;
      }
    }

    return detected;
  }

  function computeShortestPaths(nodeIds, prerequisiteMap, dependentMap) {
    const roots = nodeIds.filter(function (topicId) {
      return (prerequisiteMap[topicId] || []).length === 0;
    });
    const shortestPaths = {};

    roots.forEach(function (rootId) {
      shortestPaths[rootId] = [rootId];
    });

    const queue = roots.slice();
    while (queue.length) {
      const currentId = queue.shift();
      const currentPath = shortestPaths[currentId] || [currentId];
      const dependents = dependentMap[currentId] || [];

      dependents.forEach(function (dependentId) {
        const nextPath = currentPath.concat(dependentId);
        if (!shortestPaths[dependentId] || nextPath.length < shortestPaths[dependentId].length) {
          shortestPaths[dependentId] = nextPath;
          queue.push(dependentId);
        }
      });
    }

    return {
      roots: roots,
      shortestPaths: shortestPaths
    };
  }

  function computeCategoryStats(topics) {
    const categoryMap = {};

    topics.forEach(function (topic) {
      if (!categoryMap[topic.category]) {
        categoryMap[topic.category] = {
          category: topic.category,
          count: 0,
          mastered: 0,
          averageMastery: 0
        };
      }

      categoryMap[topic.category].count += 1;
      categoryMap[topic.category].averageMastery += topic.mastery;
      if (topic.mastery >= 100) {
        categoryMap[topic.category].mastered += 1;
      }
    });

    return Object.keys(categoryMap)
      .map(function (categoryKey) {
        const entry = categoryMap[categoryKey];
        entry.averageMastery = entry.count ? Math.round(entry.averageMastery / entry.count) : 0;
        return entry;
      })
      .sort(function (left, right) {
        return left.category.localeCompare(right.category);
      });
  }

  function createMetaForTopic(topic, indexes, masteryThreshold, shortestPaths) {
    const prerequisites = indexes.prerequisiteMap[topic.id] || [];
    const dependents = indexes.dependentMap[topic.id] || [];
    const blockedBy = prerequisites.filter(function (prerequisiteId) {
      const prerequisiteTopic = indexes.topicById[prerequisiteId];
      return !prerequisiteTopic || prerequisiteTopic.mastery < masteryThreshold;
    });
    const unlocked = blockedBy.length === 0;
    const isMastered = topic.mastery >= 100;
    const canStudy = unlocked && !isMastered;
    let state = "locked";

    if (isMastered) {
      state = "mastered";
    } else if (unlocked && topic.mastery > 0) {
      state = "in-progress";
    } else if (unlocked) {
      state = "unlocked";
    }

    return {
      id: topic.id,
      prerequisites: prerequisites,
      dependents: dependents,
      blockedBy: blockedBy,
      unlocked: unlocked,
      canStudy: canStudy,
      state: state,
      rootPath: shortestPaths[topic.id] || [],
      prerequisiteCount: prerequisites.length,
      dependentCount: dependents.length
    };
  }

  function scoreTopic(topic, meta, categoryAverages) {
    const lowMasteryPriority = (100 - topic.mastery) * 0.62;
    const difficultyFit = 26 - Math.abs(topic.difficulty - 3) * 7;
    const timeFit = Math.max(0, 18 - topic.estimatedHours) * 1.12;
    const categoryNeed = (100 - (categoryAverages[topic.category] || 0)) * 0.18;
    const depthBonus = meta.prerequisiteCount * 4.5;
    const score = 42 + lowMasteryPriority + difficultyFit + timeFit + categoryNeed + depthBonus;

    return {
      score: Math.round(score * 10) / 10,
      breakdown: {
        unlockBonus: 42,
        lowMasteryPriority: Math.round(lowMasteryPriority * 10) / 10,
        difficultyFit: Math.round(difficultyFit * 10) / 10,
        timeFit: Math.round(timeFit * 10) / 10,
        categoryNeed: Math.round(categoryNeed * 10) / 10,
        depthBonus: Math.round(depthBonus * 10) / 10
      }
    };
  }

  function getRecommendationReasons(topic, meta, categoryAverages, masteryThreshold) {
    const reasons = [];
    const categoryAverage = categoryAverages[topic.category] || 0;

    reasons.push("all prerequisites are at or above " + masteryThreshold + "%");

    if (topic.mastery < 40) {
      reasons.push("it is still early-stage, so studying it has high payoff");
    } else if (topic.mastery < 75) {
      reasons.push("it already has momentum and can be finished quickly");
    } else {
      reasons.push("it is close to mastery and worth closing out");
    }

    if (topic.difficulty <= 2) {
      reasons.push("the difficulty is low enough for a fast win");
    } else if (topic.difficulty === 3) {
      reasons.push("the difficulty is balanced for steady progress");
    } else {
      reasons.push("the challenge level is high, but now unlocked");
    }

    if (topic.estimatedHours <= 4) {
      reasons.push("the expected study time is short");
    }

    if (categoryAverage < 55) {
      reasons.push(topic.category + " is lagging behind your other categories");
    }

    if (meta.prerequisiteCount >= 2) {
      reasons.push("it unlocks a deeper part of the roadmap");
    }

    return reasons;
  }

  function computeRecommendations(topics, metaById, masteryThreshold, categoryStats) {
    const categoryAverages = {};
    categoryStats.forEach(function (entry) {
      categoryAverages[entry.category] = entry.averageMastery;
    });

    return topics
      .filter(function (topic) {
        return metaById[topic.id].canStudy;
      })
      .map(function (topic) {
        const meta = metaById[topic.id];
        const scored = scoreTopic(topic, meta, categoryAverages);
        return {
          id: topic.id,
          title: topic.title,
          score: scored.score,
          breakdown: scored.breakdown,
          reasons: getRecommendationReasons(topic, meta, categoryAverages, masteryThreshold)
        };
      })
      .sort(function (left, right) {
        return right.score - left.score || left.title.localeCompare(right.title);
      });
  }

  function computeStats(topics, metaById) {
    const stats = {
      totalTopics: topics.length,
      masteredTopics: 0,
      unlockedTopics: 0,
      blockedTopics: 0,
      averageMastery: 0,
      inProgressTopics: 0
    };

    topics.forEach(function (topic) {
      const meta = metaById[topic.id];
      stats.averageMastery += topic.mastery;

      if (meta.state === "mastered") {
        stats.masteredTopics += 1;
      }
      if (meta.unlocked && meta.state !== "mastered") {
        stats.unlockedTopics += 1;
      }
      if (meta.state === "locked") {
        stats.blockedTopics += 1;
      }
      if (meta.state === "in-progress") {
        stats.inProgressTopics += 1;
      }
    });

    stats.averageMastery = topics.length ? Math.round(stats.averageMastery / topics.length) : 0;
    return stats;
  }

  function topologicalSort(nodeIds, prerequisiteMap, dependentMap) {
    const indegree = {};
    nodeIds.forEach(function (id) {
      indegree[id] = (prerequisiteMap[id] || []).length;
    });

    const queue = nodeIds.filter(function (id) {
      return indegree[id] === 0;
    });
    const ordered = [];

    while (queue.length) {
      const currentId = queue.shift();
      ordered.push(currentId);
      (dependentMap[currentId] || []).forEach(function (dependentId) {
        indegree[dependentId] -= 1;
        if (indegree[dependentId] === 0) {
          queue.push(dependentId);
        }
      });
    }

    return ordered;
  }

  function analyze(topics, edges, options) {
    const masteryThreshold = options && Number.isFinite(options.masteryThreshold)
      ? Number(options.masteryThreshold)
      : DEFAULT_THRESHOLD;
    const safeTopics = sanitizeTopics(topics || []);
    const topicIds = new Set(safeTopics.map(function (topic) {
      return topic.id;
    }));
    const safeEdges = sanitizeEdges(edges || [], topicIds);
    const indexes = buildIndexes(safeTopics, safeEdges);
    const nodeIds = safeTopics.map(function (topic) {
      return topic.id;
    });
    const cyclePath = detectCycle(nodeIds, indexes.dependentMap);
    const shortest = computeShortestPaths(nodeIds, indexes.prerequisiteMap, indexes.dependentMap);
    const categoryStats = computeCategoryStats(safeTopics);
    const metaById = {};

    safeTopics.forEach(function (topic) {
      metaById[topic.id] = createMetaForTopic(topic, indexes, masteryThreshold, shortest.shortestPaths);
    });

    const recommendations = computeRecommendations(safeTopics, metaById, masteryThreshold, categoryStats);
    if (recommendations[0] && metaById[recommendations[0].id]) {
      metaById[recommendations[0].id].recommended = true;
    }

    return {
      masteryThreshold: masteryThreshold,
      topics: safeTopics,
      edges: safeEdges,
      indexes: indexes,
      roots: shortest.roots,
      shortestPaths: shortest.shortestPaths,
      metaById: metaById,
      categoryStats: categoryStats,
      recommendations: recommendations,
      recommendation: recommendations[0] || null,
      stats: computeStats(safeTopics, metaById),
      cyclePath: cyclePath || [],
      order: cyclePath ? [] : topologicalSort(nodeIds, indexes.prerequisiteMap, indexes.dependentMap)
    };
  }

  function wouldCreateCycle(topics, edges, fromId, toId) {
    const analysis = analyze(topics, edges, {});
    if (String(fromId) === String(toId)) {
      return {
        wouldCycle: true,
        path: [String(fromId), String(toId)]
      };
    }

    const existingPath = findPath(analysis.indexes.dependentMap, String(toId), String(fromId));
    return {
      wouldCycle: existingPath.length > 0,
      path: existingPath.length ? existingPath.concat(String(toId)) : []
    };
  }

  return {
    analyze: analyze,
    wouldCreateCycle: wouldCreateCycle,
    findPath: findPath
  };
});
