class Graph {
  constructor(container) {
    this.container = container;
    this.network = null;
    this.nodes = null;
    this.edges = null;
    this.focusedId = null;
  }

  /**
   * Read the active theme's colors from CSS custom properties so the
   * canvas-rendered network always matches light/dark mode.
   */
  static themeColors() {
    const style = getComputedStyle(document.documentElement);
    const get = (name) => style.getPropertyValue(name).trim();

    return {
      surface: get("--surface"),
      surface2: get("--surface-2"),
      border: get("--border"),
      text: get("--text"),
      muted: get("--muted"),
      accent: get("--accent"),
    };
  }

  destroy() {
    if (this.network) {
      this.network.destroy();
    }
  }

  render(model) {
    this.destroy();
    this.focusedId = null;

    if (!model) return;

    this.nodes = new vis.DataSet();
    this.edges = new vis.DataSet();

    let id = 0;
    const ids = new Map();

    // Create nodes.
    for (const state of model.chain.keys()) {
      ids.set(state, id);

      this.nodes.add({
        id,
        label: state.replaceAll("\u0001", " "),
        shape: "box",
      });

      id += 1;
    }

    // Create edges.
    for (const [state, transitions] of model.chain) {
      const from = ids.get(state);

      for (const [word, weight] of transitions) {
        const nextWords = state.split("\u0001").slice(1);
        nextWords.push(word);

        const nextState = nextWords.join("\u0001");

        if (!ids.has(nextState)) continue;

        this.edges.add({
          from,
          to: ids.get(nextState),
          label: String(weight),
          arrows: "to",
          value: weight,
        });
      }
    }

    this.network = new vis.Network(
      this.container,
      {
        nodes: this.nodes,
        edges: this.edges,
      },
      Graph.options(),
    );
  }

  /**
   * Build vis-network options from the current theme.
   */
  static options() {
    const colors = Graph.themeColors();

    return {
      physics: {
        enabled: true,
        stabilization: true,
        barnesHut: {
          theta: 0.5,
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0,
        },
        repulsion: {
          centralGravity: 0.2,
          springLength: 200,
          springConstant: 0.05,
          nodeDistance: 100,
          damping: 0.09,
        },
        hierarchicalRepulsion: {
          centralGravity: 0.0,
          springLength: 100,
          springConstant: 0.01,
          nodeDistance: 120,
          damping: 0.09,
          avoidOverlap: 0,
        },
      },
      nodes: {
        shape: "box",
        font: {
          face: "'JetBrains Mono', monospace",
          size: 13,
          color: colors.text,
        },
        margin: 8,
        borderWidth: 1.5,
        shapeProperties: {
          borderRadius: 0,
        },
        color: {
          background: colors.surface2,
          border: colors.border,
          highlight: {
            background: colors.accent,
            border: colors.accent,
          },
          hover: {
            background: colors.surface2,
            border: colors.accent,
          },
        },
      },
      edges: {
        smooth: true,
        font: {
          size: 11,
          color: colors.muted,
          strokeWidth: 0,
        },
        color: {
          color: colors.muted,
          highlight: colors.accent,
          hover: colors.accent,
        },
      },
      layout: {
        randomSeed: 67,
        improvedLayout: this.nodes,
      },
      interaction: {
        hover: true,
        navigationButtons: true,
        keyboard: true,
      },
    };
  }

  /**
   * Re-apply theme colors to an already-rendered network (called when
   * the user toggles light/dark mode, no need to rebuild the graph).
   */
  applyTheme() {
    if (!this.network) return;

    const options = Graph.options();

    this.network.setOptions({
      nodes: options.nodes,
      edges: options.edges,
    });
  }

  /**
   * Highlight current state.
   */
  focus(state) {
    if (!this.network) return;

    const node = [...this.nodes.get()].find(
      (entry) => entry.label === state.replaceAll("\u0001", " "),
    );

    if (!node) return;

    const colors = Graph.themeColors();

    if (this.focusedId !== null && this.focusedId !== node.id) {
      this.nodes.update({
        id: this.focusedId,
        color: {
          background: colors.surface2,
          border: colors.border,
        },
      });
    }

    this.network.focus(node.id, {
      scale: 1.4,
      animation: true,
    });

    this.nodes.update({
      id: node.id,
      color: {
        background: colors.accent,
        border: colors.accent,
      },
    });

    this.focusedId = node.id;
  }
}
