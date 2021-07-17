export function jsonParse (str, def = null) {
  try {
    return JSON.parse(str) || def;
  } catch (e) {
    console.error(e);
    return def;
  }
}

export function jsonStringify (data, def = null) {
  try {
    return JSON.stringify(data) || def;
  } catch (e) {
    console.error(e);
    return ('' + data).toString();
  }
}
