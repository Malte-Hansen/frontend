import Service, { inject as service } from '@ember/service';
import debugLogger from 'ember-debug-logger';
import {
  CommitTree,
  AppNameCommitTreeMap,
} from 'explorviz-frontend/utils/evolution-schemes/evolution-data';
import { StructureLandscapeData } from 'explorviz-frontend/utils/landscape-schemes/structure-data';
import EvolutionDataFetchServiceService from '../evolution-data-fetch-service';
import { tracked } from '@glimmer/tracking';
import { SelectedCommit } from 'explorviz-frontend/utils/commit-tree/commit-tree-handler';
import {
  combineStructureLandscapeData,
  createEmptyStructureLandscapeData,
} from 'explorviz-frontend/utils/landscape-structure-helpers';

export default class EvolutionDataRepository extends Service {
  private readonly debug = debugLogger('EvolutionDataRepository');

  // #region Services

  @service('evolution-data-fetch-service')
  evolutionDataFetchService!: EvolutionDataFetchServiceService;

  // #endregion

  // #region Properties

  @tracked private _evolutionStructureLandscapeData: Map<
    string,
    StructureLandscapeData
  > = new Map();
  // <appName, StructureLandscapeData>

  @tracked private _appNameCommitTreeMap: AppNameCommitTreeMap = new Map();

  @tracked combinedStructureLandscapes: StructureLandscapeData =
    createEmptyStructureLandscapeData();

  // #endregion

  // #region Getter / Setter

  get evolutionStructureLandscapeData(): Map<string, StructureLandscapeData> {
    return this._evolutionStructureLandscapeData;
  }

  get appNameCommitTreeMap(): AppNameCommitTreeMap {
    return this._appNameCommitTreeMap;
  }

  // #endregion

  // #region Fetch functions

  async fetchAllApplications(): Promise<void> {
    this.debug('fetchAllApplications');
    try {
      const applicationNames: string[] =
        await this.evolutionDataFetchService.fetchApplications();
      const appNameCommitTreeMap: AppNameCommitTreeMap = new Map();

      for (const appName of applicationNames) {
        const commitTreeForAppName =
          await this.fetchCommitTreeForAppName(appName);

        if (commitTreeForAppName) {
          appNameCommitTreeMap.set(appName, commitTreeForAppName);
        }
      }

      this._appNameCommitTreeMap = appNameCommitTreeMap;
    } catch (reason) {
      this.resetAppNameCommitTreeMap();
      console.error(`Failed to build AppNameCommitTreeMap, reason: ${reason}`);
    }
  }

  async fetchAndSetAllStructureLandscapeDataForSelectedCommits(
    appNameToSelectedCommits: Map<string, SelectedCommit[]>
  ): Promise<void> {
    const newEvolutionStructureLandscapeData: Map<
      string,
      StructureLandscapeData
    > = new Map();
    let allCombinedStructureLandscapes: StructureLandscapeData =
      createEmptyStructureLandscapeData();

    for (const [appName, selectedCommits] of appNameToSelectedCommits) {
      try {
        const combinedLandscapeStructureForAppAndCommits =
          await this.evolutionDataFetchService.fetchStaticLandscapeStructuresForAppName(
            appName,
            selectedCommits
          );

        newEvolutionStructureLandscapeData.set(
          appName,
          combinedLandscapeStructureForAppAndCommits
        );

        allCombinedStructureLandscapes = combineStructureLandscapeData(
          allCombinedStructureLandscapes,
          combinedLandscapeStructureForAppAndCommits
        );
      } catch (reason) {
        console.error(
          `Failed to fetch and set structure landscape data for app: ${appName}, reason: ${reason}`
        );
      }
    }

    this._evolutionStructureLandscapeData = newEvolutionStructureLandscapeData;
    this.combinedStructureLandscapes = allCombinedStructureLandscapes;
  }

  // #endregion

  // #region Reset functions

  resetStructureLandscapeData(): void {
    this.debug('Reset Evolution StructureLandscapeData');
    this.resetEvolutionStructureLandscapeData();
  }

  resetAllEvolutionData(): void {
    this.debug('Reset All Evolution Data');
    this.resetEvolutionStructureLandscapeData();
    this.resetAppNameCommitTreeMap();
  }

  resetEvolutionStructureLandscapeData(): void {
    this._evolutionStructureLandscapeData = new Map();
    this.combinedStructureLandscapes = createEmptyStructureLandscapeData();
  }

  resetAppNameCommitTreeMap(): void {
    this._appNameCommitTreeMap = new Map();
  }

  // #endregion

  // #region Private Helper Functions

  private async fetchCommitTreeForAppName(
    appName: string
  ): Promise<CommitTree | undefined> {
    try {
      const evolutionApplication: CommitTree =
        await this.evolutionDataFetchService.fetchCommitTreeForAppName(appName);
      return evolutionApplication;
    } catch (reason) {
      console.error(
        `Failed to fetch Commit Tree for appName: ${appName}, reason: ${reason}`
      );
      return undefined;
    }
  }

  // #endregion
}

declare module '@ember/service' {
  interface Registry {
    'evolution-data-repository': EvolutionDataRepository;
  }
}
