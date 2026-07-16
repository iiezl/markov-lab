class Trainer {
  constructor(order = 2) {
    this.model = new MarkovChain(order);
  }

  setOrder(order) {
    const nextOrder = Number(order);

    if (Number.isNaN(nextOrder)) return;

    this.model = new MarkovChain(nextOrder);
  }

  train(text) {
    this.model.train(text);

    return this.model;
  }

  trainMany(texts) {
    this.model.trainMany(texts);

    return this.model;
  }

  reset() {
    this.model.clear();
  }

  async readFiles(fileList) {
    const texts = [];

    for (const file of fileList) {
      try {
        const text = await file.text();
        texts.push(text);
      } catch {
        console.warn(`Couldn't read ${file.name}`);
      }
    }

    return texts;
  }

  exportModel() {
    return JSON.stringify(this.model.toJSON(), null, 2);
  }

  importModel(json) {
    this.model = MarkovChain.fromJSON(JSON.parse(json));

    return this.model;
  }
}
