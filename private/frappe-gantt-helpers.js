const exportFunctions = {
  elementResized(element) {
    return elementResized(element);
  },
};

async function elementResized(element) {
  console.log("element: ");
  console.log(element);
  return new Promise((resolve) => {
    const checkWidth = () => {
      const width = element.getBoundingClientRect().width;
      if (width > 10) {
        resolve();
      } else {
        console.log("svg not yet resized");
        setTimeout(checkWidth, 100); // Check again after 100 milliseconds
      }
    };
    checkWidth();
  });
}

export default exportFunctions;
