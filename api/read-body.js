module.exports = function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (ch) => (data += ch));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
};
