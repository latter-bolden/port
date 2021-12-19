import { HandlerEntry } from '../server/ipc';
import { ipcRenderer as ipc} from 'electron'
import { DB, Settings, SettingsDocument } from '../db';
import { each } from 'async';

export interface SettingsHandlers {
    'get-settings': SettingsService['getSettings'];
    'set-setting': SettingsService['setSetting'];
    'refresh-settings': SettingsService['refreshSettings'];
}

const defaultSettings: SettingsDocument[] = [
  { name: 'seen-grid-update-modal', value: 'false' },
  { name: 'global-leap', value: 'true' }
]

export class SettingsService {
  private readonly db: DB;

  constructor(db: DB) {
      this.db = db;
      this.setupDefaults();
      this.sendUpdate();
  }

  handlers(): HandlerEntry<SettingsHandlers>[] {
      return [
          { name: 'get-settings', handler: this.getSettings.bind(this) },
          { name: 'set-setting', handler: this.setSetting.bind(this) },
          { name: 'refresh-settings', handler: this.refreshSettings.bind(this) }
      ]
  }

  async getSettings(query?: Partial<SettingsDocument>): Promise<SettingsDocument[] | null> {
    return this.db.settings.asyncFind(query || {});
  }

  async setSetting(key: Settings, value: string): Promise<unknown> {
    const update = await this.db.settings.asyncUpdate({ name: key }, { name: key, value });
    await this.sendUpdate();
    return update;
  }

  async refreshSettings(): Promise<void> {
    return this.sendUpdate();
  }

  private setupDefaults(): void {
    each(defaultSettings, async setting => {
      const target = await this.db.settings.asyncFind({ name: setting.name });

      if (target.length === 0) {
        await this.db.settings.asyncInsert(setting);
      }
    })
  }

  private async sendUpdate() {
    const settings = await this.getSettings();
    await ipc.invoke('update-settings', settings.reduce((map, setting) => {
        map[setting.name] = setting.value;
        return map;
    }, {}) as Record<Settings, string>)
  }
}
