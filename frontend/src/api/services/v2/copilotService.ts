import axios from '../../axios';

export const copilotService = {
  chat: async (message: string): Promise<{ message: string }> => {
    const response = await axios.post('/v2/copilot/chat', { message });
    return response.data;
  }
};
