import express from 'express';
import { createTagAndRelease, deleteTagController, syncRepositories } from '../controllers/githubController.js';

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


export default router;
