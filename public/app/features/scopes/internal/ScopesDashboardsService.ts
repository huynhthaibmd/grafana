import { isEqual } from 'lodash';
import { BehaviorSubject, from, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ScopeDashboardBinding } from '@grafana/data';

import { getScopesService } from '../services';

import { fetchDashboards } from './api';
import { SuggestedDashboardsFoldersMap } from './types';
import { filterFolders, groupDashboards } from './utils';

export interface State {
  // by keeping a track of the raw response, it's much easier to check if we got any dashboards for the currently selected scopes
  dashboards: ScopeDashboardBinding[];
  // a filtered version of the `folders` property. this prevents a lot of unnecessary parsings in React renders
  filteredFolders: SuggestedDashboardsFoldersMap;
  // this is a grouping in folders of the `dashboards` property. it is used for filtering the dashboards and folders when the search query changes
  folders: SuggestedDashboardsFoldersMap;
  forScopeNames: string[];
  isLoading: boolean;
  isOpened: boolean;
  searchQuery: string;
}

const getInitialState = (): State => ({
  dashboards: [],
  filteredFolders: {},
  folders: {},
  forScopeNames: [],
  isLoading: false,
  isOpened: false,
  searchQuery: '',
});

export class ScopesDashboardsService {
  private _state = new BehaviorSubject(getInitialState());
  private prevState = getInitialState();

  private dashboardsFetchingSub: Subscription | undefined;

  constructor() {
    getScopesService()?.subscribeToState((newState, prevState) => {
      if (newState.value !== prevState.value) {
        this.fetchDashboards(newState.value.map((scope) => scope.metadata.name));
      }
    });
  }

  public get state() {
    return this._state.getValue();
  }

  public get stateObservable() {
    return this._state.asObservable();
  }

  public updateFolder = (path: string[], isExpanded: boolean) => {
    let newFolders = { ...this.state.folders };
    let newFilteredFolders = { ...this.state.filteredFolders };
    let currentLevelFolders: SuggestedDashboardsFoldersMap = newFolders;
    let currentLevelFilteredFolders: SuggestedDashboardsFoldersMap = newFilteredFolders;

    for (let idx = 0; idx < path.length - 1; idx++) {
      currentLevelFolders = currentLevelFolders[path[idx]].folders;
      currentLevelFilteredFolders = currentLevelFilteredFolders[path[idx]].folders;
    }

    const name = path[path.length - 1];
    const currentFolder = currentLevelFolders[name];
    const currentFilteredFolder = currentLevelFilteredFolders[name];

    currentFolder.isExpanded = isExpanded;
    currentFilteredFolder.isExpanded = isExpanded;

    this.updateState({
      folders: newFolders,
      filteredFolders: newFilteredFolders,
    });
  };

  public changeSearchQuery = (newSearchQuery: string) => {
    newSearchQuery = newSearchQuery ?? '';

    this.updateState({
      filteredFolders: filterFolders(this.state.folders, newSearchQuery),
      searchQuery: newSearchQuery,
    });
  };

  public clearSearchQuery = () => {
    this.changeSearchQuery('');
  };

  public toggleDrawer = () => {
    this.updateState({ isOpened: !this.state.isOpened });
  };

  public subscribeToState = (cb: (newState: State, prevState: State) => void) => {
    return this._state.subscribe((newState) => cb(newState, this.prevState));
  };

  private fetchDashboards = async (scopeNames: string[]) => {
    if (isEqual(this.state.forScopeNames, scopeNames)) {
      return;
    }

    this.dashboardsFetchingSub?.unsubscribe();

    if (scopeNames.length === 0) {
      this.updateState({
        dashboards: [],
        filteredFolders: {},
        folders: {},
        forScopeNames: [],
        isLoading: false,
        isOpened: false,
      });

      return;
    }

    this.updateState({ forScopeNames: scopeNames, isLoading: true });

    this.dashboardsFetchingSub = from(fetchDashboards(scopeNames))
      .pipe(
        finalize(() => {
          this.updateState({ isLoading: false });
        })
      )
      .subscribe((newDashboards) => {
        const newFolders = groupDashboards(newDashboards);
        const newFilteredFolders = filterFolders(newFolders, this.state.searchQuery);

        this.updateState({
          dashboards: newDashboards,
          filteredFolders: newFilteredFolders,
          folders: newFolders,
          isLoading: false,
          isOpened: true,
        });

        this.dashboardsFetchingSub?.unsubscribe();
      });
  };

  private updateState = (newState: Partial<State>) => {
    this.prevState = this.state;
    this._state.next({ ...this._state.getValue(), ...newState });
  };
}
