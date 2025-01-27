const saveDataToSession = (key: string, data: any) => {
  sessionStorage.setItem(key, JSON.stringify(data));
};

const getDataSession = (key: string) => {
  const data = sessionStorage.getItem(key);

  return data ? JSON.parse(data) : null;
};

const removeDataSession = (key: string) => {
  sessionStorage.removeItem(key);
};

const removeItemFromSessionArray = (key: string, itemToRemove: any) => {
  const storedData = getDataSession(key);

  if (storedData && Array.isArray(storedData)) {
    const updatedData = storedData.filter((item) => item !== itemToRemove);

    saveDataToSession(key, updatedData);
  }
};

const addItemToSession = (key: string, item: any) => {
  let sessionData = sessionStorage.getItem(key);

  let itemsArray = sessionData ? JSON.parse(sessionData) : [];

  itemsArray.push(item);

  sessionStorage.setItem(key, JSON.stringify(itemsArray));
};

const isKeyInSession = (key: string) => {
  return sessionStorage.getItem(key) !== null;
};

export {
  saveDataToSession,
  getDataSession,
  removeDataSession,
  removeItemFromSessionArray,
  addItemToSession,
  isKeyInSession,
};
