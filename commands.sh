aws s3 mb s3://wellink-sam-auth-dev-test --profile wellinks-admin-dev


aws cloudformation package \
    --s3-bucket wellink-sam-auth-dev-test \
    --template-file template.yaml \
    --output-template-file gen/template-generated.yaml \
    --profile wellinks-admin-dev


aws cloudformation deploy \
    --template-file C:\\Users\\gaura\\Desktop\\samAuthTemplate\\gen\\template-generated.yaml \
    --stack-name lambda-authorizer-dev-test \
    --capabilities CAPABILITY_IAM \
    --profile wellinks-admin-dev


# subfolders for authorizers
# easy to understand structure
# aliasing 

sam.cmd build --profile wellinks-admin-dev
sam.cmd deploy --stack-name lambda-authorizer-dev-test --capabilities CAPABILITY_IAM --s3-bucket wellink-sam-auth-dev-test --profile wellinks-admin-dev 
sam.cmd sync --stack-name lambda-authorizer-dev-test --profile wellinks-admin-dev