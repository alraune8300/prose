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
  const textFaint = theme?.textMuted || (isDark ? '#64748b' : '#94a3b8');
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
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-200">
      <div
        className="w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden relative p-6 sm:p-8"
        style={{
          fontFamily: uiFont,
          backgroundColor: modalBg,
          color: textColor,
          border: `1px solid ${borderColor}`
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100 transition-all cursor-pointer"
          style={{ color: textColor }}
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-xl sm:text-2xl font-normal tracking-wide uppercase" style={{ fontFamily: uiFont }}>Github Sync</h2>
          <Github size={24} strokeWidth={1.5} />
        </div>

        {/* Content Body */}
        <div className="space-y-6">
          {/* Status notification banner */}
          {statusMsg && (
            <div
              className={`p-3 flex items-start gap-2.5 text-sm transition-all rounded-xl ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{statusMsg.text}</div>
            </div>
          )}

          {/* Section 1: Secret Code */}
          <div>
            <label className="block text-xs sm:text-sm font-normal tracking-wider uppercase mb-2 opacity-90" style={{ fontFamily: uiFont }}>{t(lang, 'secretCode')}</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={config.secretCode}
                onChange={e => setConfig(prev => ({ ...prev, secretCode: e.target.value }))}
                onBlur={handleSaveConfig}
                className="w-full outline-none transition-all"
                style={{
                  backgroundColor: 'transparent',
                  color: textColor,
                  border: 'none',
                  borderBottom: `1px solid ${borderColor}`,
                  borderRadius: 0,
                  padding: '4px 0',
                  paddingRight: '24px',
                  fontFamily: (uiFont || 'inherit'),
                  fontSize: '0.9rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-0 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity z-10"
                style={{ color: textColor }}
              >
                {showSecret ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* Section 2: GitHub Personal Access Token */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <label className="text-xs sm:text-sm font-normal tracking-wider uppercase opacity-90" style={{ fontFamily: uiFont }}>{t(lang, 'githubToken')}</label>
              <a
                href="https://github.com/settings/tokens/new?scopes=gist&description=KgvWritingAppCloudSave"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold opacity-80 hover:opacity-100"
                style={{ color: textColor, fontFamily: uiFont }}
              >
                Token
              </a>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative w-full sm:flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.githubToken}
                  onChange={e => setConfig(prev => ({ ...prev, githubToken: e.target.value }))}
                  onBlur={handleSaveConfig}
                  className="w-full outline-none transition-all font-mono"
                  style={{
                    backgroundColor: 'transparent',
                    color: textColor,
                    border: 'none',
                    borderBottom: `1px solid ${borderColor}`,
                    borderRadius: 0,
                    padding: '4px 0',
                    paddingRight: '24px',
                    fontSize: '0.9rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity z-10"
                  style={{ color: textColor }}
                >
                  {showToken ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleTestToken}
                disabled={loading && actionType === 'test'}
                className="text-xs font-semibold uppercase cursor-pointer hover:opacity-70 transition-opacity disabled:opacity-50 tracking-wider flex items-center gap-1.5 whitespace-nowrap"
                style={{ color: textColor, fontFamily: uiFont }}
              >
                {loading && actionType === 'test' ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : null}
                {t(lang, 'testConnection')}
              </button>
            </div>
            {githubUser && (
              <div className="text-xs mt-2 opacity-80" style={{ color: textColor, fontFamily: uiFont }}>
                Authenticated as: {githubUser}
              </div>
            )}
          </div>

          {/* Section 3: Gist Sync Details & Actions */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <label className="text-xs sm:text-sm font-normal tracking-wider uppercase opacity-90" style={{ fontFamily: uiFont }}>{t(lang, 'gistIdLabel')}</label>
              {config.gistId && (
                <a
                  href={`https://gist.github.com/${config.gistId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold opacity-80 hover:opacity-100"
                  style={{ color: textColor, fontFamily: uiFont }}
                >
                  View Gist
                </a>
              )}
            </div>
            <div>
              <input
                type="text"
                value={config.gistId || ''}
                onChange={e => setConfig(prev => ({ ...prev, gistId: e.target.value }))}
                onBlur={handleSaveConfig}
                className="w-full outline-none font-mono transition-all"
                style={{
                  backgroundColor: 'transparent',
                  color: textColor,
                  border: 'none',
                  borderBottom: `1px solid ${borderColor}`,
                  borderRadius: 0,
                  padding: '4px 0',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-10 sm:gap-14 pt-6">
            <button
              type="button"
              onClick={handlePush}
              disabled={loading}
              className="text-sm sm:text-base font-normal uppercase cursor-pointer hover:opacity-70 transition-opacity disabled:opacity-50 flex items-center gap-2"
              style={{ color: textColor, fontFamily: uiFont }}
            >
              {loading && actionType === 'push' && <RefreshCw size={16} className="animate-spin" />}
              {t(lang, 'backupData')}
            </button>
            
            <button
              type="button"
              onClick={handlePull}
              disabled={loading}
              className="text-sm sm:text-base font-normal uppercase cursor-pointer hover:opacity-70 transition-opacity disabled:opacity-50 flex items-center gap-2"
              style={{ color: textColor, fontFamily: uiFont }}
            >
              {loading && actionType === 'pull' && <RefreshCw size={16} className="animate-spin" />}
              {t(lang, 'restoreData')}
            </button>
          </div>

          {/* Footer details */}
          {config.lastSyncedAt && (
            <div className="text-xs text-center pt-2 opacity-70" style={{ color: textColor, fontFamily: uiFont }}>
              {t(lang, 'lastSynced')} {new Date(config.lastSyncedAt).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


