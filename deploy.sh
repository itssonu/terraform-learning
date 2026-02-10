#!/bin/bash

ENV=$1
PROJECT_NAME=project-sonu
S3_BUCKET="www-${PROJECT_NAME}-${ENV}"
CLOUDFRONT_DISTRIBUTION_ID="E16OGHJL4NQ8R7"
API_IMAGE_NAME="${PROJECT_NAME}-${ENV}-api"
PFQ_IMAGE_NAME="${PROJECT_NAME}-${ENV}-pfq"

echo "deploying in $ENV"

terraform -chdir=./env/${ENV} init

terraform -chdir=./env/${ENV} apply -auto-approve

echo "API image push"
cd ./codeBase/auto-settlement-pro-api

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 171395134194.dkr.ecr.us-east-1.amazonaws.com
docker build --platform linux/amd64 -t $API_IMAGE_NAME .
docker tag $API_IMAGE_NAME:latest 171395134194.dkr.ecr.us-east-1.amazonaws.com/$API_IMAGE_NAME:latest
docker push 171395134194.dkr.ecr.us-east-1.amazonaws.com/$API_IMAGE_NAME:latest

cd ../ProcessingFileQueue
docker build --platform linux/amd64 -t $PFQ_IMAGE_NAME .
docker tag $PFQ_IMAGE_NAME:latest 171395134194.dkr.ecr.us-east-1.amazonaws.com/$PFQ_IMAGE_NAME:latest
docker push 171395134194.dkr.ecr.us-east-1.amazonaws.com/$PFQ_IMAGE_NAME:latest

# aws ecs update-service --cluster ${PROJECT_NAME}-${ENV}-pfq-cluster --service <service-name> --force-new-deployment
aws ecs update-service --cluster ${PROJECT_NAME}-${ENV}-pfq-cluster --service ${PROJECT_NAME}-${ENV}-pfq-service --force-new-deployment --no-cli-pager

terraform -chdir=../../env/${ENV} apply -auto-approve \
  -replace="module.project_sonu.aws_lambda_function.api" \
  -replace="module.project_sonu.aws_lambda_permission.api"

echo "setting env variables ui..."

cat > ../auto-settlement-pro-ui/.env.production << EOF
REACT_APP_API_BASE_URL=$(terraform -chdir=../..//env/${ENV} output --raw -raw api_base_url)
REACT_APP_PFQ_BASE_URL=$(terraform -chdir=../..//env/${ENV} output --raw -raw pfq_base_url)
REACT_APP_LOCAL_CRYPTO_SECRET=CRYPTO_SECRET
REACT_APP_FE_BASE_URL=$(terraform -chdir=../..//env/${ENV} output --raw cloudfront_domain_name)
EOF

cd ../auto-settlement-pro-ui
rm -rf build
npm i --force
npm run build
aws s3 rm s3://$S3_BUCKET --recursive
aws s3 sync ./build/ s3://$S3_BUCKET

echo "Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*" --query 'Invalidation.Id' --output text)

cd ../../env/$ENV
terraform output

