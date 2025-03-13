const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const axios = require('axios');

// Initialize JWKS client to fetch public keys from Azure AD
const client = jwksClient({
  jwksUri: 'https://login.microsoftonline.com/0e01a93f-5c70-4862-a94b-ae4261074cb5/discovery/v2.0/keys'
});

// Function to get the signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err, null);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
}

// Lambda handler function
exports.handler = async (event) => {
  const token = event.authorizationToken.split(' ')[1]; // Extract the JWT token

  try {
    // Verify the JWT token
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        issuer: `https://sts.windows.net/0e01a93f-5c70-4862-a94b-ae4261074cb5/`,
      }, (err, decodedToken) => {
        if (err) {
          reject(err);
        } else {
          resolve(decodedToken);
        }
      });
    });
    const policy = generatePolicy(decoded.sub, 'Allow', event.methodArn);

    const isUSerToken = decoded.unique_name;

    if(isUSerToken){
      // Fetch the user ID from your backend API using the unique name from the decoded token
    const { id, email } = await getUserInfoFromAPI(decoded.unique_name);

    // Generate an IAM policy allowing access
    

    // Attach user ID to the context, which will be passed to downstream APIs
    policy.context = {
      'userid': id,
      'useremail': email
    };

    }else{

      policy.context = {
        'userid': "c2415875-bff3-404e-a792-8d7e594b37bc"
      };

    }

    console.log("Token is valid:", decoded);

    

    console.log(policy);

    return policy;

  } catch (error) {
    console.error('Token validation failed:', error);
    return generatePolicy(null, 'Deny', event.methodArn);
  }
}

// Function to generate an IAM policy
function generatePolicy(principalId, effect, resource) {
  const authResponse = {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource,
      }]
    },
    context: {}, // Context for downstream services
  };
  return authResponse;
}

// Function to get user ID from the backend API
async function getUserInfoFromAPI(uniqueName) {
  try {
    const response = await axios.get(`http://a92d554b276e0498997451435907f26e-fc586e864ef7b55c.elb.us-east-1.amazonaws.com/users/${uniqueName}`, {
      headers: {
        'user-id': 'c2415875-bff3-404e-a792-8d7e594b37bc' // Replace with actual UUID if needed
      }
    });

    return {id: response.data.id, email: response.data.email};
  } catch (error) {
    console.error('Failed to get userId from API:', error);
    throw new Error('Failed to retrieve userId');
  }
}
