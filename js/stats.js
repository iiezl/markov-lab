class Statistics {
  static analyze(model) {
    if (!model) {
      return {
        words: 0,
        states: 0,
        transitions: 0,
        uniqueWords: 0,
        averageBranching: 0,
        maxBranching: 0,
        deadEnds: 0,
        startStates: 0,
      };
    }

    const vocabulary = new Set();
    let transitions = 0;
    let branches = 0;
    let maxBranching = 0;

    for (const [state, map] of model.chain) {
      state.split("\u0001").forEach((word) => vocabulary.add(word));

      const size = map.size;
      branches += size;

      for (const count of map.values()) {
        transitions += count;
      }

      if (size > maxBranching) {
        maxBranching = size;
      }

      for (const word of map.keys()) {
        vocabulary.add(word);
      }
    }

    // A dead end is a state where a training text actually ended,
    // and that state has no recorded outgoing transitions elsewhere.
    let deadEnds = 0;

    for (const state of model.terminals ?? []) {
      const map = model.chain.get(state);

      if (!map || map.size === 0) {
        deadEnds += 1;
      }
    }

    return {
      words: model.wordCount,
      uniqueWords: vocabulary.size,
      states: model.chain.size,
      transitions,
      startStates: model.starts.length,
      averageBranching: model.chain.size ? branches / model.chain.size : 0,
      maxBranching,
      deadEnds,
    };
  }
}
