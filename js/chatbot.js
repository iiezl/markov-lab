class ChatBot {
  constructor(model) {
    this.model = model;
    this.history = [];
    this.maxHistory = 20;
  }

  setModel(model) {
    this.model = model;
  }

  reset() {
    this.history.length = 0;
  }

  add(role, content) {
    this.history.push({ role, content });

    while (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Find a usable starting state from the user's message.
   */
  findSeed(message) {
    if (!this.model) return "";

    const words = tokenize(message);

    if (!words.length) return "";

    for (let index = 0; index <= words.length - this.model.order; index += 1) {
      const state = words.slice(index, index + this.model.order).join("\u0001");

      if (this.model.hasState(state)) {
        return words.slice(index, index + this.model.order).join(" ");
      }
    }

    return "";
  }

  /**
   * Generate reply.
   */
  reply(message) {
    this.add("user", message);

    const seed = this.findSeed(message);
    let response;

    if (seed.length) {
      response = this.model.generate({
        start: seed,
        maxWords: 40,
      });
    } else {
      response = this.model.generate({
        maxWords: 40,
      });
    }

    this.add("assistant", response);

    return response;
  }
}
