import axios from 'axios';
import React, { useEffect, useState } from 'react';
// Default states for each form
const defaultMergeConflictData = {
  orgName: "",
  repos: [""],
  localBranch: "",
  upstreamBranch: "",
  remoteName: "",
  githubToken: "",
};

const defaultCreateTagData = {
  orgName: "",
  repos: [""],
  tagName: "",
  branch: "",
  githubToken: "",
};

const defaultDeleteTagData = {
  orgName: "",
  repos: [""],
  tagName: "",
  githubToken: "",
};


const Form = () => {
  const [activeTab, setActiveTab] = useState('mergeConflict');

  const [mergeConflictData, setMergeConflictData] = useState(defaultMergeConflictData);
  const [createTagData, setCreateTagData] = useState(defaultCreateTagData);
  const [deleteTagData, setDeleteTagData] = useState(defaultDeleteTagData);

  // Load data from localStorage on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load merge conflict data
      try {
        const storedMergeConflict = localStorage.getItem("setMergeConflict");
        if (storedMergeConflict) {
          setMergeConflictData(JSON.parse(storedMergeConflict));
        }
      } catch (error) {
        console.error("Invalid data in 'setMergeConflict':", error);
      }

      // Load create tag data
      try {
        const storedCreateTag = localStorage.getItem("setCreateTag");
        if (storedCreateTag) {
          setCreateTagData(JSON.parse(storedCreateTag));
        }
      } catch (error) {
        console.error("Invalid data in 'setCreateTag':", error);
      }

      // Load delete tag data
      try {
        const storedDeleteTag = localStorage.getItem("setDeleteTag");
        if (storedDeleteTag) {
          setDeleteTagData(JSON.parse(storedDeleteTag));
        }
      } catch (error) {
        console.error("Invalid data in 'setDeleteTag':", error);
      }
    }
  }, []);

  const handleMergeConflict = async () => {
    try {
      console.log("handleMergeConflict");
      const response = await axios.post('/api/merge-conflict', mergeConflictData);
      console.log('Merge Conflict Response:', response.data);
    } catch (error) {
      console.error('Error in handleMergeConflict:', error);
    }
  };

  const handleCreateTag = async () => {
    try {
      console.log("handleCreateTag");
      const response = await axios.post('/api/create-tag', createTagData);
      console.log('Create Tag Response:', response.data);
    } catch (error) {
      console.error('Error in handleCreateTag:', error);
    }
  };

  const handleDeleteTag = async () => {
    try {
      console.log("handleDeleteTag");
      const response = await axios.post('/api/delete-tag', deleteTagData);
      console.log('Delete Tag Response:', response.data);
    } catch (error) {
      console.error('Error in handleDeleteTag:', error);
    }
  };

  // Handle saving to localStorage
  const saveMergeConflict = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("setMergeConflict", JSON.stringify(mergeConflictData));
    }
  };

  const saveCreateTag = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("setCreateTag", JSON.stringify(createTagData));
    }
  };

  const saveDeleteTag = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("setDeleteTag", JSON.stringify(deleteTagData));
    }
  };
  // Handle dynamic repo input for each tab
  const handleRepoChange = (tab, index, value) => {
    console.log("tab, index, value ::", tab, index, value);

    switch (tab) {
      case 'mergeConflict':
        const newMergeRepos = [...mergeConflictData.repos];
        newMergeRepos[index] = value;
        setMergeConflictData(prev => ({ ...prev, repos: newMergeRepos }));
        break;
      case 'createTag':
        const newCreateRepos = [...createTagData.repos];
        newCreateRepos[index] = value;
        setCreateTagData(prev => ({ ...prev, repos: newCreateRepos }));
        break;
      case 'deleteTag':
        const newDeleteRepos = [...deleteTagData.repos];
        newDeleteRepos[index] = value;
        setDeleteTagData(prev => ({ ...prev, repos: newDeleteRepos }));
        break;
    }
  };

  // Remove repo handler for each tab
  const removeRepoField = (tab, indexToRemove) => {
    switch (tab) {
      case 'mergeConflict':
        setMergeConflictData(prev => ({
          ...prev,
          repos: prev.repos.filter((_, index) => index !== indexToRemove)
        }));
        break;
      case 'createTag':
        setCreateTagData(prev => ({
          ...prev,
          repos: prev.repos.filter((_, index) => index !== indexToRemove)
        }));
        break;
      case 'deleteTag':
        setDeleteTagData(prev => ({
          ...prev,
          repos: prev.repos.filter((_, index) => index !== indexToRemove)
        }));
        break;
    }
  };

  // Add repo handler for each tab
  const addRepoField = (tab) => {
    switch (tab) {
      case 'mergeConflict':
        setMergeConflictData(prev => ({ ...prev, repos: [...prev.repos, ''] }));
        break;
      case 'createTag':
        setCreateTagData(prev => ({ ...prev, repos: [...prev.repos, ''] }));
        break;
      case 'deleteTag':
        setDeleteTagData(prev => ({ ...prev, repos: [...prev.repos, ''] }));
        break;
    }
  };

  // Render repos input fields
  const renderRepoInputs = (tab, repos, handleChange) => {
    return repos.map((repo, index) => (
      <div key={index} className="flex gap-2 mb-2">
        <input
          type="text"
          value={repo}
          onChange={(e) => handleChange(tab, index, e.target.value)}
          placeholder={`Repository ${index + 1}`}
          className="flex-grow px-2 py-1 border rounded"
        />
        {/* Remove button - only show if more than one repo */}
        {repos.length > 1 && (
          <button
            onClick={() => removeRepoField(tab, index)}
            className="px-3 py-1 border rounded bg-red-500 text-white"
          >
            -
          </button>
        )}
        {/* Add button - only show on last input */}
        {index === repos.length - 1 && (
          <button
            onClick={() => addRepoField(tab)}
            className="px-3 py-1 border rounded bg-blue-500 text-white"
          >
            +
          </button>
        )}
      </div>
    ));
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'mergeConflict':
        return (
          <div className="p-4 bg-white shadow rounded">
            <h2 className="text-xl font-bold mb-4">Merge Conflict Operations</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Organization Name</label>
                <input
                  type="text"
                  value={mergeConflictData.orgName}
                  onChange={(e) => setMergeConflictData(prev => ({ ...prev, orgName: e.target.value }))}
                  placeholder="Organization Name"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Repositories</label>
                {renderRepoInputs('mergeConflict', mergeConflictData.repos, handleRepoChange)}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Local Branch</label>
                <input
                  type="text"
                  value={mergeConflictData.localBranch}
                  onChange={(e) => setMergeConflictData(prev => ({ ...prev, localBranch: e.target.value }))}
                  placeholder="Local Branch"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Upstream Branch</label>
                <input
                  type="text"
                  value={mergeConflictData.upstreamBranch}
                  onChange={(e) => setMergeConflictData(prev => ({ ...prev, upstreamBranch: e.target.value }))}
                  placeholder="Upstream Branch"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Remote Name</label>
                <input
                  type="text"
                  value={mergeConflictData.remoteName}
                  onChange={(e) => setMergeConflictData(prev => ({ ...prev, remoteName: e.target.value }))}
                  placeholder="Remote Name"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Github token</label>
                <input
                  type="password"
                  value={mergeConflictData.githubToken}
                  onChange={(e) => setMergeConflictData(prev => ({ ...prev, githubToken: e.target.value }))}
                  placeholder="GitHub Token"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <button onClick={handleMergeConflict} className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded">
                Merge Conflict
              </button>
              <button
                onClick={saveMergeConflict}
                className="w-full sm:w-auto mx-2 px-4 py-2 bg-gray-500 text-white rounded"
              >
                save
              </button>
            </div>
          </div>
        );
      case 'createTag':
        return (
          <div className="p-4 bg-white shadow rounded">
            <h2 className="text-xl font-bold mb-4">Create Tag Operations</h2>
            <div className="space-y-4">

              <div>
                <label className="block mb-2 text-sm font-medium">Organization Name</label>

                <input
                  type="text"
                  value={createTagData.orgName}
                  onChange={(e) => setCreateTagData(prev => ({ ...prev, orgName: e.target.value }))}
                  placeholder="Organization Name"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Repositories</label>
                {renderRepoInputs('createTag', createTagData.repos, handleRepoChange)}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Tag Name</label>
                <input
                  type="text"
                  value={createTagData.tagName}
                  onChange={(e) => setCreateTagData(prev => ({ ...prev, tagName: e.target.value }))}
                  placeholder="Tag Name"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Branch Name</label>

                <input
                  type="text"
                  value={createTagData.branch}
                  onChange={(e) => setCreateTagData(prev => ({ ...prev, branch: e.target.value }))}
                  placeholder="Branch"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Github token</label>

                <input
                  type="password"
                  value={createTagData.githubToken}
                  onChange={(e) => setCreateTagData(prev => ({ ...prev, githubToken: e.target.value }))}
                  placeholder="GitHub Token"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <button
                onClick={handleCreateTag}
                className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded"
              >
                Create Tag
              </button>
              <button
                onClick={saveCreateTag}
                className="w-full sm:w-auto mx-2 px-4 py-2 bg-gray-500 text-white rounded"
              >
                save
              </button>
            </div>
          </div>
        );
      case 'deleteTag':
        return (
          <div className="p-4 bg-white shadow rounded">
            <h2 className="text-xl font-bold mb-4">Delete Tag Operations</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Organisation Name</label>
                <input
                  type="text"
                  value={deleteTagData.orgName}
                  onChange={(e) => setDeleteTagData(prev => ({ ...prev, orgName: e.target.value }))}
                  placeholder="Organization Name"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Repositories</label>
                {renderRepoInputs('deleteTag', deleteTagData.repos, handleRepoChange)}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Tag Name</label>
                <input
                  type="text"
                  value={deleteTagData.tagName}
                  onChange={(e) => setDeleteTagData(prev => ({ ...prev, tagName: e.target.value }))}
                  placeholder="Tag Name"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Github token</label>
                <input
                  type="password"
                  value={deleteTagData.githubToken}
                  onChange={(e) => setDeleteTagData(prev => ({ ...prev, githubToken: e.target.value }))}
                  placeholder="GitHub Token"
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <button onClick={handleDeleteTag} className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded">
                Delete Tag
              </button>
              <button
                onClick={saveDeleteTag}
                className="w-full sm:w-auto mx-2 px-4 py-2 bg-gray-500 text-white rounded"
              >
                save
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="flex mb-4">
        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'mergeConflict' ? 'border-blue-500 text-blue-500' : 'border-gray-200 text-gray-500'}`}
          onClick={() => setActiveTab('mergeConflict')}
        >
          Merge Conflict
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'createTag' ? 'border-blue-500 text-blue-500' : 'border-gray-200 text-gray-500'}`}
          onClick={() => setActiveTab('createTag')}
        >
          Create Tag
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${activeTab === 'deleteTag' ? 'border-blue-500 text-blue-500' : 'border-gray-200 text-gray-500'}`}
          onClick={() => setActiveTab('deleteTag')}
        >
          Delete Tag
        </button>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default Form;