class MarkovChain {
  constructor(order = 2) {
    this.order = order;

    /**
     * Map<
     *   state,
     *   Map<
     *     nextWord,
     *     frequency
     *   >
     * >
     */
    this.chain = new Map();
    this.starts = [];
    this.terminals = new Set();
    this.wordCount = 0;
  }

  clear() {
    this.chain.clear();
    this.starts.length = 0;
    this.terminals.clear();
    this.wordCount = 0;
  }

  train(text) {
    const words = tokenize(text);

    if (words.length <= this.order) return;

    this.wordCount += words.length;
    this.starts.push(words.slice(0, this.order).join("\u0001"));

    for (let index = 0; index < words.length - this.order; index += 1) {
      const state = words.slice(index, index + this.order).join("\u0001");
      const next = words[index + this.order];

      if (!this.chain.has(state)) {
        this.chain.set(state, new Map());
      }

      const map = this.chain.get(state);
      map.set(next, (map.get(next) ?? 0) + 1);
    }

    this.terminals.add(words.slice(-this.order).join("\u0001"));
  }

  trainMany(texts) {
    for (const text of texts) {
      this.train(text);
    }
  }

  hasState(state) {
    return this.chain.has(state);
  }

  getTransitions(state) {
    return this.chain.get(state) ?? new Map();
  }

  randomState() {
    return random([...this.chain.keys()]);
  }

  randomStart() {
    return random(this.starts);
  }

  choose(map) {
    let total = 0;

    for (const value of map.values()) {
      total += value;
    }

    let roll = Math.random() * total;

    for (const [word, weight] of map) {
      roll -= weight;

      if (roll <= 0) return word;
    }

    return [...map.keys()][0];
  }

  generate(options = {}) {
    const { start = null, maxWords = 50 } = options;

    let state;

    if (start) {
      const tokens = tokenize(start);

      if (tokens.length >= this.order) {
        state = tokens.slice(-this.order).join("\u0001");
      }
    }

    if (!state || !this.chain.has(state)) {
      state = this.randomStart();
    }

    if (!state) return "";

    const output = state.split("\u0001");

    while (output.length < maxWords) {
      const current = output.slice(-this.order).join("\u0001");
      const transitions = this.chain.get(current);

      if (!transitions) break;

      output.push(this.choose(transitions));
    }

    return untokenize(output);
  }

  toJSON() {
    return {
      order: this.order,
      wordCount: this.wordCount,
      starts: this.starts,
      terminals: [...this.terminals],
      chain: [...this.chain.entries()].map(([state, map]) => [
        state,
        [...map.entries()],
      ]),
    };
  }

  static fromJSON(json) {
    const model = new MarkovChain(json.order);

    model.wordCount = json.wordCount;
    model.starts = json.starts;
    model.terminals = new Set(json.terminals ?? []);

    for (const [state, entries] of json.chain) {
      model.chain.set(state, new Map(entries));
    }

    return model;
  }
}
