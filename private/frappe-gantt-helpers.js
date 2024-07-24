const exportFunctions = {
  elementResized(element) {
    return elementResized(element);
  },
};

async function elementResized(element) {
  return new Promise((resolve) => {
    const checkWidth = () => {
      const width = element.getBoundingClientRect().width;
      if (width > 10) {
        resolve();
      } else {
        setTimeout(checkWidth, 100); // Check again after 100 milliseconds
      }
    };
    checkWidth();
  });
}

export default exportFunctions;
