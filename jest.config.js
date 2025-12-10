module.exports = {
  preset: "jest-expo",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@src/(.*)$": "<rootDir>/src/$1",
    "^@/src/(.*)$": "<rootDir>/src/$1", // головне правило
  },
};
