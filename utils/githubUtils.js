import { configureGithubApi } from '../utils/githubApi.js';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import simpleGit from 'simple-git';


// Initialize GitHub API client
export const initializeGithubClient = (githubToken) => {
    return configureGithubApi(githubToken);
};

// Check if a tag exists in a repository
export const checkTagExists = async (githubApi, orgName, repo, tagName) => {
    try {
        await githubApi.get(`/repos/${orgName}/${repo}/git/refs/tags/${tagName}`);
        return true;
    } catch (error) {
        if (error.response?.status === 404) return false;
        throw error;
    }
};

// Get branch SHA
export const getBranchSha = async (githubApi, orgName, repo, branch) => {
    const branchRef = await githubApi.get(`/repos/${orgName}/${repo}/git/refs/heads/${branch}`);
    return branchRef.data.object.sha;
};

// Generate release notes
export const generateReleaseNotes = async (githubApi, orgName, repo, fromTag, toSha) => {
    try {
        const compareUrl = fromTag
            ? `/repos/${orgName}/${repo}/compare/${fromTag}...${toSha}`
            : `/repos/${orgName}/${repo}/commits?sha=${toSha}`;

        const response = await githubApi.get(compareUrl);
        const commits = fromTag ? response.data.commits : response.data;

        let releaseNotes = `# What's Changed\n\n`;
        const sections = { feat: [], fix: [], other: [] };

        commits.forEach((commit) => {
            const message = commit.commit.message.split('\n')[0];
            if (message.startsWith('feat:')) sections.feat.push(`- ${message}`);
            else if (message.startsWith('fix:')) sections.fix.push(`- ${message}`);
            else sections.other.push(`- ${message}`);
        });

        for (const [type, notes] of Object.entries(sections)) {
            if (notes.length) {
                releaseNotes += `\n### ${type.charAt(0).toUpperCase() + type.slice(1)}\n${notes.join('\n')}\n`;
            }
        }

        return releaseNotes;
    } catch (error) {
        console.error('Error generating release notes:', error.message);
        return `Release notes for ${toSha}`;
    }
};

// Delete a tag from a repository
export const deleteTagFromRepo = async (githubApi, orgName, repo, tagName) => {
    try {
        const response = await githubApi.get(`/repos/${orgName}/${repo}/git/refs/tags/${tagName}`);
        await githubApi.delete(`/repos/${orgName}/${repo}/git/refs/tags/${tagName}`);
        console.log(`✅ Successfully deleted tag ${tagName} from ${repo}`);
    } catch (error) {
        if (error.response?.status === 404) {
            console.log(`❌ Tag ${tagName} not found in ${repo}`);
        } else {
            throw error;
        }
    }
};

// Validates if the organization exists and the GitHub token has appropriate access.

export const validateAccess = async (orgName, githubToken) => {
    const githubApi = axios.create({
        baseURL: 'https://api.github.com',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
        },
    });

    try {
        await githubApi.get(`/orgs/${orgName}`);
    } catch (error) {
        if (error.response?.status === 404) throw new Error(`Organization '${orgName}' not found`);
        if (error.response?.status === 401) throw new Error('Invalid GitHub token or insufficient permissions');
        throw error;
    }
};

// Validates if the repository exists within the organization.
 
export const validateRepository = async (orgName, repo, githubToken) => {
    const githubApi = axios.create({
        baseURL: 'https://api.github.com',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
        },
    });

    try {
        await githubApi.get(`/repos/${orgName}/${repo}`);
    } catch (error) {
        if (error.response?.status === 404) throw new Error(`Repository ${repo} not found in organization ${orgName}`);
        throw error;
    }
};

// Validates if the branch exists in the repository.
export const validateBranch = async (orgName, repo, branchName, githubToken) => {
    const githubApi = axios.create({
        baseURL: 'https://api.github.com',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
        },
    });

    try {
        await githubApi.get(`/repos/${orgName}/${repo}/branches/${branchName}`);
    } catch (error) {
        if (error.response?.status === 404) throw new Error(`Branch ${branchName} not found in ${repo}`);
        throw error;
    }
};

// Sets up the local repository by cloning and configuring remotes.
export const setupRepository = async (orgName, repo, githubToken, remoteName, baseDir) => {
    const repoPath = path.join(baseDir, repo);
    const repoUrl = `https://${githubToken}@github.com/${orgName}/${repo}.git`;
    const upstreamUrl = `https://${githubToken}@github.com/${orgName}/${repo}.git`;

    // Cleanup existing directory
    if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
    }
    fs.mkdirSync(repoPath, { recursive: true });

    try {
        const git = simpleGit();
        await git.clone(repoUrl, repoPath);
        const repoGit = simpleGit(repoPath);

        // Configure remotes
        try {
            await repoGit.removeRemote(remoteName);
        } catch {
            // Ignore if remote doesn't exist
        }
        await repoGit.addRemote(remoteName, upstreamUrl);

        return repoGit;
    } catch (error) {
        throw new Error(`Failed to setup repository ${repo}: ${error.message}`);
    }
};

// Synchronizes branches between local and upstream.
export const syncBranches = async (git, repo, localBranch, upstreamBranch, remoteName) => {
    try {
        await git.checkout(localBranch);
        await git.fetch(remoteName, localBranch);
        await git.fetch(remoteName, upstreamBranch);
        await git.reset(['--hard', `${remoteName}/${localBranch}`]);
        await git.merge([`${remoteName}/${upstreamBranch}`]);
        await git.commit(`chore: update ${upstreamBranch} to ${localBranch}`, { '--allow-empty': true });
        await git.push('origin', localBranch);
    } catch (error) {
        throw new Error(`Sync failed for ${repo}: ${error.message}`);
    }
};