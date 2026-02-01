export const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (e) {
    return 'https://www.google.com/s2/favicons?domain=google.com&sz=64'; // Fallback
  }
};

export const isValidUrl = (string: string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};
