export const getFaviconUrl = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://${domain}/favicon.ico`;
  } catch (e) {
    return '';
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
