
import {
    checkTagExists,
    deleteReleases,
    deleteTagFromRepo,
    generateReleaseNotes,
    getBranchSha,
    initializeGithubClient,
    setupRepository,
    syncBranches,
    validateAccess,
    validateBranch,
    validateRepository
} from "../utils/githubUtils.js";


export const deleteTagController = async (req, res) => {
    const { orgName, repos, tagName, githubToken } = req.body;

    if (!orgName || !repos || !tagName || !githubToken) {
        return res.status(400).json({ message: 'Missing required fields in request body' });
    }

    const githubApi = initializeGithubClient(githubToken);

    try {
        console.log('Starting tag deletion process...');
        await Promise.all(repos.map((repo) => deleteTagFromRepo(githubApi, orgName, repo, tagName)));
        console.log('Tag deletion process completed!');
        res.json({ message: 'Tag deletion process completed successfully!' });
    } catch (error) {
        console.error('Error during tag deletion:', error.message);
        res.status(500).json({ message: `Error during tag deletion: ${error.message}` });
    }
};

export const createTagAndRelease = async (req, res) => {
    const { orgName, repos, tagName, branch, githubToken } = req.body;

    if (!orgName || !repos || !tagName || !branch || !githubToken) {
        return res.status(400).json({ message: 'Missing required fields in request body' });
    }

    const githubApi = initializeGithubClient(githubToken);

    try {
        for (const repo of repos) {
            console.log(`Processing repository: ${repo}`);

            // Validate repository
            await githubApi.get(`/repos/${orgName}/${repo}`);

            // Get branch SHA
            const branchSha = await getBranchSha(githubApi, orgName, repo, branch);

            // Check if tag exists
            const tagExists = await checkTagExists(githubApi, orgName, repo, tagName);
            if (tagExists) {
                console.log(`Tag ${tagName} already exists in ${repo}. Skipping...`);
                return res.status(400).json({ message: `Tag ${tagName} already exists in ${repo}. Skipping...` });
            }

            // Create tag
            await githubApi.post(`/repos/${orgName}/${repo}/git/refs`, {
                ref: `refs/tags/${tagName}`,
                sha: branchSha,
            });
            console.log(`Tag ${tagName} created in ${repo}.`);

            // Determine the previous tag
            let previousTag;
            const tags = (await githubApi.get(`/repos/${orgName}/${repo}/tags`)).data;

            if (tags.length > 0) {
                // Get the most recent tag excluding the current one
                previousTag = tags.find(tag => tag.name !== tagName)?.name;
                console.log(`Previous tag found: ${previousTag}`);
            }

            // Generate release notes using GitHub API
            const generateNotesPayload = {
                tag_name: tagName,
                target_commitish: branch,
            };

            // Include previous_tag_name only if it exists
            if (previousTag) {
                generateNotesPayload.previous_tag_name = previousTag;
            }

            const releaseNotesResponse = await githubApi.post(
                `/repos/${orgName}/${repo}/releases/generate-notes`,
                generateNotesPayload
            );

            const releaseNotes = releaseNotesResponse.data.body;
            console.log("Release notes ::", releaseNotes);

            // Create release
            await githubApi.post(`/repos/${orgName}/${repo}/releases`, {
                tag_name: tagName,
                target_commitish: branchSha,
                name: tagName,
                body: releaseNotes,
                draft: false,
                prerelease: false,
            });

            console.log(`Release created for ${tagName} in ${repo}.`);
        }

        res.status(200).json({ message: 'Tag and release creation process completed!' });
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ message: error.message });
    }
};



export const syncRepositories = async (req, res) => {
    const {
        orgName,
        repos,
        localBranch,
        upstreamBranch,
        remoteName = 'upstream',
        githubToken,
        baseDir = process.cwd(),
    } = req.body;

    try {
        // Validate organization access
        await validateAccess(orgName, githubToken);

        const results = await Promise.all(
            repos.map(async (repo) => {
                try {
                    // Validate repository and branches
                    await validateRepository(orgName, repo, githubToken);
                    await validateBranch(orgName, repo, localBranch, githubToken);
                    await validateBranch(orgName, repo, upstreamBranch, githubToken);

                    // Setup and sync repository
                    const git = await setupRepository(orgName, repo, githubToken, remoteName, baseDir);
                    await syncBranches(git, repo, localBranch, upstreamBranch, remoteName);

                    return { repo, success: true };
                } catch (error) {
                    return { repo, success: false, error: error.message };
                }
            })
        );

        res.json({ message: 'Repository sync completed', results });
    } catch (error) {
        res.status(500).json({ message: `Error: ${error.message}` });
    }
};

export const deleteReleasesHandler =   async (req, res) => {
    const { orgName, repos, githubToken, releaseName } = req.body;

    if (!orgName || !repos || !githubToken) {
        return res.status(400).json({ error: 'orgName, repos, and githubToken are required.' });
    }


    try {
        const results = await Promise.all(
            repos.map((repo) => deleteReleases(githubToken, orgName, repo, releaseName))
        );

        res.status(200).json({
            message: 'Releases processed successfully.',
            results,
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
        });
    }
}
