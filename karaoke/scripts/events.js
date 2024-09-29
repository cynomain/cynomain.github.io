class EventDelegate {
  actions = [];

  subscribe(func) {
    this.actions.push(func);
  }

  unsubscribe(func) {
    const index = this.actions.indexOf(func);
    if (index > -1) {
      // only splice array when item is found
      this.actions.splice(index, 1); // 2nd parameter means remove one item only
    }
  }

  call() {
    this.actions.forEach((func) => func());
  }
}