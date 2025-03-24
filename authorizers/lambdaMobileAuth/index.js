const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  const token = event['authorizationtoken'];

  const decoded = jwt.decode(token);
  
  if (decoded) {
    const expectedIssuer = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Amp3UG3z1';
    if (decoded.iss !== expectedIssuer) {
      console.error("Token issuer is invalid");
      return generatePolicy(null, 'Deny', event.methodArn);
    }

    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      console.error("Token has expired");
      return generatePolicy(null, 'Deny', event.methodArn);
    }
    
    console.log("Token is valid");

    const patientId = decoded.sub;

    const policy = generatePolicy(patientId, 'Allow', event.methodArn);

    policy.context = {
      'userid': patientId,
    };

    console.log("Generated policy:", policy);

    return policy;

  } else {
    console.error("Failed to decode token");
    return generatePolicy(null, 'Deny', event.methodArn);
  }
};

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
    context: {},
  };
  return authResponse;
}
