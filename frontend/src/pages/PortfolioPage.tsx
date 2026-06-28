import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioService } from '../api/services/portfolioService';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { LoadingState } from '@/shared/components/ui';

const PortfolioPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [portfolioTitle, setPortfolioTitle] = useState('');

  const { data: portfolioData, isLoading: portfoliosLoading } = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => portfolioService.getPortfolios(),
    enabled: isAuthenticated
  });

  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: ['personalBrands'],
    queryFn: () => portfolioService.getPersonalBrands(),
    enabled: isAuthenticated
  });

  const createPortfolioMutation = useMutation({
    mutationFn: () => portfolioService.createPortfolio({ title: portfolioTitle, isPublic: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      toast.success('Portfolio created!');
      setPortfolioTitle('');
    }
  });

  const generateBrandMutation = useMutation({
    mutationFn: (brandType: string) => portfolioService.generatePersonalBrand(brandType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalBrands'] });
      toast.success('Personal brand content generated!');
    }
  });

  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Portfolio & Personal Branding</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Portfolios</h2>
          </div>
          
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={portfolioTitle}
              onChange={(e) => setPortfolioTitle(e.target.value)}
              placeholder="Portfolio title"
              className="flex-1 p-2 border rounded-lg"
            />
            <button
              onClick={() => createPortfolioMutation.mutate()}
              disabled={!portfolioTitle || createPortfolioMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Create
            </button>
          </div>

          {portfoliosLoading ? (
            <LoadingState message="Loading portfolios..." />
          ) : (
            <div className="space-y-4">
              {portfolioData?.portfolios.map((portfolio) => (
                <div key={portfolio.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{portfolio.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{portfolio.description}</p>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      portfolio.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {portfolio.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  {portfolio.projects && portfolio.projects.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Projects: {portfolio.projects.length}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Personal Branding</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {['linkedin_summary', 'linkedin_headline', 'elevator_pitch', 'bio'].map((type) => (
              <button
                key={type}
                onClick={() => generateBrandMutation.mutate(type)}
                className="p-3 border rounded-lg hover:bg-gray-50 text-left"
              >
                <p className="font-medium">{type.replace('_', ' ')}</p>
                <p className="text-sm text-gray-600">Generate with AI</p>
              </button>
            ))}
          </div>

          {brandsLoading ? (
            <LoadingState message="Loading personal branding..." />
          ) : (
            <div className="space-y-4">
              {brandsData?.brands.map((brand) => (
                <div key={brand.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-gray-600">{brand.brandType}</span>
                    <span className="text-sm font-semibold text-blue-600">
                      Score: {brand.aiScore}/100
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{brand.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
