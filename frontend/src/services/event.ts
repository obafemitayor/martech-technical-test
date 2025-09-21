import apiClient from './apiClient';

export const submitEvent = async (eventData: any, token: string) => {
  const response = await apiClient.post('/events', eventData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
