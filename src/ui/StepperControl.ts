export interface StepperOptions {
  label: string;
  min: number;
  max: number;
  value: number;
  format?: (value: number) => string;
  onStep: (direction: 1 | -1) => void;
}

const HOLD_DELAY_MS = 400;
const HOLD_INTERVAL_MS = 90;

/**
 * Reusable [−] value [+] HTML control.
 * - press-and-hold repeats (handy on touch screens);
 * - keyboard accessible (Enter / Space trigger `click` with detail === 0);
 * - buttons are disabled at the range limits.
 */
export class StepperControl {
  readonly element: HTMLElement;
  private readonly valueEl: HTMLOutputElement;
  private readonly decBtn: HTMLButtonElement;
  private readonly incBtn: HTMLButtonElement;
  private holdTimer = 0;
  private holdInterval = 0;
  private readonly format: (value: number) => string;

  constructor(private readonly options: StepperOptions) {
    this.format = options.format ?? String;

    this.element = document.createElement('div');
    this.element.className = 'stepper';

    const group = document.createElement('div');
    group.className = 'stepper__group';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', options.label);

    this.decBtn = this.createButton('−', `Decrease ${options.label}`, -1);
    this.incBtn = this.createButton('+', `Increase ${options.label}`, 1);

    this.valueEl = document.createElement('output');
    this.valueEl.className = 'stepper__value';
    this.valueEl.setAttribute('aria-live', 'polite');

    const label = document.createElement('span');
    label.className = 'stepper__label';
    label.textContent = options.label;

    group.append(this.decBtn, this.valueEl, this.incBtn);
    this.element.append(group, label);
    this.setValue(options.value);
  }

  setValue(value: number): void {
    this.valueEl.textContent = this.format(value);
    this.decBtn.disabled = value <= this.options.min;
    this.incBtn.disabled = value >= this.options.max;
    if (this.decBtn.disabled || this.incBtn.disabled) this.stopHold();
  }

  destroy(): void {
    this.stopHold();
    this.element.remove();
  }

  private createButton(text: string, ariaLabel: string, direction: 1 | -1): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = text;
    btn.setAttribute('aria-label', ariaLabel);

    btn.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || btn.disabled) return;
      btn.classList.add('is-pressed');
      this.options.onStep(direction);
      this.startHold(direction);
    });
    const release = () => {
      btn.classList.remove('is-pressed');
      this.stopHold();
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);
    // Keyboard activation only (pointer clicks are already handled on pointerdown).
    btn.addEventListener('click', (event) => {
      if (event.detail === 0) this.options.onStep(direction);
    });
    btn.addEventListener('contextmenu', (event) => event.preventDefault()); // long-press menu on Android
    return btn;
  }

  private startHold(direction: 1 | -1): void {
    this.stopHold();
    this.holdTimer = window.setTimeout(() => {
      this.holdInterval = window.setInterval(() => this.options.onStep(direction), HOLD_INTERVAL_MS);
    }, HOLD_DELAY_MS);
  }

  private stopHold(): void {
    window.clearTimeout(this.holdTimer);
    window.clearInterval(this.holdInterval);
    this.holdTimer = 0;
    this.holdInterval = 0;
  }
}
