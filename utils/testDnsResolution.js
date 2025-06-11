const dns = require('dns');

const hostname = 'db.hzjssvozkqrogkmokxih.supabase.co';

dns.lookup(hostname, (err, address, family) => {
  if (err) {
    console.error('DNS lookup failed:', err);
  } else {
    console.log(`DNS lookup successful: ${hostname} -> ${address} (IPv${family})`);
  }
});
