export const validateUrl = (url: string) => {
  const regex =
    /^(https?:\/\/)([\w\-]+\.)+[\w\-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;%=]*)?$/;

  return regex.test(url);
};
