import axios from 'axios';

// Configure and export an Axios instance for GitHub API
export const configureGithubApi = (token) => {
    return axios.create({
        baseURL: 'https://api.github.com',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        },
    });
};
