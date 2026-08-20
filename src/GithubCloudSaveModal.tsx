import React, { useState, useEffect } from 'react';
import {
  Cloud,
  Lock,
  Github,
  Key,
  Eye,
  EyeOff,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import {
  getStoredGithubConfig,
  saveGithubConfig,
  testGithubToken,
  pushToGithubCloud,
  pullFromGithubCloud,
  GithubCloudConfig,
} from './githubCloudSave';
import { Lang, t } from './i18n';

interface GithubCloudSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Lang;
  uiFont?: string;
  theme?: {
    isDark?: boolean;
    bg?: string;
    surface?: string;
    text?: string;
    muted?: string;
    border?: string;
    accent?: string;
  };
  onDataRestored?: () => void;
}

export default function GithubCloudSaveModal({
  isOpen,
  onClose,
  lang = 'en',
  uiFont = 'Inter',
  theme,
  onDataRestored,
}: GithubCloudSaveModalProps) {
  const isDark = theme?.isDark ?? true;
  const textColor = theme?.text || (isDark ? '#f8fafc' : '#0f172a');
  const textMuted = theme?.textMuted || (isDark ? '#94a3b8' : '#64748b');
  const textFaint = theme?.textFaint || (isDark ? '#64748b' : '#94a3b8');
  const borderColor = theme?.border || (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)');
  const borderFaint = theme?.borderFaint || (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)');
  const modalBg = theme?.surface || (isDark ? '#0f172a' : '#ffffff');
  const headerBg = theme?.header || (isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)');
  const inputBg = isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.9)';
  const cardBg = isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.8)';
  const accentColor = theme?.accent || '#6366f1';

  const [config, setConfig] = useState<GithubCloudConfig>({ githubToken: '', secretCode: '' });
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [githubUser, setGithubUser] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'test' | 'push' | 'pull' | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedGistId, setCopiedGistId] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredGithubConfig();
      setConfig(stored);
      setStatusMsg(null);
      if (stored.githubToken) {
        testGithubToken(stored.githubToken)
          .then(u => setGithubUser(u.username))
          .catch(() => setGithubUser(null));
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    saveGithubConfig(config);
  };

  const handleTestToken = async () => {
    if (!config.githubToken.trim()) {
      setStatusMsg({ type: 'error', text: t(lang, 'pleaseEnterToken') });
      return;
    }
    setLoading(true);
    setActionType('test');
    setStatusMsg(null);
    try {
      const u = await testGithubToken(config.githubToken);
      setGithubUser(u.username);
      handleSaveConfig();
      setStatusMsg({
        type: 'success',
        text: `${t(lang, 'connectionSuccess')} @${u.username}`,
      });
    } catch (err: unknown) {
      setGithubUser(null);
      const msg = err instanceof Error ? err.message : t(lang, 'connectionFailed');
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const handlePush = async () => {
    if (!config.githubToken.trim()) {
      setStatusMsg({ type: 'error', text: t(lang, 'pleaseEnterTokenBeforeSave') });
      return;
    }
    if (!config.secretCode.trim()) {
      setStatusMsg({ type: 'error', text: t(lang, 'pleaseEnterSecretCode') });
      return;
    }

    setLoading(true);
    setActionType('push');
    setStatusMsg(null);
    try {
      const res = await pushToGithubCloud(config);
      setConfig(prev => ({ ...prev, gistId: res.gistId, lastSyncedAt: res.updatedAt }));
      setStatusMsg({
        type: 'success',
        text: t(lang, 'saveSuccess'),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t(lang, 'saveFailed');
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const handlePull = async () => {
    if (!config.githubToken.trim()) {
      setStatusMsg({ type: 'error', text: t(lang, 'pleaseEnterToken') });
      return;
    }
    if (!config.gistId?.trim()) {
      setStatusMsg({ type: 'error', text: t(lang, 'pleaseEnterGistId') });
      return;
    }
    if (!config.secretCode.trim()) {
      setStatusMsg({ type: 'error', text: t(lang, 'pleaseEnterSecretCodeDecrypt') });
      return;
    }

    setLoading(true);
    setActionType('pull');
    setStatusMsg(null);
    try {
      const res = await pullFromGithubCloud(config);
      setConfig(prev => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      setStatusMsg({
        type: 'success',
        text: t(lang, 'decryptSuccess').replace('{projectCount}', String(res.projectCount)),
      });
      if (onDataRestored) {
        onDataRestored();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t(lang, 'decryptFailed');
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const copyGistIdToClipboard = () => {
    if (config.gistId) {
      navigator.clipboard.writeText(config.gistId);
      setCopiedGistId(true);
      setTimeout(() => setCopiedGistId(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-200">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-all duration-200"
        style={{
          fontFamily: uiFont,
          backgroundColor: modalBg,
          borderColor: borderColor,
          color: textColor,
        }}
      >
        {/* Minimalist Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{
            backgroundColor: headerBg,
            borderColor: borderFaint,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              <Github size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">{t(lang, 'githubCloudSaveTitle')}</h3>
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                  <ShieldCheck size={11} /> AES-256
                </span>
              </div>
              <p className="text-[11px] mt-0.5 opacity-70" style={{ color: textMuted }}>
                {t(lang, 'githubCloudSaveDesc')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: textColor }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4">
          {/* Status notification banner */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed transition-all ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium text-[11px] sm:text-xs">{statusMsg.text}</div>
            </div>
          )}

          {/* Section 1: Secret Code (Encryption key) */}
          <div
            className="p-3.5 sm:p-4 rounded-xl border transition-all"
            style={{
              backgroundColor: cardBg,
              borderColor: borderFaint,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Lock size={14} style={{ color: accentColor }} />
              <label className="text-[11px] font-bold tracking-wider uppercase opacity-90">{t(lang, 'secretCode')}</label>
            </div>
            <p className="text-[11px] mb-2.5 leading-snug" style={{ color: textFaint }}>
              {t(lang, 'secretCodeDesc')}
            </p>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={config.secretCode}
                onChange={e => setConfig(prev => ({ ...prev, secretCode: e.target.value }))}
                onBlur={handleSaveConfig}
                placeholder={t(lang, 'enterSecretCodePlaceholder')}
                className="w-full px-3 py-2 pr-9 text-xs rounded-lg border outline-none transition-all"
                style={{
                  backgroundColor: inputBg,
                  borderColor: borderColor,
                  color: textColor,
                }}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: textColor }}
              >
                {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Section 2: GitHub Personal Access Token */}
          <div
            className="p-3.5 sm:p-4 rounded-xl border transition-all"
            style={{
              backgroundColor: cardBg,
              borderColor: borderFaint,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Key size={14} style={{ color: accentColor }} />
                <label className="text-[11px] font-bold tracking-wider uppercase opacity-90">{t(lang, 'githubToken')}</label>
              </div>
              <a
                href="https://github.com/settings/tokens/new?scopes=gist&description=KgvWritingAppCloudSave"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-semibold opacity-80 hover:opacity-100 flex items-center gap-0.5 underline"
                style={{ color: accentColor }}
              >
                Token <ExternalLink size={10} />
              </a>
            </div>
            <p className="text-[11px] mb-2.5 leading-snug" style={{ color: textFaint }}>
              {t(lang, 'githubTokenDesc')}
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.githubToken}
                  onChange={e => setConfig(prev => ({ ...prev, githubToken: e.target.value }))}
                  onBlur={handleSaveConfig}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 pr-9 text-xs rounded-lg border outline-none transition-all font-mono"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: borderColor,
                    color: textColor,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: textColor }}
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleTestToken}
                disabled={loading && actionType === 'test'}
                className="px-3 py-2 text-xs font-medium rounded-lg text-white transition-all cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50 active:scale-95 shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                {loading && actionType === 'test' ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                {t(lang, 'testConnection')}
              </button>
            </div>

            {githubUser && (
              <div className="mt-2 text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                <CheckCircle2 size={12} /> {t(lang, 'authenticatedAs')} <span className="font-bold">@{githubUser}</span>
              </div>
            )}
          </div>

          {/* Section 3: Gist Sync Details & Actions */}
          <div
            className="p-3.5 sm:p-4 rounded-xl border transition-all"
            style={{
              backgroundColor: cardBg,
              borderColor: borderFaint,
            }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold tracking-wider uppercase opacity-90">{t(lang, 'gistIdLabel')}</label>
              {config.gistId && (
                <a
                  href={`https://gist.github.com/${config.gistId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] opacity-70 hover:opacity-100 flex items-center gap-1"
                  style={{ color: textColor }}
                >
                  {t(lang, 'viewGist')} <ExternalLink size={9} />
                </a>
              )}
            </div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={config.gistId || ''}
                onChange={e => setConfig(prev => ({ ...prev, gistId: e.target.value }))}
                onBlur={handleSaveConfig}
                placeholder={t(lang, 'gistIdPlaceholder')}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border outline-none font-mono transition-all"
                style={{
                  backgroundColor: inputBg,
                  borderColor: borderColor,
                  color: textColor,
                }}
              />
              {config.gistId && (
                <button
                  type="button"
                  onClick={copyGistIdToClipboard}
                  className="px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1 transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/10"
                  style={{ borderColor: borderColor, color: textColor }}
                  title={t(lang, 'copyGistId')}
                >
                  {copiedGistId ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={handlePush}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg text-white font-medium text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {loading && actionType === 'push' ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <UploadCloud size={15} />
                )}
                <span>{t(lang, 'backupData')}</span>
              </button>

              <button
                type="button"
                onClick={handlePull}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg border font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/10"
                style={{
                  borderColor: borderColor,
                  color: textColor,
                }}
              >
                {loading && actionType === 'pull' ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <DownloadCloud size={15} />
                )}
                <span>{t(lang, 'restoreData')}</span>
              </button>
            </div>
          </div>

          {/* Footer details */}
          {config.lastSyncedAt && (
            <div className="text-[10px] text-center flex items-center justify-center gap-1 pt-0.5 opacity-60" style={{ color: textMuted }}>
              <Cloud size={11} style={{ color: accentColor }} />
              {t(lang, 'lastSynced')} {new Date(config.lastSyncedAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

