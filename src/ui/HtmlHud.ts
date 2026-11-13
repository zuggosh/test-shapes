import { SETTINGS } from '../config/settings';
import type { SimulationModel } from '../model/SimulationModel';
import { StatField } from './StatField';
import { StepperControl } from './StepperControl';

const numberFormat = new Intl.NumberFormat('en-US');

/**
 * HTML overlay (bonus 5c + 6): statistics top-left of the rectangle,
 * +/- controls under it. Purely reactive — listens to model events and
 * forwards user intents back to the model.
 */
export class HtmlHud {
  private readonly countField = new StatField('Shapes');
  private readonly areaField = new StatField('Surface area', ' px<sup>2</sup>');
  private readonly spawnStepper: StepperControl;
  private readonly gravityStepper: StepperControl;
  private readonly unsubscribe: Array<() => void>;

  constructor(hudHost: HTMLElement, controlsHost: HTMLElement, model: SimulationModel) {
    hudHost.append(this.countField.element, this.areaField.element);

    this.spawnStepper = new StepperControl({
      label: 'Shapes per second',
      min: SETTINGS.spawnRate.min,
      max: SETTINGS.spawnRate.max,
      value: model.spawnRate,
      onStep: (direction) => model.changeSpawnRate(direction),
    });
    this.gravityStepper = new StepperControl({
      label: 'Gravity value',
      min: SETTINGS.gravity.min,
      max: SETTINGS.gravity.max,
      value: model.gravity,
      onStep: (direction) => model.changeGravity(direction),
    });
    controlsHost.append(this.spawnStepper.element, this.gravityStepper.element);

    this.renderStats(model.stats.count, model.stats.area);
    this.unsubscribe = [
      model.on('statsChanged', (stats) => this.renderStats(stats.count, stats.area)),
      model.on('settingsChanged', (settings) => {
        this.spawnStepper.setValue(settings.spawnRate);
        this.gravityStepper.setValue(settings.gravity);
      }),
    ];
  }

  destroy(): void {
    this.unsubscribe.forEach((off) => off());
    this.spawnStepper.destroy();
    this.gravityStepper.destroy();
    this.countField.element.remove();
    this.areaField.element.remove();
  }

  private renderStats(count: number, area: number): void {
    this.countField.set(String(count));
    this.areaField.set(numberFormat.format(area));
  }
}
