export const saveInLocalStorage = (key: string, token: string) => {
  localStorage.setItem(key, token);
};

export const getFromLocalStorage = (key: string): string | null => {
  return localStorage.getItem(key);
};

export const removeFromLocalStorage = (key: string) => {
  localStorage.removeItem(key);
};
