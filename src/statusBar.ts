import * as vscode from 'vscode';
import * as Types from './types';
import { ApiClient } from './apiClient';
import { QuickPick } from './quickPick';

export class StatusBar {
  private apiClient: ApiClient;
  private quickPick: QuickPick;
  private statusBarItem: vscode.StatusBarItem;
  private statusBarInterval: NodeJS.Timeout | undefined;

  constructor(apiClient: ApiClient, quickPick: QuickPick, statusBarItem: vscode.StatusBarItem) {
    this.apiClient = apiClient;
    this.quickPick = quickPick;
    this.statusBarItem = statusBarItem;
    this.statusBarInterval = undefined;
  }

  public async setup() {
    const self = this;
    this.statusBarInterval = setInterval(async () => {
      try {
        await self.updateBuildStatus();
      } catch (err) {
        console.log(err);
      }
    }, 60000);
    await this.updateBuildStatus();
  }

  public async updateBuildStatus() {
    const recentBuilds: Types.RecentBuild[] = await this.apiClient.getRecentBuilds();
    this.updateItem(recentBuilds[0]);
    this.quickPick.updateRecentBuilds(recentBuilds);
  }

  public clearStatusBarInterval() {
    if (this.statusBarInterval) {
      clearInterval(this.statusBarInterval);
    }
  }

  public updateItem(recentBuild: Types.RecentBuild | undefined) {
    let text: string;
    if (!recentBuild) {
      text = 'CircleCI: Build not found';
    } else {
      switch (recentBuild.status) {
        case 'queued':
          text = 'CircleCI: $(kebab-horizontal) QUEUED';
          break;
        case 'running':
          text = 'CircleCI: $(kebab-horizontal) RUNNING';
          break;
        case 'failed':
          text = 'CircleCI: $(stop) FAILED';
          break;
        case 'success':
          text = 'CircleCI: $(check) SUCCESS';
          break;
        case 'canceled':
          text = 'CircleCI: $(circle-slash) CANCELED';
          break;
        default:
          text = 'CircleCI: $(question) UNKNOWN';
          break;
      }
    }

    this.statusBarItem.text = text;
    this.statusBarItem.show();
  }
}
