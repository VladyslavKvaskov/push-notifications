const http = require('http');
const qs = require('querystring');
const webPush = require('web-push');

function getQueryFromStringURL(url, letiable) {
  let query = url.slice(url.indexOf('?'), url.length).substring(1);
  let lets = query.split("&");
  for (let i = 0; i < lets.length; i++) {
    let pair = lets[i].split("=");
    if (pair[0] == letiable) {
      return pair[1];
    }
  }
  return (false);
}

http.createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  let body = '';
  if (request.method === 'POST') {
    request.on('data', chunk => {
      body += chunk;
    });

    request.on('end', () => {
      try {
        const post = qs.parse(body);
        if (post.notification) {

          const n = JSON.parse(post.notification);
          const payload = n.message;

          const options = {
            vapidDetails: {
              subject: 'mailto:EMAIL',
              publicKey: 'PUBLIC_KEY',
              privateKey: 'PRIVATE_KEY'
            },
            TTL: 604800
          };
          for (let subscription of n.subs) {
            let pushSubscription = JSON.parse(subscription);

            //start for Microsoft Edge
            if (getQueryFromStringURL(pushSubscription.endpoint, 'token')) {
              let endpoint = pushSubscription.endpoint;
              const newToken = getQueryFromStringURL(endpoint, 'token').replace(/\//g, '%2f').replace(/\+/g, '%2b');
              pushSubscription.endpoint = pushSubscription.endpoint.replace(getQueryFromStringURL(pushSubscription.endpoint, 'token'), newToken);
            }
            //end for Microsoft Edge

            webPush.sendNotification(
              pushSubscription,
              payload,
              options
            ).then(res => {
              response.write('success');
              response.end();
              return res;
            }).catch(err => {
              response.write('fail');
              response.write(err);
              response.end();
            });
          }
        }
      } catch (err) {
        response.write('error');
        response.end();
      }
    })
  } else {
    response.write('Only method POST is allowed!');
    response.end();
  }
}).listen(80)
