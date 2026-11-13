/** Read-only HTML text field: label + value (+ optional unit). Writes to the DOM only on change. */
export class StatField {
  readonly element: HTMLElement;
  private readonly valueNode: Text;
  private current = '';

  constructor(label: string, unit?: string) {
    this.element = document.createElement('div');
    this.element.className = 'stat';

    const labelEl = document.createElement('span');
    labelEl.className = 'stat__label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'stat__value';
    this.valueNode = document.createTextNode('0');
    valueEl.appendChild(this.valueNode);

    if (unit) {
      const unitEl = document.createElement('span');
      unitEl.className = 'stat__unit';
      unitEl.innerHTML = unit;
      valueEl.appendChild(unitEl);
    }

    this.element.append(labelEl, valueEl);
  }

  set(text: string): void {
    if (text === this.current) return;
    this.current = text;
    this.valueNode.nodeValue = text;
  }
}
