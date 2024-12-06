import express from 'express';
import { createTagAndRelease, deleteReleasesHandler, deleteTagController, syncRepositories } from '../controllers/githubController.js';

const router = express.Router();

// Define the route for deleting tags


/**
 * @swagger
 * /delete-tag:
 *   post:
 *     summary: Deletes a tag from the specified repositories
 *     tags:
 *       - Git tags
 *     description: Deletes a Git tag from multiple repositories in the specified organization.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orgName:
 *                 type: string
 *                 description: GitHub organization name.
 *                 example: personal-for-testing
 *               repos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of repository names.
 *                 example: ["repo1", "repo2"]
 *               tagName:
 *                 type: string
 *                 description: Tag name to delete.
 *                 example: v.2
 *               githubToken:
 *                 type: string
 *                 description: GitHub personal access token.
 *                 example: ghp_example1234
 *     responses:
 *       200:
 *         description: Tag deletion process completed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tag deletion process completed successfully!
 *       400:
 *         description: Missing required fields in request body.
 *       500:
 *         description: Error during tag deletion.
 */
router.post('/delete-tag', deleteTagController);

/**
 * @swagger
 * /create-tag:
 *   post:
 *     summary: Create a GitHub tag and release
 *     tags:
 *       - Git tags
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orgName:
 *                 type: string
 *               repos:
 *                 type: array
 *                 items:
 *                   type: string
 *               tagName:
 *                 type: string
 *               branch:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tag and release creation successful.
 *       400:
 *         description: Missing required fields.
 *       500:
 *         description: Server error.
 */
router.post('/create-tag', createTagAndRelease);



/**
 * @swagger
 * /merge-conflict:
 *   post:
 *     summary: Synchronize repositories with upstream branches
 *     description: Validates repositories and synchronizes branches between local and upstream.
 *     tags:
 *       - Repositories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orgName:
 *                 type: string
 *                 description: GitHub organization name
 *               repos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of repositories to sync
 *               localBranch:
 *                 type: string
 *                 description: Name of the local branch
 *               upstreamBranch:
 *                 type: string
 *                 description: Name of the upstream branch
 *               remoteName:
 *                 type: string
 *                 description: Name of the remote 
 *                 default: upstream
 *               githubToken:
 *                 type: string
 *                 description: GitHub access token
 *               baseDir:
 *                 type: string
 *                 description: Base directory for cloning repositories
 *                 default: Current working directory
 *     responses:
 *       200:
 *         description: Sync process completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       repo:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       error:
 *                         type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/merge-conflict', syncRepositories);

/**
 * @swagger
 * /delete-releases:
 *   post:
 *     summary: Delete Multiple Releases with Filtering Options
 *     tags:
 *       - Releases
 *     description: >
 *       Delete releases from specified repositories with comprehensive filtering capabilities.
 *       Supports deleting all releases or applying advanced filters.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orgName
 *               - repos
 *               - githubToken
 *             properties:
 *               orgName:
 *                 type: string
 *                 description: GitHub organization name
 *                 example: my-organization
 *               repos:
 *                 type: array
 *                 description: List of repository names to delete releases from
 *                 items:
 *                   type: string
 *                 example: ["repo1", "repo2"]
 *               githubToken:
 *                 type: string
 *                 description: GitHub personal access token with appropriate permissions
 *                 example: ghp_1234abcd...
 *               filterOptions:
 *                 type: object
 *                 description: Optional filtering parameters for release deletion
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: ['all', 'filter']
 *                     default: 'all'
 *                     description: >
 *                       Deletion type:
 *                       - 'all': Delete all releases
 *                       - 'filter': Apply specific filters
 *                   olderThan:
 *                     type: string
 *                     format: date
 *                     description: Delete releases created before this date
 *                     example: "2023-01-01"
 *                   nameContains:
 *                     type: string
 *                     description: Delete releases whose name or tag contains this string
 *                     example: "beta"
 *     responses:
 *       '200':
 *         description: Successful release deletion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Release deletion process completed"
 *                 deletedReleases:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       repo:
 *                         type: string
 *                       releaseId:
 *                         type: integer
 *                       releaseName:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       repo:
 *                         type: string
 *                       error:
 *                         type: string
 *                 totalReleasesDeleted:
 *                   type: integer
 *       '500':
 *         description: Server error during release deletion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to delete releases"
 *                 error:
 *                   type: string
 */
router.post('/delete-releases', deleteReleasesHandler);


export default router;
