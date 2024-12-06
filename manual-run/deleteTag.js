const axios = require('axios');
require('dotenv').config();
// Configuration
const config = {
    orgName: 'personal-for-testing',
    repos: ['git-tag', 'repo1', 'repo2'],
    tagName: 'v.2',
    githubToken:  process.env.GITHUB_TOKEN
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

async function getTagReference(repo) {
    try {
        const response = await githubApi.get(`/repos/${config.orgName}/${repo}/git/refs/tags/${config.tagName}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log(`❌ Tag ${config.tagName} not found in ${repo}`);
            return null;
        }
        throw error;
    }
}

async function deleteTag(repo) {
    try {
        // First, try to get the tag reference
        const tagRef = await getTagReference(repo);
        
        if (!tagRef) {
            return;
        }

        // Delete the tag
        await githubApi.delete(`/repos/${config.orgName}/${repo}/git/refs/tags/${config.tagName}`);
        console.log(` ✅ Successfully deleted tag ${config.tagName} from ${repo}`);
    } catch (error) {
        const errorMessage = error.response ? 
            `Status: ${error.response.status}, ${error.response.data.message}` : 
            error.message;
        console.error(`❌  Error deleting tag from ${repo}:`, errorMessage);
    }
}

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

async function main() {
    try {
        console.log('Starting tag deletion process...');
        console.log(`Organization: ${config.orgName}`);
        console.log(`Tag to delete: ${config.tagName}`);
        console.log(`Repositories: ${config.repos.join(', ')}`);
        console.log('----------------------------------------');

        // Validate access before proceeding
        await validateAccess();

        // Process each repository
        for (const repo of config.repos) {
            console.log(`Processing repository: ${repo}`);
            await deleteTag(repo);
            console.log('----------------------------------------');
        }

        console.log('Tag deletion process completed!');
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