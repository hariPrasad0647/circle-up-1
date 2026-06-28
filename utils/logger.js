const info = (...args) => console.log(new Date().toISOString(), ...args);

const error = (...args) => console.error(new Date().toISOString(), ...args);

module.exports = { info, error };
