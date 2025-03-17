/**
 * GitHub Storage Utility
 * 
 * This module provides functions to interact with GitHub as a database
 * for storing application data in JSON files.
 * 
 * FIELD NAMING CONVENTION:
 * - Application code uses camelCase (TypeScript standard)
 * - Storage/JSON uses snake_case (JSON convention)
 * - Conversion happens in this module (the API layer)
 */

// Load environment variables from .env and .env.local files
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

// Type definitions using camelCase (for application code)
export type GithubUser = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

// Type definitions for projects
export type GithubProject = {
  id: string;
  name: string;
  creatorId: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};

// Type definitions for avatars
export type GithubAvatar = {
  id: string;
  name: string;
  projectId: string;
  description?: string;
  thumbnailUrl?: string;
  modelFileUrl?: string;
  polygonCount?: number;
  format: string;
  materialCount?: number;
  isPublic: boolean;
  isDraft: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

export type GithubAvatarTag = {
  avatarId: string;
  tagId: string;
};

export type GithubDownload = {
  id: string;
  avatarId: string;
  userId?: string;
  downloadedAt: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
};

export type GithubTag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// Configuration
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'ToxSam';
const GITHUB_REPO = process.env.GITHUB_REPO_NAME || 'open-source-avatars';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Personal access token with repo scope
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

// File paths in the repository
const DATA_PATHS = {
  users: 'data/users.json',
  projects: 'data/projects.json',
  avatars: 'data/avatars.json',
  tags: 'data/tags.json',
  downloads: 'data/downloads.json',
  avatarTags: 'data/avatar-tags.json',
};

// GitHub API endpoints
const API_BASE = 'https://api.github.com';
const RAW_CONTENT_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

/**
 * Fetches data from a JSON file in the GitHub repository
 * @param path Path to the JSON file in the repository
 * @returns The parsed JSON data
 */
async function fetchData(path: string) {
  try {
    console.log(`Fetching from: ${RAW_CONTENT_BASE}/${path}?timestamp=${Date.now()}`);
    const response = await fetch(`${RAW_CONTENT_BASE}/${path}?timestamp=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // File doesn't exist yet, return empty array or object
        return (path.includes('users') || path.includes('projects') || 
               path.includes('avatars') || path.includes('tags') || 
               path.includes('downloads')) ? [] : {};
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from GitHub: ${path}`, error);
    throw error;
  }
}

/**
 * Updates a JSON file in the GitHub repository
 * @param path Path to the JSON file in the repository
 * @param data The data to write to the file
 * @param commitMessage Commit message for the update
 * @returns Success status
 */
async function updateData(
  path: string, 
  data: any, 
  commitMessage: string = `Update ${path}`
) {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token is not configured. Set GITHUB_TOKEN environment variable.');
  }

  try {
    // First, get the current file (if it exists) to get its SHA
    let fileSha: string | undefined;
    
    try {
      const fileResponse = await fetch(
        `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        fileSha = fileData.sha;
      }
    } catch (error) {
      // File might not exist yet, which is fine
      console.log(`File does not exist yet: ${path}`);
    }
    
    // Prepare the update content
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    
    // Create or update the file
    const updateResponse = await fetch(
      `${API_BASE}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content,
          sha: fileSha,
          branch: GITHUB_BRANCH,
        }),
      }
    );
    
    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      throw new Error(`GitHub API error: ${JSON.stringify(error)}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating data in GitHub: ${path}`, error);
    throw error;
  }
}

/**
 * Generic function to save any data to a specified path
 * @param path The path to save the data to
 * @param data The data to save
 * @param commitMessage Optional commit message
 * @returns Success status
 */
async function saveData(
  path: string,
  data: any,
  commitMessage: string = `Update ${path}`
) {
  return updateData(path, data, commitMessage);
}

// Utility functions for specific data types

// Users
async function getUsers() {
  const rawUsers = await fetchData(DATA_PATHS.users);
  
  // Convert snake_case to camelCase for compatibility and sanitize sensitive fields
  return rawUsers.map((user: any) => ({
    id: user.id,
    username: user.username,
    email: '[email protected]', // Always return a sanitized email
    passwordHash: '', // Return empty string instead of undefined
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }));
}

async function saveUsers(users: any[]) {
  // Convert camelCase to snake_case and sanitize sensitive fields
  const snakeCaseUsers = users.map((user: any) => ({
    id: user.id,
    username: user.username,
    email: '[email protected]', // Always sanitize email when saving
    role: user.role,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  }));
  return updateData(DATA_PATHS.users, snakeCaseUsers, 'Update users data');
}

// Projects
async function getProjects() {
  const rawProjects = await fetchData(DATA_PATHS.projects);
  
  // Convert snake_case to camelCase for compatibility
  return rawProjects.map((project: any) => ({
    id: project.id,
    name: project.name,
    creatorId: project.creator_id,
    description: project.description,
    isPublic: project.is_public,
    createdAt: project.created_at,
    updatedAt: project.updated_at
  }));
}

async function saveProjects(projects: any[]) {
  // Convert camelCase to snake_case
  const snakeCaseProjects = projects.map(project => ({
    id: project.id,
    name: project.name,
    creator_id: project.creatorId,
    description: project.description,
    is_public: project.isPublic,
    created_at: project.createdAt,
    updated_at: project.updatedAt
  }));
  return updateData(DATA_PATHS.projects, snakeCaseProjects, 'Update projects data');
}

// Avatars
async function getAvatars() {
  const rawAvatars = await fetchData(DATA_PATHS.avatars);
  
  // Convert snake_case to camelCase for compatibility
  return rawAvatars.map((avatar: any) => ({
    id: avatar.id,
    name: avatar.name,
    projectId: avatar.project_id,
    description: avatar.description,
    thumbnailUrl: avatar.thumbnail_url,
    modelFileUrl: avatar.model_file_url,
    polygonCount: avatar.polygon_count,
    format: avatar.format,
    materialCount: avatar.material_count,
    isPublic: avatar.is_public,
    isDraft: avatar.is_draft,
    createdAt: avatar.created_at,
    updatedAt: avatar.updated_at,
    metadata: avatar.metadata
  }));
}

async function saveAvatars(avatars: any[]) {
  // Convert camelCase to snake_case
  const snakeCaseAvatars = avatars.map(avatar => ({
    id: avatar.id,
    name: avatar.name,
    project_id: avatar.projectId,
    description: avatar.description,
    thumbnail_url: avatar.thumbnailUrl,
    model_file_url: avatar.modelFileUrl,
    polygon_count: avatar.polygonCount,
    format: avatar.format,
    material_count: avatar.materialCount,
    is_public: avatar.isPublic,
    is_draft: avatar.isDraft,
    created_at: avatar.createdAt,
    updated_at: avatar.updatedAt,
    metadata: avatar.metadata
  }));
  return updateData(DATA_PATHS.avatars, snakeCaseAvatars, 'Update avatars data');
}

// Tags
async function getTags() {
  const rawTags = await fetchData(DATA_PATHS.tags);
  
  // Convert snake_case to camelCase for compatibility
  return rawTags.map((tag: any) => ({
    id: tag.id,
    name: tag.name,
    createdAt: tag.created_at,
    updatedAt: tag.updated_at
  }));
}

async function saveTags(tags: any[]) {
  // Convert camelCase to snake_case
  const snakeCaseTags = tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    created_at: tag.createdAt,
    updated_at: tag.updatedAt
  }));
  return updateData(DATA_PATHS.tags, snakeCaseTags, 'Update tags data');
}

// Downloads
async function getDownloads() {
  const rawDownloads = await fetchData(DATA_PATHS.downloads);
  
  // Convert snake_case to camelCase for compatibility
  return rawDownloads.map((download: any) => ({
    id: download.id,
    avatarId: download.avatar_id,
    userId: download.user_id,
    downloadedAt: download.downloaded_at,
    ipAddress: download.ip_address,
    userAgent: download.user_agent,
    createdAt: download.created_at,
    updatedAt: download.updated_at
  }));
}

async function saveDownloads(downloads: any[]) {
  // Convert camelCase to snake_case
  const snakeCaseDownloads = downloads.map(download => ({
    id: download.id,
    avatar_id: download.avatarId,
    user_id: download.userId,
    downloaded_at: download.downloadedAt,
    ip_address: download.ipAddress,
    user_agent: download.userAgent,
    created_at: download.createdAt,
    updated_at: download.updatedAt
  }));
  return updateData(DATA_PATHS.downloads, snakeCaseDownloads, 'Update downloads data');
}

// Avatar Tags
async function getAvatarTags() {
  const rawAvatarTags = await fetchData(DATA_PATHS.avatarTags);
  
  // Convert snake_case to camelCase for compatibility
  return rawAvatarTags.map((avatarTag: any) => ({
    avatarId: avatarTag.avatar_id,
    tagId: avatarTag.tag_id
  }));
}

async function saveAvatarTags(avatarTags: any[]) {
  // Convert camelCase to snake_case
  const snakeCaseAvatarTags = avatarTags.map(avatarTag => ({
    avatar_id: avatarTag.avatarId,
    tag_id: avatarTag.tagId
  }));
  return updateData(DATA_PATHS.avatarTags, snakeCaseAvatarTags, 'Update avatar tags data');
}

// Advanced query functions

/**
 * Finds an item by ID in an array of objects
 * @param items Array of items to search
 * @param id ID to find
 * @returns The found item or undefined
 */
function findById(items: any[], id: string) {
  return items.find((item: any) => item.id === id);
}

// Function to save download counts (privacy-friendly approach)
async function saveDownloadCounts(downloadCounts: any): Promise<void> {
  await saveData('download-counts.json', downloadCounts);
  console.log('Download counts saved successfully');
}

async function getDownloadCounts(): Promise<any> {
  try {
    const data = await fetchData('download-counts.json');
    return data || { counts: {} };
  } catch (error) {
    console.error('Error fetching download counts:', error);
    return { counts: {} };
  }
}

// Explicitly export all functions at the end
export {
  fetchData,
  saveData,
  updateData,
  getUsers,
  saveUsers,
  getProjects,
  saveProjects,
  getAvatars,
  saveAvatars,
  getTags,
  saveTags,
  getDownloads,
  saveDownloads,
  getAvatarTags,
  saveAvatarTags,
  findById,
  saveDownloadCounts,
  getDownloadCounts
}; 