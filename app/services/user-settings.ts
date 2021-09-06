import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export type SettingGroup = 'Colors' | 'Highlighting' | 'Hover Effects' | 'Communication';

export type LandscapeColorSettingId
= 'nodeColor'
| 'applicationColor'
| 'communicationColor'
| 'nodeTextColor'
| 'applicationTextColor'
| 'backgroundColor';

export type LandscapeHoveringSettingId = 'enableHoverEffects';

export type LandscapeSettingId
= LandscapeColorSettingId
| LandscapeHoveringSettingId;

export type ApplicationColorSettingId
= 'foundationColor'
| 'componentOddColor'
| 'componentEvenColor'
| 'clazzColor'
| 'highlightedEntityColor'
| 'componentTextColor'
| 'clazzTextColor'
| 'foundationTextColor'
| 'communicationColor'
| 'communicationArrowColor'
| 'backgroundColor';

export type ApplicationHighlightingSettingId
= 'keepHighlightingOnOpenOrClose'
| 'transparencyIntensity';

export type ApplicationHoveringSettingId = 'enableHoverEffects';

export type ApplicationCommunicationSettingId =
| 'commArrowSize'
| 'curvyCommHeight';

export type ApplicationSettingId
= ApplicationColorSettingId
| ApplicationHighlightingSettingId
| ApplicationHoveringSettingId
| ApplicationCommunicationSettingId;

export type LandscapeColorSettings = Record<LandscapeColorSettingId, ColorSetting>;

export type LandscapeHoveringSettings = Record<LandscapeHoveringSettingId, FlagSetting>;

export type ApplicationColorSettings = Record<ApplicationColorSettingId, ColorSetting>;

export type ApplicationHighlightingSettings = {
  keepHighlightingOnOpenOrClose: FlagSetting;
  transparencyIntensity: RangeSetting;
};

export type ApplicationHoveringSettings = Record<ApplicationHoveringSettingId, FlagSetting>;

export type ApplicationCommunicationSettings
= Record<ApplicationCommunicationSettingId, RangeSetting>;

const defaultApplicationColors = {
  foundationColor: '#d2d2d2', // grey
  componentOddColor: '#65c97e', // lime green
  componentEvenColor: '#3c8db0', // desaturated cyan
  clazzColor: '#a7cffb', // light pastel blue
  highlightedEntityColor: '#ff5151', // pastel red
  componentTextColor: '#ffffff', // white
  clazzTextColor: '#ffffff', // white
  foundationTextColor: '#000000', // black
  communicationColor: '#d6d48b', // dark grey
  communicationArrowColor: '#000000', // black
  backgroundColor: '#ffffff', // white
};

const defaultLandscapeColors = {
  nodeColor: '#6bc484', // washed-out green
  applicationColor: '#0096be', // sky blue
  communicationColor: '#d6d48b', // washed-out yellow
  nodeTextColor: '#ffffff', // white
  applicationTextColor: '#ffffff', // white
  backgroundColor: '#ffffff', // white
};

/* const classicApplicationColors = {
  appVizFoundationColor: '#c7c7c7', // grey
  appVizComponentOddColor: '#169e2b', // dark green
  appVizComponentEvenColor: '#00bb41', // light green
  appVizClazzColor: '#3e14a0', // purple-blue
  appVizHighlightedEntityColor: '#ff0000', // red
  appVizComponentTextColor: '#ffffff', // white
  appVizClazzTextColor: '#ffffff', // white
  appVizFoundationTextColor: '#000000', // black
  appVizCommunicationColor: '#f49100', // orange
  appVizCommunicationArrowColor: '#000000', // black
  appVizBackgroundColor: '#ffffff', // white
};

const classicLandscapeColors = {
  landVizNodeColor: '#00bb41', // green
  landVizApplicationColor: '#3e14a0', // purple-blue
  landVizCommunicationColor: '#f49100', // orange
  landVizNodeTextColor: '#ffffff', // white
  landVizApplicationTextColor: '#ffffff', // white
  landVizBackgroundColor: '#ffffff', // white
};

const visuallyImpairedApplicationColors = {
  appVizFoundationColor: '#c7c7c7', // light grey
  appVizComponentOddColor: '#015a6e', // deep teal
  appVizComponentEvenColor: '#0096be', // light blue
  appVizClazzColor: '#f7f7f7', // white
  appVizHighlightedEntityColor: '#ff0000', // red
  appVizComponentTextColor: '#ffffff', // white
  appVizClazzTextColor: '#ffffff', // white
  appVizFoundationTextColor: '#000000', // black
  appVizCommunicationColor: '#f49100', // orange
  appVizCommunicationArrowColor: '#000000', // black
  appVizBackgroundColor: '#ffffff', // white
};

const visuallyImpairedLandscapeColors = {
  landVizNodeColor: '#0096be', // sky blue
  landVizApplicationColor: '#5f5f5f', // grey
  landVizCommunicationColor: '#f49100', // orange
  landVizNodeTextColor: '#ffffff', // white
  landVizApplicationTextColor: '#ffffff', // white
  landVizBackgroundColor: '#ffffff', // white
};

const darkApplicationColors = {
  appVizFoundationColor: '#c7c7c7', // grey
  appVizComponentOddColor: '#2f3d3b', // dark grey
  appVizComponentEvenColor: '#5B7B88', // blue-grey
  appVizClazzColor: '#4073b6', // blue
  appVizHighlightedEntityColor: '#ff0000', // red
  appVizComponentTextColor: '#ffffff', // white
  appVizClazzTextColor: '#ffffff', // white
  appVizFoundationTextColor: '#000000', // black
  appVizCommunicationColor: '#e3e3e3', // light grey
  appVizCommunicationArrowColor: '#000000', // black
  appVizBackgroundColor: '#acacac', // stone grey
};

const darkLandscapeColors = {
  landVizNodeColor: '#2f3d3b', // light black
  landVizApplicationColor: '#5B7B88', // blue-grey
  landVizCommunicationColor: '#e3e3e3', // light grey
  landVizNodeTextColor: '#ffffff', // white
  landVizApplicationTextColor: '#ffffff', // white
  landVizBackgroundColor: '#acacac', // stone grey
}; */

export type ApplicationSettings
= ApplicationColorSettings
& ApplicationHighlightingSettings
& ApplicationHoveringSettings
& ApplicationCommunicationSettings;

export type LandscapeSettings = LandscapeColorSettings & LandscapeHoveringSettings;

export interface Setting<T> {
  value: T;
  orderNumber: number;
  group: SettingGroup;
}

export interface FlagSetting extends Setting<boolean> {
  displayName: string;
  description: string;
  readonly isFlagSetting: true;
}

export interface ColorSetting extends Setting<string> {
  displayName: string;
  readonly isColorSetting: true;
}

export interface RangeSetting extends Setting<number> {
  displayName: string;
  description: string;
  range: {
    min: number;
    max: number;
  };
  readonly isRangeSetting: true;
}

// eslint-disable-next-line class-methods-use-this
export function isRangeSetting(x: unknown): x is RangeSetting {
  return {}.hasOwnProperty.call(x, 'isRangeSetting');
}

// eslint-disable-next-line class-methods-use-this
export function isColorSetting(x: unknown): x is ColorSetting {
  return {}.hasOwnProperty.call(x, 'isColorSetting');
}

// eslint-disable-next-line class-methods-use-this
export function isFlagSetting(x: unknown): x is FlagSetting {
  return {}.hasOwnProperty.call(x, 'isFlagSetting');
}

const defaultApplicationSettings: ApplicationSettings = {
  // Color Settings
  foundationColor: {
    value: defaultApplicationColors.foundationColor,
    orderNumber: 1,
    group: 'Colors',
    displayName: 'Foundation',
    isColorSetting: true,
  },
  componentOddColor: {
    value: defaultApplicationColors.componentOddColor,
    orderNumber: 2,
    group: 'Colors',
    displayName: 'Component Odd',
    isColorSetting: true,
  },
  componentEvenColor: {
    value: defaultApplicationColors.componentEvenColor,
    orderNumber: 3,
    group: 'Colors',
    displayName: 'Component Even',
    isColorSetting: true,
  },
  clazzColor: {
    value: defaultApplicationColors.clazzColor,
    orderNumber: 4,
    group: 'Colors',
    displayName: 'Class',
    isColorSetting: true,
  },
  highlightedEntityColor: {
    value: defaultApplicationColors.highlightedEntityColor,
    orderNumber: 5,
    group: 'Colors',
    displayName: 'Highlighted Entity',
    isColorSetting: true,
  },
  componentTextColor: {
    value: defaultApplicationColors.componentTextColor,
    orderNumber: 6,
    group: 'Colors',
    displayName: 'Component Label',
    isColorSetting: true,
  },
  clazzTextColor: {
    value: defaultApplicationColors.clazzTextColor,
    orderNumber: 7,
    group: 'Colors',
    displayName: 'Class Label',
    isColorSetting: true,
  },
  foundationTextColor: {
    value: defaultApplicationColors.foundationTextColor,
    orderNumber: 8,
    group: 'Colors',
    displayName: 'Foundation Label',
    isColorSetting: true,
  },
  communicationColor: {
    value: defaultApplicationColors.communicationColor,
    orderNumber: 9,
    group: 'Colors',
    displayName: 'Communication',
    isColorSetting: true,
  },
  communicationArrowColor: {
    value: defaultApplicationColors.communicationArrowColor,
    orderNumber: 10,
    group: 'Colors',
    displayName: 'Communication Arrow',
    isColorSetting: true,
  },
  backgroundColor: {
    value: defaultApplicationColors.backgroundColor,
    orderNumber: 11,
    group: 'Colors',
    displayName: 'Background',
    isColorSetting: true,
  },
  // Highlighting Settings
  keepHighlightingOnOpenOrClose: {
    value: true,
    orderNumber: 1,
    group: 'Highlighting',
    displayName: 'Keep Highlighting On Open Or Close',
    description: 'Toggle if highlighting should be reset on double click in application visualization',
    isFlagSetting: true,
  },
  transparencyIntensity: {
    value: 0.1,
    range: {
      min: 0.1,
      max: 1.0,
    },
    orderNumber: 2,
    group: 'Highlighting',
    displayName: 'Transparency Intensity in Application Visualization',
    description: 'Transparency effect intensity (\'Enable Transparent Components\' must be enabled)',
    isRangeSetting: true,
  },
  // Hover Effect Settings
  enableHoverEffects: {
    value: true,
    orderNumber: 1,
    group: 'Hover Effects',
    displayName: 'Enable Hover Effects',
    description: 'Hover effect (flashing entities) for mouse cursor',
    isFlagSetting: true,
  },
  // Communication Settings
  commArrowSize: {
    value: 1.0,
    range: {
      min: 0.0,
      max: 5.0,
    },
    orderNumber: 1,
    group: 'Communication',
    displayName: 'Arrow Size in Application Visualization',
    description: 'Arrow Size for selected communications in application visualization',
    isRangeSetting: true,
  },
  curvyCommHeight: {
    value: 0.0,
    range: {
      min: 0.0,
      max: 1.5,
    },
    orderNumber: 2,
    group: 'Communication',
    displayName: 'Curviness factor of the Communication Lines',
    description: 'If greater 0.0, communication lines are rendered arc-shaped (Straight lines: 0.0)',
    isRangeSetting: true,
  },
};

const defaultLanscapeSettings: LandscapeSettings = {
  // Color Settings
  nodeColor: {
    value: defaultLandscapeColors.nodeColor,
    orderNumber: 1,
    group: 'Colors',
    displayName: 'Node',
    isColorSetting: true,
  },
  applicationColor: {
    value: defaultLandscapeColors.applicationColor,
    orderNumber: 2,
    group: 'Colors',
    displayName: 'Application',
    isColorSetting: true,
  },
  communicationColor: {
    value: defaultLandscapeColors.communicationColor,
    orderNumber: 3,
    group: 'Colors',
    displayName: 'Communication',
    isColorSetting: true,
  },
  nodeTextColor: {
    value: defaultLandscapeColors.nodeTextColor,
    orderNumber: 4,
    group: 'Colors',
    displayName: 'Node Label',
    isColorSetting: true,
  },
  applicationTextColor: {
    value: defaultLandscapeColors.applicationTextColor,
    orderNumber: 5,
    group: 'Colors',
    displayName: 'Application Label',
    isColorSetting: true,
  },
  backgroundColor: {
    value: defaultLandscapeColors.backgroundColor,
    orderNumber: 6,
    group: 'Colors',
    displayName: 'Background',
    isColorSetting: true,
  },
  // Hover Effect Settings
  enableHoverEffects: {
    value: true,
    orderNumber: 1,
    group: 'Hover Effects',
    displayName: 'Enable Hover Effects',
    description: 'Hover effect (flashing entities) for mouse cursor',
    isFlagSetting: true,
  },
};

/* const COMMONSETTINGINFOS = {
  showFpsCounter: {
    displayName: 'Show FPS Counter',
    description: '\'Frames Per Second\' metrics in visualizations',
  },
}; */

export default class UserSettings extends Service {
  @tracked
  landscapeSettings: LandscapeSettings;

  @tracked
  applicationSettings: ApplicationSettings;

  constructor() {
    super(...arguments);
    this.landscapeSettings = JSON.parse(JSON.stringify(defaultLanscapeSettings));
    this.applicationSettings = JSON.parse(JSON.stringify(defaultApplicationSettings));
  }

  private restoreSettings() {
    const userSettingsJSON = localStorage.getItem('userSettings');

    if (userSettingsJSON === null) {
      throw new Error('There are no settings to restore');
    }

    const parsedSettings = JSON.parse(userSettingsJSON);

    if (this.areValidSettings(parsedSettings)) {
      this.set('landscapeSettings', parsedSettings);
    } else {
      throw new Error('The settings are invalid');
    }
  }

  applyDefaultSettings() {
    this.set('landscapeSettings', JSON.parse(JSON.stringify(defaultLanscapeSettings)));
    this.set('applicationSettings', JSON.parse(JSON.stringify(defaultApplicationSettings)));
  }

  updateSettings() {
    localStorage.setItem('userLandscapeSettings', JSON.stringify(this.landscapeSettings));
    localStorage.setItem('userApplicationSettings', JSON.stringify(this.applicationSettings));
  }

  updateApplicationSetting(name: ApplicationSettingId, value: unknown) {
    // eslint-disable-next-line
    const setting = this.applicationSettings[name];

    if (isRangeSetting(setting) && typeof value === 'number') {
      this.validateRangeSetting(setting, value);
      this.applicationSettings = {
        ...this.applicationSettings,
        [name]: { ...JSON.parse(JSON.stringify(setting)), value },
      };
      this.updateSettings();
    } else if (isFlagSetting(setting) && typeof value === 'boolean') {
      this.applicationSettings = {
        ...this.applicationSettings,
        [name]: { ...JSON.parse(JSON.stringify(setting)), value },
      };
      this.updateSettings();
    } else if (isColorSetting(setting) && typeof value === 'string') {
      /*       const regExHex = /^#(?:[0-9a-f]{3}){1,2}$/i; */
      setting.value = value;
      this.updateSettings();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private validateRangeSetting(rangeSetting: RangeSetting, value: number) {
    const { range } = rangeSetting;
    if (Number.isNaN(value)) {
      throw new Error('Value is not a number');
    } else if (value < range.min || value > range.max) {
      throw new Error(`Value must be between ${range.min} and ${range.max}`);
    }
  }

  /*   updateLandscapeColor(attribute: keyof LandscapeColorsHexString, value: string) {
    this.settings.colors.landscape[attribute] = value;
    this.updateSettings(this.settings);
  }

  updateApplicationColor(attribute: keyof ApplicationColorsHexString, value: string) {
    this.settings.colors.application[attribute] = value;
    this.updateSettings(this.settings);
  } */

  /*   setDefaultColors() {
    this.settings.colors.landscape = { ...defaultLandscapeColors };
    this.settings.colors.application = { ...defaultApplicationColors };
    this.updateSettings(this.settings);
  }

  setImpairedColors() {
    this.settings.colors.landscape = { ...visuallyImpairedLandscapeColors };
    this.settings.colors.application = { ...visuallyImpairedApplicationColors };
    this.updateSettings(this.settings);
  }

  setClassicColors() {
    this.settings.colors.landscape = { ...classicLandscapeColors };
    this.settings.colors.application = { ...classicApplicationColors };
    this.updateSettings(this.settings);
  }

  setDarkColors() {
    this.settings.colors.landscape = { ...darkLandscapeColors };
    this.settings.colors.application = { ...darkApplicationColors };
    this.updateSettings(this.settings);
  } */

  // eslint-disable-next-line class-methods-use-this
  private areValidSettings(settings: unknown): settings is Settings {
    // TODO: implement checks for properties to exist and types to be correct
    return false;
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'user-settings': UserSettings;
  }
}
