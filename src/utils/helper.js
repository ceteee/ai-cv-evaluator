const reformatToObject = async (text) => {
  try {
    const cleaned = text.match(/\{[\s\S]*\}/);
    return JSON.parse(cleaned ? cleaned[0] : "{}");
  } catch (err) {
    throw "invalid response format";
  }
};

export { reformatToObject };