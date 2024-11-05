const axios = require('axios');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
// Configuration
const config = {
    orgName: 'personal-for-testing',
    repos: ['git-tag', 'repo2', 'repo3'],
    localBranch: 'ow-development',
    upstreamBranch: 'ir-development',
    remoteName: 'upstream',
    githubToken: process.env.GITHUB_TOKEN,
    baseDir: path.join(process.cwd(), 'repos')
};

// Configure axios defaults for GitHub API
const githubApi = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        'Authorization': `token ${config.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    }
});

async function validateAccess() {
    try {
        const response = await githubApi.get(`/orgs/${config.orgName}`);
        console.log(`Successfully authenticated and found organization: ${config.orgName}`);
        return true;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error(`Organization '${config.orgName}' not found`);
        } else if (error.response && error.response.status === 401) {
            throw new Error('Invalid GitHub token or insufficient permissions');
        }
        throw error;
    }
}

async function validateRepository(repo) {
    try {
        await githubApi.get(`/repos/${config.orgName}/${repo}`);
        return true;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error(`Repository ${repo} not found in organization ${config.orgName}`);
        }
        throw error;
    }
}

async function validateBranch(repo, branchName) {
    try {
        await githubApi.get(`/repos/${config.orgName}/${repo}/branches/${branchName}`);
        return true;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error(`Branch ${branchName} not found in ${repo}`);
        }
        throw error;
    }
}

async function setupRepository(repo) {
    const repoPath = path.join(config.baseDir, repo);
    const repoUrl = `https://${config.githubToken}@github.com/${config.orgName}/${repo}.git`;
    const upstreamUrl = `https://${config.githubToken}@github.com/${config.orgName}/${repo}.git`;

    // Clean existing directory if it exists
    if (fs.existsSync(repoPath)) {
        fs.rmSync(repoPath, { recursive: true, force: true });
    }

    // Create repository directory
    fs.mkdirSync(repoPath, { recursive: true });

    // Clone and setup repository
    try {
        const git = simpleGit();
        await git.clone(repoUrl, repoPath);
        const repoGit = simpleGit(repoPath);
        
        // Setup upstream remote
        try {
            await repoGit.removeRemote(config.remoteName);
        } catch (error) {
            // Ignore error if remote doesn't exist
        }
        await repoGit.addRemote(config.remoteName, upstreamUrl);
        
        return repoGit;
    } catch (error) {
        throw new Error(`Failed to setup repository ${repo}: ${error.message}`);
    }
}

async function syncBranches(git, repo) {
    try {
        // Checkout local branch
        await git.checkout(config.localBranch);
        console.log(`Checked out ${config.localBranch}`);

        // Fetch from upstream
        await git.fetch(config.remoteName, config.localBranch);
        await git.fetch(config.remoteName, config.upstreamBranch);
        console.log('Fetched latest changes from upstream');

        // Reset to upstream branch
        await git.reset(['--hard', `${config.remoteName}/${config.localBranch}`]);
        console.log(`Reset to ${config.remoteName}/${config.localBranch}`);

        // Merge upstream branch
        await git.merge([`${config.remoteName}/${config.upstreamBranch}`]);
        console.log(`Merged ${config.remoteName}/${config.upstreamBranch}`);

        // Commit changes
        const commitMessage = `chore: update ${config.upstreamBranch} to ${config.localBranch}`;
        await git.commit(commitMessage, { '--allow-empty': true });
        console.log('Committed changes');

        // Push to origin
        await git.push('origin', config.localBranch);
        console.log(`Pushed to origin ${config.localBranch}`);

        return true;
    } catch (error) {
        throw new Error(`Sync failed: ${error.message}`);
    }
}

async function processSingleRepo(repo) {
    console.log(`\nProcessing repository: ${repo}`);
    console.log('----------------------------------------');

    try {
        // Validate repository exists
        await validateRepository(repo);
        
        // Validate branches exist
        await validateBranch(repo, config.localBranch);
        await validateBranch(repo, config.upstreamBranch);

        // Setup repository
        const git = await setupRepository(repo);

        // Sync branches
        await syncBranches(git, repo);

        console.log(`Successfully processed ${repo}`);
        return true;
    } catch (error) {
        console.error(`Error processing ${repo}:`, error.message);
        return false;
    }
}

async function main() {
    try {
        console.log('Starting branch sync process...');
        console.log(`Organization: ${config.orgName}`);
        console.log(`Local Branch: ${config.localBranch}`);
        console.log(`Upstream Branch: ${config.upstreamBranch}`);
        console.log(`Remote Name: ${config.remoteName}`);
        console.log(`Repositories: ${config.repos.join(', ')}`);
        console.log('----------------------------------------');

        // Validate access before proceeding
        await validateAccess();

        // Process each repository
        for (const repo of config.repos) {
            await processSingleRepo(repo);
            console.log('----------------------------------------');
        }

        console.log('\nBranch sync process completed!');
    } catch (error) {
        console.error('Script failed:', error.message);
        process.exit(1);
    }
}

// Add error handling for rate limiting and network issues
githubApi.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 403) {
            console.error('Rate limit exceeded. Please wait before trying again.');
        } else if (!error.response) {
            console.error('Network error occurred. Please check your internet connection.');
        }
        return Promise.reject(error);
    }
);

// Execute the script
main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});