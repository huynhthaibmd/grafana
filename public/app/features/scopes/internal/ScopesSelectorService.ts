import { isEqual } from 'lodash';
import { BehaviorSubject, from, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { getScopesService } from '../services';

import { fetchNodes, fetchScope, fetchSelectedScopes } from './api';
import { NodeReason, NodesMap, SelectedScope, TreeScope } from './types';
import { getBasicScope, getScopesAndTreeScopesWithPaths, getTreeScopesFromSelectedScopes } from './utils';

export interface State {
  isOpened: boolean;
  loadingNodeName: string | undefined;
  nodes: NodesMap;
  selectedScopes: SelectedScope[];
  treeScopes: TreeScope[];
}

const getInitialState = (): State => ({
  isOpened: false,
  loadingNodeName: undefined,
  nodes: {
    '': {
      name: '',
      reason: NodeReason.Result,
      nodeType: 'container',
      title: '',
      isExpandable: true,
      isSelectable: false,
      isExpanded: true,
      query: '',
      nodes: {},
    },
  },
  selectedScopes: [],
  treeScopes: [],
});

export class ScopesSelectorService {
  private _state = new BehaviorSubject(getInitialState());
  private prevState = getInitialState();

  private nodesFetchingSub: Subscription | undefined;

  constructor() {
    getScopesService()?.subscribeToState(async (newState, prevState) => {
      if (newState.pendingScopes !== prevState.pendingScopes && newState.pendingScopes) {
        await this.applyNewScopes(newState.pendingScopes.map((scopeName) => ({ scopeName, path: [] })));
        getScopesService()?.setNewScopes(null);
      }

      if (newState.isReadOnly && this.state.isOpened) {
        this.closePicker();
      }
    });
  }

  public get state() {
    return this._state.getValue();
  }

  public get stateObservable() {
    return this._state.asObservable();
  }

  public updateNode = async (path: string[], isExpanded: boolean, query: string) => {
    this.nodesFetchingSub?.unsubscribe();

    let newNodes = { ...this.state.nodes };
    let currentLevel: NodesMap = newNodes;

    for (let idx = 0; idx < path.length - 1; idx++) {
      currentLevel = currentLevel[path[idx]].nodes;
    }

    const name = path[path.length - 1];
    const currentNode = currentLevel[name];

    const isDifferentQuery = currentNode.query !== query;

    currentNode.isExpanded = isExpanded;
    currentNode.query = query;

    if (isExpanded || isDifferentQuery) {
      this.updateState({ nodes: newNodes, loadingNodeName: name });

      this.nodesFetchingSub = from(fetchNodes(name, query))
        .pipe(
          finalize(() => {
            this.updateState({ loadingNodeName: undefined });
          })
        )
        .subscribe((childNodes) => {
          const [newSelectedScopes, newTreeScopes] = getScopesAndTreeScopesWithPaths(
            this.state.selectedScopes,
            this.state.treeScopes,
            path,
            childNodes
          );

          const persistedNodes = newTreeScopes
            .map(({ path }) => path[path.length - 1])
            .filter((nodeName) => nodeName in currentNode.nodes && !(nodeName in childNodes))
            .reduce<NodesMap>((acc, nodeName) => {
              acc[nodeName] = {
                ...currentNode.nodes[nodeName],
                reason: NodeReason.Persisted,
              };

              return acc;
            }, {});

          currentNode.nodes = { ...persistedNodes, ...childNodes };

          this.updateState({ nodes: newNodes, selectedScopes: newSelectedScopes, treeScopes: newTreeScopes });

          this.nodesFetchingSub?.unsubscribe();
        });
    } else {
      this.updateState({ nodes: newNodes, loadingNodeName: undefined });
    }
  };

  public toggleNodeSelect = (path: string[]) => {
    let newTreeScopes = [...this.state.treeScopes];

    let parentNode = this.state.nodes[''];

    for (let idx = 1; idx < path.length - 1; idx++) {
      parentNode = parentNode.nodes[path[idx]];
    }

    const nodeName = path[path.length - 1];
    const { linkId } = parentNode.nodes[nodeName];

    const selectedIdx = newTreeScopes.findIndex(({ scopeName }) => scopeName === linkId);

    if (selectedIdx === -1) {
      fetchScope(linkId!);

      const selectedFromSameNode =
        newTreeScopes.length === 0 ||
        Object.values(parentNode.nodes).some(({ linkId }) => linkId === newTreeScopes[0].scopeName);

      const treeScope = {
        scopeName: linkId!,
        path,
      };

      this.updateState({
        treeScopes:
          parentNode?.disableMultiSelect || !selectedFromSameNode ? [treeScope] : [...newTreeScopes, treeScope],
      });
    } else {
      newTreeScopes.splice(selectedIdx, 1);

      this.updateState({ treeScopes: newTreeScopes });
    }
  };

  public applyNewScopes = async (localTreeScopes = this.state.treeScopes) => {
    if (isEqual(localTreeScopes, getTreeScopesFromSelectedScopes(this.state.selectedScopes))) {
      return;
    }

    this.updateState({
      selectedScopes: localTreeScopes.map(({ scopeName, path }) => ({ scope: getBasicScope(scopeName), path })),
      treeScopes: localTreeScopes,
    });
    getScopesService()?.enterLoadingMode();

    const newSelectedScopes = await fetchSelectedScopes(localTreeScopes);

    this.updateState({ selectedScopes: newSelectedScopes });
    getScopesService()?.setCurrentScopes(newSelectedScopes.map(({ scope }) => scope));
    getScopesService()?.exitLoadingMode();
  };

  public dismissNewScopes = () => {
    this.updateState({ treeScopes: getTreeScopesFromSelectedScopes(this.state.selectedScopes) });
  };

  public removeAllScopes = () => {
    this.applyNewScopes([]);
  };

  public openPicker = async () => {
    if (!getScopesService()?.state.isReadOnly) {
      if (Object.keys(this.state.nodes[''].nodes).length === 0) {
        await this.updateNode([''], true, '');
      }

      let newNodes = { ...this.state.nodes };

      // First close all nodes
      newNodes = this.closeNodes(newNodes);

      // Extract the path of a scope
      let path = [...(this.state.selectedScopes[0]?.path ?? ['', ''])];
      path.splice(path.length - 1, 1);

      // Expand the nodes to the selected scope
      newNodes = this.expandNodes(newNodes, path);

      this.updateState({ nodes: newNodes, isOpened: true });
    }
  };

  public closePicker = () => {
    this.updateState({ isOpened: false });
  };

  public subscribeToState = (cb: (newState: State, prevState: State) => void): Subscription => {
    return this._state.subscribe((newState) => cb(newState, this.prevState));
  };

  private closeNodes = (nodes: NodesMap): NodesMap => {
    return Object.entries(nodes).reduce<NodesMap>((acc, [id, node]) => {
      acc[id] = {
        ...node,
        isExpanded: false,
        nodes: this.closeNodes(node.nodes),
      };

      return acc;
    }, {});
  };

  private expandNodes = (nodes: NodesMap, path: string[]): NodesMap => {
    nodes = { ...nodes };
    let currentNodes = nodes;

    for (let i = 0; i < path.length; i++) {
      const nodeId = path[i];

      currentNodes[nodeId] = {
        ...currentNodes[nodeId],
        isExpanded: true,
      };
      currentNodes = currentNodes[nodeId].nodes;
    }

    return nodes;
  };

  private updateState = (newState: Partial<State>) => {
    this.prevState = this.state;
    this._state.next({ ...this._state.getValue(), ...newState });
  };
}
