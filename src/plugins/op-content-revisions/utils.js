// Description: Utility functions for the history log plugin.

export function countWords(str) {
  return str.trim().split(/\s+/).length;
}

/**
 * Basic hash function based on DJB "33-times" algorithm.
 */
export function generateHash(str) {
  const len = str.length;
  let h = 5381;

  for (let i = 0; i < len; i++) {
    h = h * 33 ^ str.charCodeAt(i);
  }
  return h >>> 0;
}
