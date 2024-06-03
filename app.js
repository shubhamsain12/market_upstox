

const WebSocket = require('ws');
const protobuf = require('protobufjs');
const axios = require('axios');
const querystring = require('querystring');

(async () => {
  try {
    // Load the protobuf definition
    const root = await protobuf.load('market_data.proto');
    const Marketdata = root.lookupType('marketdata.MarketData');

    // Access token obtained from previous steps (replace with your actual access token)
    const accessToken = 'eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI3SkFLNlAiLCJqdGkiOiI2NjVkYTkxYTA1M2FiYjBlY2YxMDU4YzciLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaWF0IjoxNzE3NDE0MTcwLCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3MTc0NTIwMDB9.5j0e3MRc69wp4UUed4mXL7WZ7eZVBd1rrkPglpL2_gk';
    console.log('Access Token:', accessToken);

    // Connect to the WebSocket
    const ws = new WebSocket('wss://api.upstox.com/v2/feed/market-data-feed', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': '*/*'
      },
      followRedirects: true
    });

    ws.on('open', function open() {
      console.log('Connected to the WebSocket server');

    //   const subscriptionMessage = {
    //     guid: 'someguid',
    //     method: 'sub',
    //     data: {
    //       mode: 'full',
    //       instrumentKeys: ['NSE_EQ|INE215D01010']
    //     }
    //   };
    const subscriptionMessage = {
        guid: 'someguid',
        method: 'subchange_mode', // Subscription method
        data: {
          mode: 'ltpc', // Mode field value
          instrumentKeys: ['BSE_EQ|INF204K01V53'] // Requested Instrument key/s
        }
      };
      

      const messageBuffer = Marketdata.encode(subscriptionMessage).finish();
      ws.send(messageBuffer);
      console.log('Subscription message sent:', JSON.stringify(subscriptionMessage, null, 2));
    });

    ws.on('message', function incoming(data) {
      console.log('Raw data received from WebSocket:', data);

      try {
        const decodedMessage = Marketdata.decode(new Uint8Array(data));
        console.log('Decoded Message:', JSON.stringify(decodedMessage, null, 2));

        const feeds = decodedMessage.feeds;
        for (const key in feeds) {
          if (feeds.hasOwnProperty(key)) {
            const instrumentData = feeds[key];
            console.log(`Instrument Key: ${key}`);

            if (instrumentData.ltpc) {
              console.log('Latest Traded Price:', instrumentData.ltpc.ltp);
              console.log('Last Traded Time:', instrumentData.ltpc.ltt);
              console.log('Last Traded Quantity:', instrumentData.ltpc.ltq);
              console.log('Close Price:', instrumentData.ltpc.cp);
            }
            // Add more logging as per your data structure
          }
        }
      } catch (error) {
        console.error('Error decoding message:', error);
      }
    });

    ws.on('error', function error(error) {
      console.error('WebSocket error:', error.message);
    });

    ws.on('close', function close() {
      console.log('Disconnected from the WebSocket server');
    });
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.data); // Log the response data for debugging
    } else if (error.request) {
      console.error('Error:', error.request); // Log the request object for debugging
    } else {
      console.error('Error:', error.message); // Log the error message
    }
  }
})();
