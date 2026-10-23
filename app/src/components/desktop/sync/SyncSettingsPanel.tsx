import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { AlertTriangle, FolderInput, HardDrive, Link2, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useSync } from '../../../context/SyncContext';
import type { TelegramFolder } from '../../../types';
import { userFacingError } from '../../../services/userFacingError';

export function SyncSettingsPanel() {
  const { t } = useTranslation();
  const { settings, pairs, setEnabled, addPair, removePair } = useSync();
  const [folders, setFolders] = useState<TelegramFolder[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const enabled = settings.data?.enabled ?? false;

  useEffect(() => {
    void invoke<TelegramFolder[]>('cmd_get_enriched_folders').then(setFolders).catch(() => setFolders([]));
  }, []);

  const selectedFolder = useMemo(() => folders.find((folder) => folder.id === channelId), [channelId, folders]);

  const chooseFolder = async () => {
    const selected = await open({ directory: true, multiple: false, title: t('settings.sync.select_folder') });
    if (typeof selected === 'string') setSelectedPath(selected);
  };

  const savePair = async () => {
    if (!selectedPath || channelId === '') return;
    setBusy(true);
    try {
      await addPair(selectedPath, channelId, selectedFolder?.name);
      setSelectedPath(null);
      setChannelId('');
      toast.success(t('settings.sync.folder_added'));
    } catch (error) {
      toast.error(userFacingError(error, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-6" aria-labelledby="folder-sync-title">
      <div className="flex items-start justify-between gap-5 rounded-xl border border-app-border-subtle bg-app-surface-sunken/50 p-4.5 shadow-2xs">
        <div className="flex gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
            <FolderInput className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 id="folder-sync-title" className="text-sm font-semibold text-app-text">{t('settings.sync.title')}</h3>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-app-text-secondary">{t('settings.sync.description')}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={busy || settings.isLoading}
          onClick={async () => {
            setBusy(true);
            try { await setEnabled(!enabled); }
            catch (error) { toast.error(userFacingError(error, t)); }
            finally { setBusy(false); }
          }}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${enabled ? 'bg-sky-500' : 'bg-app-border-strong'} disabled:opacity-50`}
          aria-label={t('settings.sync.toggle')}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${enabled ? 'translate-x-5.5 rtl:-translate-x-5.5' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
        </button>
      </div>

      {!enabled && (
        <div className="rounded-xl border border-app-accent/25 bg-app-accent/5 p-4">
          <div className="flex gap-3">
            <HardDrive className="mt-0.5 h-5 w-5 text-app-accent shrink-0" />
            <div>
              <p className="text-xs font-semibold text-app-text">{t('settings.sync.off_by_default')}</p>
              <p className="mt-1 text-xs leading-relaxed text-app-text-secondary">{t('settings.sync.onboarding')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3.5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-app-text-tertiary">{t('settings.sync.folder_mapper')}</h4>
          <p className="mt-1 text-xs text-app-text-secondary">{t('settings.sync.mapper_description')}</p>
        </div>

        {(pairs.data ?? []).map((pair) => (
          <div key={pair.id} className="flex items-center gap-3.5 p-3.5 rounded-xl border border-app-border-subtle bg-app-surface-sunken/60 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/20">
              <Link2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-app-text">{pair.label ?? pair.channelId}</p>
              <p className="truncate text-[11px] text-app-text-tertiary font-mono mt-0.5" title={pair.localPath}>{pair.localPath}</p>
            </div>
            <button
              type="button"
              onClick={() => void removePair(pair.id).catch((error) => toast.error(userFacingError(error, t)))}
              className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              title={t('settings.sync.remove')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <div className="rounded-xl border border-dashed border-app-border/80 bg-app-surface-sunken/30 p-4">
          <div className="grid gap-2.5 sm:grid-cols-[1.2fr_1.2fr_auto]">
            <button
              type="button"
              onClick={chooseFolder}
              className="flex h-10 min-w-0 items-center gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-start text-xs text-app-text hover:bg-app-hover hover:border-app-border-strong transition cursor-pointer shadow-2xs"
            >
              <FolderInput className="h-3.5 w-3.5 text-app-accent shrink-0" />
              <span className="truncate">{selectedPath ?? t('settings.sync.add_folder')}</span>
            </button>
            <select
              value={channelId}
              onChange={(event) => setChannelId(event.target.value ? Number(event.target.value) : '')}
              className="h-10 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-xs text-app-text focus:border-app-accent focus:outline-none transition shadow-2xs"
            >
              <option value="">{t('settings.sync.select_channel')}</option>
              {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
            </select>
            <button
              type="button"
              disabled={!selectedPath || channelId === '' || busy}
              onClick={savePair}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{t('common.save')}</span>
            </button>
          </div>
          {folders.length === 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{t('settings.sync.no_channels')}</span>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
