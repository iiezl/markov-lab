class Generator {
  constructor(model) {
    this.model = model;
  }

  setModel(model) {
    this.model = model;
  }

  /**
   * Generate text.
   */
  generate(start = "", length = 50) {
    if (!this.model) return "";

    let nextLength = Number(length);

    if (!Number.isFinite(nextLength)) {
      nextLength = 50;
    }

    nextLength = Math.max(5, Math.min(500, nextLength));

    return this.model.generate({
      start,
      maxWords: nextLength,
    });
  }

  /**
   * Generate with a random start.
   */
  random(length = 50) {
    if (!this.model) return "";

    return this.model.generate({
      maxWords: length,
    });
  }

  /**
   * Copy generated text.
   */
  async copy(text) {
    if (!text) return false;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
