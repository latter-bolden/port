import { HandlerEntry } from '../server/ipc';
import { ipcRenderer as ipc} from 'electron'
import { DB, Settings, SettingsDocument } from '../db';
import { each } from 'async';

export interface SettingsHandlers {
    'get-settings': SettingsService['getSettings'];
    'set-setting': SettingsService['setSetting'];
}

const defaultSettings: SettingsDocument[] = [
  { name: 'seen-grid-update-modal', value: 'false' }
]

export class SettingsService {
  private readonly db: DB;

  constructor(db: DB) {
      this.db = db;
      this.setupDefaults();
  }

  handlers(): HandlerEntry<SettingsHandlers>[] {
      return [
          { name: 'get-settings', handler: this.getSettings.bind(this) },
          { name: 'set-setting', handler: this.setSetting.bind(this) }
      ]
  }

  async getSettings(query?: Partial<SettingsDocument>): Promise<SettingsDocument[] | null> {
    return this.db.settings.asyncFind(query || {});
  }

  async setSetting(key: Settings, value: string): Promise<unknown> {
    return this.db.settings.asyncUpdate({ name: key }, { name: key, value })
  }

  private setupDefaults(): void {
    each(defaultSettings, async setting => {
      const target = await this.db.settings.asyncFind({ name: setting.name });

      if (target.length === 0) {
        await this.db.settings.asyncInsert(setting);
      }
    })
  }
}
