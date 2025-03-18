const AWS = require('aws-sdk');
const appConfig = new AWS.AppConfigData();

exports.handler = async (event) => {
  const applicationId = process.env.APPCONFIG_APPLICATION_ID;
  const environmentId = process.env.APPCONFIG_ENVIRONMENT_ID;
  const profileId = process.env.APPCONFIG_PROFILE_ID;

  try {
    const session = await appConfig.startConfigurationSession({
      ApplicationIdentifier: applicationId,
      EnvironmentIdentifier: environmentId,
      ConfigurationProfileIdentifier: profileId
    }).promise();

    const config = await appConfig.getLatestConfiguration({
      ConfigurationToken: session.InitialConfigurationToken
    }).promise();

    const configData = JSON.parse(config.Configuration);

    const userId = configData['user-id'];
    console.log('Fetched user-id from AppConfig:', userId);

    const policy = generatePolicy('Allow', event.methodArn, userId);

    return policy;

  } catch (err) {
    console.error("Error fetching AppConfig or generating policy:", err);
 
    return {
      statusCode: 401,
      body: "Unauthorized"
    };
  }
};

const generatePolicy = (effect, resource, userId) => {
  return {
    principalId: userId, 
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    },
    context: {
      'userid': userId
    }
  };
};
