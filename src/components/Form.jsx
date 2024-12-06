import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react'; // Import Lucide icons
import { ToastContainer, toast } from 'react-toastify'; // Toast notifications
import 'react-toastify/dist/ReactToastify.css';

const defaultData = {
  orgName: '',
  repos: [''],
  releaseId: '',
  githubToken: '',
  releaseName: '',
};

const Form = () => {
  const [activeTab, setActiveTab] = useState('mergeConflict');
  const [mergeConflictData, setMergeConflictData] = useState({ ...defaultData });
  const [createTagData, setCreateTagData] = useState({ ...defaultData });
  const [deleteTagData, setDeleteTagData] = useState({ ...defaultData });
  const [deleteReleaseData, setDeleteReleaseData] = useState({ ...defaultData }); // New state
  const [isTokenVisible, setIsTokenVisible] = useState(false); // State for token visibility
  const [isLoading, setIsLoading] = useState(false); // State for loader

  // Load data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadData = (key, setter) => {
        try {
          const storedData = localStorage.getItem(key);
          if (storedData) setter(JSON.parse(storedData));
        } catch (error) {
          console.error(`Invalid data in '${key}':`, error);
        }
      };

      loadData('setMergeConflict', setMergeConflictData);
      loadData('setCreateTag', setCreateTagData);
      loadData('setDeleteTag', setDeleteTagData);
      loadData('setDeleteRelease', setDeleteReleaseData); // Load new data
    }
  }, []);

  // Generic handler for dynamic repo input
  const handleRepoChange = (tab, value) => {
    const updatedRepos = value.split(',').map(repo => repo.trim());
    if (tab === 'mergeConflict') setMergeConflictData(prev => ({ ...prev, repos: updatedRepos }));
    else if (tab === 'createTag') setCreateTagData(prev => ({ ...prev, repos: updatedRepos }));
    else if (tab === 'deleteTag') setDeleteTagData(prev => ({ ...prev, repos: updatedRepos }));
    else if (tab === 'deleteRelease') setDeleteReleaseData(prev => ({ ...prev, repos: updatedRepos }));
  };

  // Save data to localStorage
  const saveData = (key, data) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
      toast.success('Data saved successfully!');
    }
  };

  // Handlers for API calls
  const handleApiCall = async (endpoint, data) => {
    setIsLoading(true); // Start loading
    try {
      const response = await axios.post(endpoint, data);
      toast.success(response.data.message || 'API call successful!');
      console.log(`${endpoint} Response:`, response.data);
    } catch (error) {
      toast.error(`API call failed. ${error.response?.data?.message || error.message}`);
      console.error(`Error in ${endpoint}:`, error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // Common input rendering function
  const renderInput = (label, value, onChange, placeholder = '', type = 'text') => (
    <div>
      <label className="block mb-2 text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-2 py-1 border rounded"
      />
    </div>
  );

  // Render repositories textarea
  const renderRepoInput = (tab, repos) => (
    <div>
      <label className="block mb-2 text-sm font-medium">
        Repositories (comma-separated, e.g., "repo1, repo2, repo3")
      </label>
      <textarea
        value={repos.join(', ')}
        onChange={(e) => handleRepoChange(tab, e.target.value)}
        placeholder="Enter repositories, separated by commas"
        className="w-full px-2 py-1 border rounded"
        rows="2"
      />
    </div>
  );

  // Render tab content dynamically
  const renderTabContent = () => {
    const tabData = {
      mergeConflict: {
        title: 'Upstream Branch Update',
        data: mergeConflictData,
        setters: { setData: setMergeConflictData },
        saveKey: 'setMergeConflict',
        endpoint: '/api/merge-conflict',
        additionalFields: [
          { label: 'Local Branch', key: 'localBranch' },
          { label: 'Upstream Branch', key: 'upstreamBranch' },
          { label: 'Remote Name', key: 'remoteName' },
        ],
      },
      createTag: {
        title: 'Create Tag Operations',
        data: createTagData,
        setters: { setData: setCreateTagData },
        saveKey: 'setCreateTag',
        endpoint: '/api/create-tag',
        additionalFields: [
          { label: 'Tag Name', key: 'tagName' },
          { label: 'Upstream Branch Name', key: 'branch' },
        ],
      },
      deleteTag: {
        title: 'Delete Tag Operations',
        data: deleteTagData,
        setters: { setData: setDeleteTagData },
        saveKey: 'setDeleteTag',
        endpoint: '/api/delete-tag',
        additionalFields: [{ label: 'Tag Name', key: 'tagName' }],
      },
      deleteRelease: {
        title: 'Delete Release Operations',
        data: deleteReleaseData,
        setters: { setData: setDeleteReleaseData },
        saveKey: 'setDeleteRelease',
        endpoint: '/api/delete-releases',
        additionalFields: [
          { label: 'Release Name', key: 'releaseName' },
          // { label: 'Release ID (Optional)', key: 'releaseId' },
        ],
      },
    };

    const { title, data, setters, saveKey, endpoint, additionalFields } = tabData[activeTab];

    return (
      <div className="p-4 bg-white shadow rounded">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="space-y-4">
          {renderInput('Organization Name', data.orgName, (e) =>
            setters.setData(prev => ({ ...prev, orgName: e.target.value }))
          )}
          {renderRepoInput(activeTab, data.repos)}
          {additionalFields.map(({ label, key }) =>
            renderInput(label, data[key], (e) => setters.setData(prev => ({ ...prev, [key]: e.target.value })))
          )}
          <div>
            <label className="block mb-2 text-sm font-medium">GitHub Token</label>
            <div className="relative flex items-center">
              <input
                type={isTokenVisible ? 'text' : 'password'}
                value={data.githubToken}
                onChange={(e) => setters.setData((prev) => ({ ...prev, githubToken: e.target.value }))}
                placeholder="GitHub Token"
                className="w-full px-2 py-1 border rounded pr-10"
              />
              <span
                onClick={() => setIsTokenVisible(!isTokenVisible)}
                className="absolute right-2 cursor-pointer text-gray-500 hover:text-gray-700"
              >
                {isTokenVisible ? <EyeOff size={20} /> : <Eye size={20} />}
              </span>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => handleApiCall(endpoint, data)}
              className="px-4 py-2 bg-blue-500 text-white rounded"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Submit'}
            </button>
            <button
              onClick={() => saveData(saveKey, data)}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <ToastContainer />
      <div className="flex mb-4">
        {['mergeConflict', 'createTag', 'deleteTag', 'deleteRelease'].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 border-b-2 ${
              activeTab === tab ? 'border-blue-500 text-blue-500' : 'border-gray-200 text-gray-500'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>
      {renderTabContent()}
    </div>
  );
};

export default Form;
