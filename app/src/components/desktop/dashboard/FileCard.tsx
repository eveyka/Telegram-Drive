import { useCallback, useState, useEffect, useRef, memo } from 'react';
import { Folder, Eye, Trash2, Link, Check, Play, MoreVertical } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { TelegramFile } from '../../../types';
import {
    cancelThumbnailLoad,
    forgetThumbnail,
    getCachedThumbnail,
    loadThumbnail,
    peekThumbnail,
    subscribeThumbnailInvalidation,
} from '../../../services/imagePreviewCache';
import { FileTypeIcon } from '../../shared/FileTypeIcon';
import { useVideoMetadata } from '../../../hooks/useVideoMetadata';
import { useCachedVariants } from '../../../hooks/useCachedVariants';
import { VideoMetaBadge } from '../../shared/VideoMetaBadge';
import { EncryptionBadge } from '../../shared/EncryptionBadge';
import { describeFileActions } from './fileActionDescriptors';
import { isImageFile, isVideoFile } from '../../../utils';
import i18n from '../../../i18n';

interface FileCardProps {
    file: TelegramFile;
    onDelete: (file: TelegramFile) => void;
    onDownload: (file: TelegramFile) => void;
    onPreview?: (file: TelegramFile, thumbnail?: string | null) => void;
    onShare?: (file: TelegramFile) => void;
    isSelected: boolean;
    onClick?: (e: React.MouseEvent, file: TelegramFile) => void;
    onContextMenu?: (e: React.MouseEvent, file: TelegramFile) => void;
    activeFolderId?: number | null;
    height?: number;
    onToggleSelection?: (id: number) => void;
    selectedIds?: number[];
    disableDrag?: boolean;
}

export const FileCard = memo(function FileCard({ file, onDelete, onDownload, onPreview, onShare, isSelected, onClick, onContextMenu, activeFolderId, height, onToggleSelection, selectedIds, disableDrag = false }: FileCardProps) {
    const actions = describeFileActions(file);
    const { isFolder } = actions;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isInViewport, setIsInViewport] = useState(false);
    const [thumbnail, setThumbnail] = useState<string | null>(() => getCachedThumbnail(file.id, activeFolderId));
    const [thumbnailReady, setThumbnailReady] = useState(() => Boolean(getCachedThumbnail(file.id, activeFolderId)));
    const fileIds = selectedIds?.includes(file.id) ? selectedIds : [file.id];
    const {
        attributes,
        listeners,
        setNodeRef: setDraggableNodeRef,
        isDragging,
    } = useDraggable({
        id: `telegram-file-${file.folder_id ?? 'home'}-${file.id}`,
        disabled: isFolder || disableDrag,
        data: { kind: 'telegram-files', fileIds, label: file.name },
    });
    const {
        setNodeRef: setDroppableNodeRef,
        isOver,
        active: dragActive,
    } = useDroppable({
        id: `content-folder-${file.id}`,
        disabled: !isFolder,
        data: { kind: 'content-folder', folderId: file.id },
    });
    const setNodeRef = useCallback((node: HTMLDivElement | null) => {
        containerRef.current = node;
        setDraggableNodeRef(node);
        setDroppableNodeRef(node);
    }, [setDraggableNodeRef, setDroppableNodeRef]);
    const isFileDragOver = isFolder && isOver && dragActive?.data.current?.kind === 'telegram-files';

    // Lazy video metadata badge (.mp4 only, bounded to viewport)
    const { data: videoMeta, isLoading: videoMetaLoading } = useVideoMetadata(
        file.id,
        file.folder_id ?? null,
        file.name,
        isInViewport,
    );

    // Cached HLS variants (bounded to viewport)
    const { data: cachedVariants } = useCachedVariants(
        file.id,
        file.folder_id ?? null,
        file.name,
        isInViewport,
    );
    const cachedQualities = (cachedVariants || []).filter(v => v.available).map(v => v.quality);

    const isImage = isImageFile(file.name, file.mime_type);
    const isVideo = isVideoFile(file.name, file.mime_type);
    const isMediaWithThumb = isImage || isVideo;
    const isPotentialMedia = isMediaWithThumb || Boolean(file.encryption_state?.startsWith('encrypted')) || file.name.endsWith('.tdenc') || file.name === 'TDENC2';

    // Viewport-only intersection observer
    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setIsInViewport(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setIsInViewport(true);
                        observer.disconnect();
                        break;
                    }
                }
            },
            { rootMargin: '250px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Lazy load thumbnail for image and video files
    useEffect(() => {
        if (isFolder || !isPotentialMedia || !isInViewport) return;

        let cancelled = false;

        const currentIsImage = isImageFile(file.name, file.mime_type);
        const currentIsVideo = isVideoFile(file.name, file.mime_type);
        const isEncrypted = Boolean(file.encryption_state?.startsWith('encrypted'));
        const isEncryptedUnlocked = file.encryption_state === 'encrypted_unlocked';
        if (!currentIsImage && !currentIsVideo && !isEncrypted) return;
        if (isEncrypted && !isEncryptedUnlocked) return;

        // 1. Synchronous check
        const syncCached = getCachedThumbnail(file.id, activeFolderId);
        if (syncCached) {
            setThumbnail(syncCached);
            setThumbnailReady(true);
            return;
        }

        // 2. Asynchronous peek (IndexedDB check) only when in viewport
        peekThumbnail(file.id, activeFolderId).then((persisted) => {
            if (cancelled) return;
            if (persisted) {
                setThumbnail(persisted);
                setThumbnailReady(true);
            } else {
                // 3. Network / IPC thumbnail extraction
                loadThumbnail(file.id, activeFolderId, 10, file.name).then((result) => {
                    if (!cancelled && result) {
                        setThumbnail(result);
                    }
                }).catch(() => {});
            }
        }).catch(() => {});

        const unsubscribe = subscribeThumbnailInvalidation(() => {
            if (!cancelled) {
                const updated = getCachedThumbnail(file.id, activeFolderId);
                if (updated) {
                    setThumbnail(updated);
                    setThumbnailReady(true);
                }
            }
        });

        return () => {
            cancelled = true;
            unsubscribe();
            if (!thumbnail) {
                cancelThumbnailLoad(file.id, activeFolderId);
            }
        };
    }, [file.id, file.name, file.mime_type, file.encryption_state, activeFolderId, isFolder, isMediaWithThumb, isPotentialMedia, isInViewport]);

    return (
        <div
            ref={setNodeRef}
            className="file-card-container file-card-optimized relative h-full min-w-0 overflow-hidden"
            style={{ opacity: isDragging ? 0.45 : undefined }}
            {...(!isFolder ? attributes : {})}
            {...(!isFolder ? listeners : {})}
            role="group"
            aria-label={file.name}
            onContextMenu={(e) => onContextMenu?.(e, file)}
            onClick={(e) => onClick?.(e, file)}
        >
            <div
                className={`group relative h-full w-full min-w-0 cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 flex flex-col justify-between
                ${isSelected 
                    ? 'border-app-accent bg-app-selected/80 shadow-lg shadow-app-accent/15 ring-2 ring-app-accent/60' 
                    : 'border-white/10 bg-slate-900/80 hover:-translate-y-0.5 hover:border-app-accent/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-black/40'}
                ${isFileDragOver ? 'bg-app-selected ring-2 ring-app-accent' : ''}`}
                style={height ? { height: `${height}px` } : { aspectRatio: '4/3' }}
            >
                {/* ── Media / File Preview Container ── */}
                <div className="relative w-full flex-1 min-h-0 overflow-hidden bg-slate-950/40 flex items-center justify-center">
                    {thumbnail ? (
                        <div className="absolute inset-0">
                            {!thumbnailReady && (
                                <div className="shimmer-effect absolute inset-0 z-0 flex items-center justify-center">
                                    <div className="opacity-25 scale-90">
                                        <FileTypeIcon filename={file.name} size="lg" className="h-12 w-12" />
                                    </div>
                                </div>
                            )}
                            <img
                                src={thumbnail}
                                alt={file.name}
                                loading="lazy"
                                decoding="async"
                                className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 motion-reduce:transition-none ${thumbnailReady ? 'opacity-100' : 'opacity-0'}`}
                                onLoad={() => setThumbnailReady(true)}
                                onError={() => {
                                    forgetThumbnail(file.id, activeFolderId);
                                    setThumbnail(null);
                                    setThumbnailReady(false);
                                }}
                            />
                            {/* Subtle dark gradient on top & bottom for high contrast */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/40 pointer-events-none" />

                            {/* Centered Glowing Play Button for Video */}
                            {isVideo && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white shadow-xl border border-white/30 group-hover:scale-110 group-hover:bg-app-accent group-hover:border-white/50 group-hover:text-black transition-all duration-300">
                                        <Play className="h-5 w-5 fill-current ms-0.5" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : isVideo ? (
                        /* Dedicated Video Poster Placeholder */
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 p-4 select-none">
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 shadow-md group-hover:scale-110 group-hover:border-indigo-400/60 transition-transform">
                                <Play className="h-6 w-6 fill-indigo-400/30 text-indigo-400 ms-0.5" />
                            </div>
                            <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-indigo-300/70 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                Video
                            </span>
                        </div>
                    ) : isImage ? (
                        /* Image Loading / Placeholder */
                        <div className="shimmer-effect absolute inset-0 flex items-center justify-center bg-slate-950/60">
                            <div className="opacity-30 transition-transform duration-200 group-hover:scale-110">
                                <FileTypeIcon filename={file.name} size="lg" className="h-12 w-12 drop-shadow-sm" />
                            </div>
                        </div>
                    ) : (
                        /* Standard Document / File / Folder Icon */
                        <div className="absolute inset-0 flex items-center justify-center p-3 transition-transform duration-200 group-hover:scale-110">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/40 border border-white/5 shadow-inner">
                                {isFolder ? (
                                    <Folder className="h-8 w-8 text-app-accent drop-shadow-sm" strokeWidth={1.75} />
                                ) : (
                                    <FileTypeIcon filename={file.name} size="lg" className="h-8 w-8 drop-shadow-sm" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Top-Left: Selection Checkbox & Type Pill ── */}
                    <div className="absolute start-2 top-2 z-20 flex items-center gap-1.5">
                        <button
                            type="button"
                            aria-label={isSelected ? `Deselect ${file.name}` : `Select ${file.name}`}
                            aria-pressed={isSelected}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleSelection) onToggleSelection(file.id);
                            }}
                            className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition-all duration-150 shadow-md ${
                                isSelected
                                    ? 'border-app-accent bg-app-accent text-app-accent-contrast scale-100'
                                    : 'border-white/40 bg-black/50 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:scale-110'
                            }`}
                        >
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </button>
                    </div>

                    {/* ── Top-Right: Quick Actions Floating Glass Pill ── */}
                    <div className="absolute end-2 top-2 z-20 flex items-center gap-0.5 rounded-full border border-white/20 bg-slate-950/75 p-1 opacity-0 shadow-xl backdrop-blur-md transition-all duration-200 group-hover:opacity-100 focus-within:opacity-100">
                        <button
                            type="button"
                            aria-label={`Preview ${file.name}`}
                            onClick={(e) => { e.stopPropagation(); if (onPreview) onPreview(file, thumbnail); }}
                            className="quiet-control flex h-6 w-6 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                            title={i18n.t("files.preview")}
                        >
                            <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            aria-label={`Download ${file.name}`}
                            onClick={(e) => { e.stopPropagation(); onDownload(file); }}
                            className="quiet-control flex h-6 w-6 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                            title={i18n.t("files.download")}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </button>
                        {actions.canShare && onShare && (
                            <button
                                type="button"
                                aria-label={`Share ${file.name}`}
                                onClick={(e) => { e.stopPropagation(); onShare(file); }}
                                className="quiet-control flex h-6 w-6 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                                title={i18n.t("files.share")}
                            >
                                <Link className="h-3.5 w-3.5" />
                            </button>
                        )}
                        <button
                            type="button"
                            aria-label={`Delete ${file.name}`}
                            onClick={(e) => { e.stopPropagation(); onDelete(file); }}
                            className="quiet-control flex h-6 w-6 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-rose-500/80 hover:text-white"
                            title="Delete"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            aria-label={`More actions for ${file.name}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onContextMenu?.(e, file);
                            }}
                            className="quiet-control flex h-6 w-6 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                            title={i18n.t("common.more_options", "More options")}
                        >
                            <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* ── Bottom Info Drawer (Clean Structured File Details) ── */}
                <div className="relative z-10 shrink-0 border-t border-white/10 bg-slate-950/85 backdrop-blur-md px-3 py-2">
                    <h2
                        className="block w-full min-w-0 truncate text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors tracking-tight leading-tight"
                        title={file.name}
                    >
                        {file.name}
                    </h2>
                    <div className="mt-1 flex items-center justify-between gap-1 text-[11px] text-slate-400 font-medium">
                        <span className="truncate font-mono">{file.sizeStr}</span>
                        <div className="flex items-center gap-1 shrink-0">
                            <EncryptionBadge state={file.encryption_state ?? 'plain'} className="shrink-0" />
                            <VideoMetaBadge metadata={videoMeta} isLoading={videoMetaLoading} />
                            {cachedQualities.length > 0 && (
                                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/25">
                                    <Check className="h-2.5 w-2.5" />
                                    {cachedQualities[0]}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
