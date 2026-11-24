// This tests that constructing agents with invalid proxy URLs throws ERR_PROXY_INVALID_CONFIG.
import '../common/index.mjs';
import assert from 'node:assert';
import http from 'node:http';

const testCases = [
  {
    name: 'invalid IPv4 address',
    proxyUrl: 'http://256.256.256.256:8080',
  },
  {
    name: 'invalid IPv6 address',
    proxyUrl: 'http://::1:8080',
  },
  {
    name: 'missing host',
    proxyUrl: 'http://:8080',
  },
  {
    name: 'non-numeric port',
    proxyUrl: 'http://proxy.example.com:port',
  },
];

for (const testCase of testCases) {
  assert.throws(() => {
    new http.Agent({
      proxyEnv: {
        HTTP_PROXY: testCase.proxyUrl,
      },
    });
  }, {
    code: 'ERR_PROXY_INVALID_CONFIG',
    message: `Invalid proxy URL: ${testCase.proxyUrl}`,
  });
}

// Credentials with a '%' that is not a valid percent-encoded sequence used to
// escape as a bare URIError from decodeURIComponent(). They should be reported
// as ERR_PROXY_INVALID_CONFIG, and the message must not contain the credentials.
const malformedCredentials = [
  'http://user:p%ss@proxy.example.com:8080',
  'http://us%zzer:pass@proxy.example.com:8080',
  'http://user:%E0%A4%A@proxy.example.com:8080',
];

for (const proxyUrl of malformedCredentials) {
  assert.throws(() => {
    new http.Agent({
      proxyEnv: {
        HTTP_PROXY: proxyUrl,
      },
    });
  }, {
    code: 'ERR_PROXY_INVALID_CONFIG',
    message: 'Invalid proxy URL: http://proxy.example.com:8080/ ' +
      '(credentials contain malformed percent-encoding)',
  });
}
