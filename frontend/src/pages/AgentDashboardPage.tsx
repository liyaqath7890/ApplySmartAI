import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService, Agent } from '../api/services/agentService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const AgentDashboardPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentService.getAgents(),
    enabled: isAuthenticated
  });

  const createAgentMutation = useMutation({
    mutationFn: agentService.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent created successfully!');
    }
  });

  const executeTaskMutation = useMutation({
    mutationFn: agentService.executeTask,
    onSuccess: () => {
      toast.success('Task executed!');
    }
  });

  const handleCreateAgent = () => {
    createAgentMutation.mutate({
      name: 'Job Search Agent',
      agentType: 'both'
    });
  };

  const handleExecuteTask = (agentId: string, taskType: string) => {
    executeTaskMutation.mutate({ agentId, taskType });
  };

  if (!isAuthenticated) return <div>Please log in</div>;
  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AI Agents</h1>
        <button
          onClick={handleCreateAgent}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agentsData?.agents.map((agent) => (
          <div key={agent.id} className="border rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>
            <p className="text-gray-600 mb-4">Type: {agent.agentType}</p>
            <div className="flex gap-2 mb-4">
              <span className={`px-2 py-1 rounded text-sm ${
                agent.status === 'active' ? 'bg-green-100 text-green-800' :
                agent.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {agent.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              <p>Total Applications: {agent.totalApplications}</p>
              <p>Success Rate: {agent.successRate.toFixed(2)}%</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExecuteTask(agent.id, 'search_jobs')}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm"
              >
                Search Jobs
              </button>
              <button
                onClick={() => setSelectedAgent(agent)}
                className="flex-1 bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-sm"
              >
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {agentsData?.agents.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl mb-4">No agents yet</h3>
          <p className="text-gray-600 mb-4">Create your first AI agent to automate your job search!</p>
        </div>
      )}
    </div>
  );
};

export default AgentDashboardPage;
