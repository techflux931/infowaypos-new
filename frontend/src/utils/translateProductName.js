// src/utils/translateProductName.js
import dictionary from '../data/productDictionary.json';

/**
 * Translates an English product name to Arabic using a predefined dictionary.
 * Converts input to lowercase to ensure consistent matching.
 *
 * @param {string} name - English product name
 * @returns {string} - Arabic translation or empty string
 */
export function translateProductName(name) {
  if (!name || typeof name !== "string") return "";
  const key = name.trim().toLowerCase();
  return dictionary[key] || "";
}
