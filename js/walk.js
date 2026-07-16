class WalkSession {
  constructor(model) {
    this.model = model;
    this.reset();
  }

  setModel(model) {
    this.model = model;
    this.reset();
  }

  reset() {
    this.state = null;
    this.history = [];
  }

  /**
   * Start from a random state.
   */
  randomStart() {
    if (!this.model) return false;

    const start = this.model.randomStart();

    if (!start) return false;

    this.state = start;
    this.history = start.split("\u0001");

    return true;
  }

  /**
   * Current words.
   */
  getCurrent() {
    return [...this.history];
  }

  /**
   * Available transitions.
   */
  getChoices() {
    if (!this.state) {
      return [];
    }

    const map = this.model.getTransitions(this.state);
    let total = 0;

    for (const value of map.values()) {
      total += value;
    }

    return [...map.entries()]
      .map(([word, count]) => ({
        word,
        count,
        probability: count / total,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Move to the next state.
   */
  choose(word) {
    if (!this.state) return false;

    const transitions = this.model.getTransitions(this.state);

    if (!transitions.has(word)) {
      return false;
    }

    this.history.push(word);
    this.state = this.history.slice(-this.model.order).join("\u0001");

    return true;
  }

  /**
   * Auto-pick using weights.
   */
  auto() {
    const choices = this.getChoices();

    if (!choices.length) return false;

    const total = choices.reduce((sum, choice) => sum + choice.count, 0);
    let random = Math.random() * total;

    for (const choice of choices) {
      random -= choice.count;

      if (random <= 0) {
        this.choose(choice.word);
        return true;
      }
    }

    return false;
  }

  /**
   * Current sentence.
   */
  text() {
    return this.history.join(" ");
  }
}
