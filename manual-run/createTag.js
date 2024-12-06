const axios = require('axios');
require('dotenv').config();

// Configuration
const config = {
    orgName: 'personal-for-testing',
    repos: ['git-tag', 'repo1', 'repo2'],
    tagName: 'v6',
    branch: 'main', 
    githubToken: process.env.GITHUB_TOKEN
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

async function getBranchReference(repo) {
    try {
        const response = await githubApi.get(`/repos/${config.orgName}/${repo}/git/refs/heads/${config.branch}`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error(`Branch ${config.branch} not found in ${repo}`);
        }
        throw error;
    }
}

async function getLatestTag(repo) {
    try {
        const response = await githubApi.get(`/repos/${config.orgName}/${repo}/tags`);
        return response.data[0]?.name; // Returns undefined if no tags exist
    } catch (error) {
        console.log(`No previous tags found in ${repo}`);
        return null;
    }
}

async function generateReleaseNotes(repo, fromTag, toSha) {
    try {
        let compareUrl;
        if (fromTag) {
            // If we have a previous tag, compare it with the new changes
            compareUrl = `/repos/${config.orgName}/${repo}/compare/${fromTag}...${toSha}`;
        } else {
            // If this is the first tag, get all commits up to this point
            compareUrl = `/repos/${config.orgName}/${repo}/commits?sha=${toSha}`;
        }

        const response = await githubApi.get(compareUrl);
        const commits = fromTag ? response.data.commits : response.data;

        // Generate release notes
        let releaseNotes = `# What's Changed\n\n`;

        const commitsByType = {
            feat: [],
            fix: [],
            docs: [],
            style: [],
            refactor: [],
            test: [],
            chore: [],
            other: []
        };

        // Categorize commits based on conventional commit messages
        commits.forEach(commit => {
            const message = commit.commit.message.split('\n')[0];
            const author = commit.commit.author.name;
            
            // Parse conventional commit format
            const conventionalCommitRegex = /^(feat|fix|docs|style|refactor|test|chore)(?:\(([^\)]+)\))?: (.+)$/;
            const match = message.match(conventionalCommitRegex);

            if (match) {
                const [, type, scope, description] = match;
                const formattedMessage = scope ? 
                    `- ${description} (${scope}) by @${author}` :
                    `- ${description} by @${author}`;
                commitsByType[type].push(formattedMessage);
            } else {
                commitsByType.other.push(`- ${message} by @${author}`);
            }
        });

        // Build release notes with sections
        const sections = [
            { type: 'feat', title: '### New Features' },
            { type: 'fix', title: '### Bug Fixes' },
            { type: 'docs', title: '### Documentation' },
            { type: 'style', title: '### Styling' },
            { type: 'refactor', title: '### Code Refactoring' },
            { type: 'test', title: '### Testing' },
            { type: 'chore', title: '### Maintenance' },
            { type: 'other', title: '### Other Changes' }
        ];

        sections.forEach(({ type, title }) => {
            if (commitsByType[type].length > 0) {
                releaseNotes += `\n${title}\n${commitsByType[type].join('\n')}\n`;
            }
        });

        return releaseNotes;
    } catch (error) {
        console.error(`Error generating release notes for ${repo}:`, error.message);
        return `Release ${config.tagName}`;
    }
}

async function checkIfTagExists(repo) {
    try {
        await githubApi.get(`/repos/${config.orgName}/${repo}/git/refs/tags/${config.tagName}`);
        return true;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return false;
        }
        throw error;
    }
}

async function createRelease(repo, tagSha) {
    try {
        // Get the previous tag to generate release notes
        const previousTag = await getLatestTag(repo);
        const releaseNotes = await generateReleaseNotes(repo, previousTag, tagSha);

        const releaseData = {
            tag_name: config.tagName,
            target_commitish: tagSha,
            name: config.tagName,
            body: releaseNotes,
            draft: false,
            prerelease: false
        };

        const response = await githubApi.post(
            `/repos/${config.orgName}/${repo}/releases`,
            releaseData
        );

        console.log(`Successfully created release ${config.tagName} in ${repo}`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response ? 
            `Status: ${error.response.status}, ${error.response.data.message}` : 
            error.message;
        console.error(`Error creating release in ${repo}:`, errorMessage);
        throw error;
    }
}

async function createTag(repo) {
    try {
        // Check if tag already exists
        const tagExists = await checkIfTagExists(repo);
        if (tagExists) {
            console.log(`Tag ${config.tagName} already exists in ${repo}. Skipping...`);
            return;
        }

        // Get the SHA of the branch
        const branchRef = await getBranchReference(repo);
        const branchSha = branchRef.object.sha;

        // Create tag reference
        await githubApi.post(`/repos/${config.orgName}/${repo}/git/refs`, {
            ref: `refs/tags/${config.tagName}`,
            sha: branchSha
        });

        console.log(`Successfully created tag ${config.tagName} in ${repo} at branch ${config.branch}`);
        await createRelease(repo, branchSha);
    } catch (error) {
        const errorMessage = error.response ? 
            `Status: ${error.response.status}, ${error.response.data.message}` : 
            error.message;
        console.error(`Error creating tag and release in ${repo}:`, errorMessage);
        throw error;
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

async function main() {
    try {
        console.log('Starting tag and release creation process...');
        console.log(`Organization: ${config.orgName}`);
        console.log(`Tag/Release to create: ${config.tagName}`);
        console.log(`Target branch: ${config.branch}`);
        console.log(`Repositories: ${config.repos.join(', ')}`);
        console.log('----------------------------------------');

        // Validate access before proceeding
        await validateAccess();

        // Process each repository
        for (const repo of config.repos) {
            console.log(`\nProcessing repository: ${repo}`);
            try {
                // Validate repository exists
                await validateRepository(repo);
                // Create tag and release
                await createTag(repo);
            } catch (error) {
                console.error(`Failed to process ${repo}:`, error.message);
                console.log('Continuing with next repository...');
            }
            console.log('----------------------------------------');
        }

        console.log('\nTag and release creation process completed!');
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