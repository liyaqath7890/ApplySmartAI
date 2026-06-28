
import React from 'react';
import { User, Edit3 } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useAuthStore } from '@/store';

interface ProfileHeaderProps {
  onEditProfile?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onEditProfile }) => {
  const { user } = useAuthStore();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {user?.firstName?.charAt(0) || 'U'}{user?.lastName?.charAt(0) || ''}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-500 mt-1">
              {user?.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                Profile Complete
              </span>
            </div>
          </div>
        </div>
        <div>
          <Button onClick={onEditProfile} className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>
      </div>
    </div>
  );
};

