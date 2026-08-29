import { getAllProjectsFromDB, getAllFoldersFromDB, saveProjectToDB, saveFolderToDB } from './db';
import type { Project, Folder } from './types';

export interface GithubCloudConfig {
  githubToken: string;
  secretCode: string;
  gistId?: string;
  autoSave?: boolean;
  lastSyncedAt?: string;
  targetRepo?: string; // Optional e.g. "owner/repo"
  targetPath?: string; // Optional e.g. "backups/app_data.json"
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  projects: Project[];
  folders: Folder[];
}

// -------------------------------------------------------------
// Web Crypto AES-256-GCM Encryption / Decryption with Secret Code
// -------------------------------------------------------------

async function deriveKey(secretCode: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secretCode),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buf: Uint8Array): string {
  let binary = '';
  const len = buf.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encryptData(plainText: string, secretCode: string): Promise<string> {
  if (!secretCode || secretCode.trim() === '') {
    // If no secret code, return plain JSON with wrapper
    return JSON.stringify({
      encrypted: false,
      v: 1,
      data: plainText,
      updatedAt: new Date().toISOString(),
    }, null, 2);
  }

  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secretCode, salt);
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plainText)
  );

  const payload = {
    encrypted: true,
    v: 1,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    data: bufferToBase64(new Uint8Array(encrypted) as unknown as BufferSource),
    updatedAt: new Date().toISOString(),
  };

  return JSON.stringify(payload, null, 2);
}

export async function decryptData(encryptedJsonStr: string, secretCode: string): Promise<string> {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(encryptedJsonStr);
  } catch {
    throw new Error('Invalid JSON content received from GitHub.');
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload structure.');
  }

  // Handle unencrypted payload fallback
  if (payload.encrypted === false && typeof payload.data === 'string') {
    return payload.data;
  }

  if (!payload.encrypted || typeof payload.salt !== 'string' || typeof payload.iv !== 'string' || typeof payload.data !== 'string') {
    // Direct raw JSON fallback
    if (payload.projects && Array.isArray(payload.projects)) {
      return encryptedJsonStr;
    }
    throw new Error('The data on GitHub does not appear to be a valid backup or encrypted string.');
  }

  if (!secretCode || secretCode.trim() === '') {
    throw new Error('Secret Code is required to decrypt this private cloud save.');
  }

  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const data = base64ToBuffer(payload.data);

  const key = await deriveKey(secretCode, salt);
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch {
    throw new Error('Incorrect Secret Code! Unable to decrypt the private cloud backup.');
  }
}

// -------------------------------------------------------------
// GitHub API Sync Routines (Gist & Repository)
// -------------------------------------------------------------

const STORAGE_KEY_CONFIG = 'kgv_github_cloud_config';

export function getStoredGithubConfig(): GithubCloudConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse GitHub cloud config:', err);
  }
  return { githubToken: '', secretCode: '' };
}

export function saveGithubConfig(config: GithubCloudConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

export async function testGithubToken(token: string): Promise<{ username: string; name?: string }> {
  if (!token) throw new Error('GitHub Personal Access Token is missing.');
  
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Invalid GitHub token. Please check your Personal Access Token permissions.');
      }
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return { username: data.login, name: data.name };
  } catch (err: unknown) {
    if (err instanceof Error && (err.message.includes('Invalid GitHub token') || err.message.includes('GitHub API error'))) {
      throw err;
    }
    throw new Error('Lỗi kết nối mạng (Network Error). Không thể kết nối tới GitHub. Vui lòng kiểm tra kết nối internet.');
  }
}

export async function pushToGithubCloud(config: GithubCloudConfig): Promise<{ gistId: string; updatedAt: string }> {
  if (!config.githubToken) {
    throw new Error('GitHub Personal Access Token is required.');
  }

  // 1. Fetch local data from Dexie
  const projects = await getAllProjectsFromDB();
  const folders = await getAllFoldersFromDB();

  const backupData: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects,
    folders,
  };

  const plainJsonStr = JSON.stringify(backupData, null, 2);
  const finalContent = await encryptData(plainJsonStr, config.secretCode);

  const filename = 'kgv_writing_app_backup.json';
  const headers = {
    Authorization: `Bearer ${config.githubToken.trim()}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  let gistId = config.gistId?.trim();

  try {
    if (gistId) {
      // Update existing Gist
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          description: 'Encrypted Cloud Save - Kgv Writing App',
          files: {
            [filename]: {
              content: finalContent,
            },
          },
        }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          // Gist deleted or not found, clear Gist ID and create new
          gistId = '';
        } else {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || `Failed to update Gist (${res.status})`);
        }
      }
    }

    if (!gistId) {
      // Create new private Gist
      const res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          description: 'Encrypted Cloud Save - Kgv Writing App',
          public: false,
          files: {
            [filename]: {
              content: finalContent,
            },
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to create private Gist (${res.status})`);
      }

      const resData = await res.json();
      gistId = resData.id;
    }
  } catch (err: unknown) {
    if (err instanceof Error && !err.message.includes('fetch')) {
      throw err;
    }
    throw new Error('Lỗi kết nối mạng (Network Error). Không thể tải dữ liệu lên GitHub.');
  }

  const updatedAt = new Date().toISOString();
  saveGithubConfig({
    ...config,
    gistId,
    lastSyncedAt: updatedAt,
  });

  return { gistId: gistId!, updatedAt };
}

export async function pullFromGithubCloud(config: GithubCloudConfig): Promise<{ projectCount: number; folderCount: number }> {
  if (!config.githubToken) {
    throw new Error('GitHub Personal Access Token is required.');
  }
  if (!config.gistId) {
    throw new Error('No Gist ID found. Please save to cloud first or enter your existing Gist ID.');
  }

  const headers = {
    Authorization: `Bearer ${config.githubToken.trim()}`,
    Accept: 'application/vnd.github+json',
  };

  let gistData: Record<string, unknown> = {};
  try {
    const res = await fetch(`https://api.github.com/gists/${config.gistId.trim()}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Gist not found. Please verify the Gist ID.');
      }
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to fetch Gist (${res.status})`);
    }

    gistData = await res.json();
  } catch (err: unknown) {
    if (err instanceof Error && !err.message.includes('fetch')) {
      throw err;
    }
    throw new Error('Lỗi kết nối mạng (Network Error). Không thể tải dữ liệu từ GitHub.');
  }

  const files = (gistData.files as Record<string, { content?: string }>) || {};
  const backupFile = files['kgv_writing_app_backup.json'] || Object.values(files)[0];

  if (!backupFile || !backupFile.content) {
    throw new Error('No backup content found in the private Gist.');
  }

  // Decrypt content using Secret Code
  const decryptedJsonStr = await decryptData(backupFile.content, config.secretCode);
  const backupData: BackupPayload = JSON.parse(decryptedJsonStr);

  if (!backupData || !Array.isArray(backupData.projects)) {
    throw new Error('Invalid backup file format.');
  }

  // Restore into Dexie DB
  for (const project of backupData.projects) {
    await saveProjectToDB(project);
  }

  if (Array.isArray(backupData.folders)) {
    for (const folder of backupData.folders) {
      await saveFolderToDB(folder);
    }
  }

  saveGithubConfig({
    ...config,
    lastSyncedAt: new Date().toISOString(),
  });

  return {
    projectCount: backupData.projects.length,
    folderCount: backupData.folders?.length || 0,
  };
}
