const https = require("https");
var axios = require("axios");
var cors = require("cors");
var express = require("express");
var bodyParser = require("body-parser");

// Prevents server from quitting when an error is caught.
process.on("uncaughtException", (error, origin) => {
  console.log("----- Uncaught exception -----");
  console.log(error);
  console.log("----- Exception origin -----");
  console.log(origin);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("----- Unhandled Rejection at -----");
  console.log(promise);
  console.log("----- Reason -----");
  console.log(reason);
});

// Uses express to circumvent the original port 4200 for the 5000 port instead.
const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:4200",
  })
);

app.listen(PORT, () =>
  console.log(`Server is running on port: http://localhost:${PORT}`)
);

// Get Bearer token
async function generateAccessToken() {
  try {
    var post_data = {
      grant_type: "client_credentials",
      client_id: "jIUK4mNX6EMMmZvpv2GuCgHWpG1ikGm9",
      client_secret: "EbSlLlYvd7reKYdR",
    };

    // Fixes Error: unable to verify the first certificate
    // https://stackoverflow.com/questions/51363855/how-to-configure-axios-to-use-ssl-certificate
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const response = await axios({
      method: "post",
      url: "https://test.api.amadeus.com/v1/security/oauth2/token",
      httpsAgent: agent,
      data: Object.keys(post_data)
        .map(function (key) {
          return (
            encodeURIComponent(key) + "=" + encodeURIComponent(post_data[key])
          );
        })
        .join("&"),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    console.log("response.data.access_token = ", response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.log("token error inbound>>>>>>>>>>>>>>");
    console.log("token error:", error);
  }
}

// Get request together with Bearer token
async function getRequest(url, access_token) {
  try {
    var headers = {
      Authorization: "Bearer " + access_token,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const response = await axios({
      method: "get",
      url: url,
      httpsAgent: agent,
      headers: headers,
    });

    return await response;
  } catch (error) {
    console.log(("Failed to execute " + url) & " Found Error as ", error);
  }
}

// Backend endpoint
app.get("/flight-search", function (req, res) {
  const originLocationCode = req.query.originLocationCode;
  const destinationLocationCode = req.query.destinationLocationCode;
  const departureDate = req.query.departureDate;
  const returnDate = req.query.returnDate;
  const adults = req.query.adults;
  const max = req.query.max;

  generateAccessToken().then((result) => {
    getRequest(
      `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${originLocationCode}&destinationLocationCode=${destinationLocationCode}&departureDate=${departureDate}&returnDate=${returnDate}&adults=${adults}&max=${max}`,
      result
    ).then((myData) => {
      if (myData === undefined) {
        res.status(404).json("Not Found");
        res.status(400).json("Bad request");
      }
      res.status(200).json(myData.data);
    });
  });
});
