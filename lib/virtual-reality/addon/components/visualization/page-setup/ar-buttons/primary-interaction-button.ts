import Component from '@glimmer/component';
import { action } from '@ember/object';

interface PrimaryInteractionButtonArgs {
  handlePrimaryCrosshairInteraction(): void
  openAllComponents(): void
}

export default class PrimaryInteractionButton extends Component<PrimaryInteractionButtonArgs> {
  @action
  addLongPressListener(button: HTMLButtonElement) {
    const self = this;

    function checkForLongPress(start: number) {
      const end = Date.now();
      const diff = (end - start) + 1;
      const minLongPressTime = 500;

      if (diff > minLongPressTime) {
        self.args.openAllComponents();
      }
    }

    let start: number;

    // Touch listener
    button.ontouchstart = () => {
      start = Date.now();

      button.ontouchend = () => {
        checkForLongPress(start);
      };
    };

    // Mouse listener
    button.onmousedown = () => {
      start = Date.now();

      button.onmouseup = () => {
        checkForLongPress(start);
      };
    };
  }
}
