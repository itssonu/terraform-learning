#!/bin/bash

ENV=$1
PROJECT_NAME=project-sonu
S3_BUCKET="www-${PROJECT_NAME}-${ENV}"
CLOUDFRONT_DISTRIBUTION_ID="E16OGHJL4NQ8R7"
API_IMAGE_NAME="${PROJECT_NAME}-${ENV}-api"

echo "deploying in $ENV"

terraform -chdir=./env/${ENV} init

terraform -chdir=./env/${ENV} apply -auto-approve

echo "API image push"
cd ./codeBase/auto-settlement-pro-api

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 171395134194.dkr.ecr.us-east-1.amazonaws.com
docker build -t $API_IMAGE_NAME .
docker tag $API_IMAGE_NAME:latest 171395134194.dkr.ecr.us-east-1.amazonaws.com/$API_IMAGE_NAME:latest
docker push 171395134194.dkr.ecr.us-east-1.amazonaws.com/$API_IMAGE_NAME:latest

terraform -chdir=../../env/${ENV} apply -auto-approve \
  -replace="module.project_sonu.aws_lambda_function.api" \
  -replace="module.project_sonu.aws_lambda_permission.api"

echo "setting env variables ui..."

export REACT_APP_FE_BASE_URL=$(terraform -chdir=../..//env/${ENV} output --raw cloudfront_domain_name)
export REACT_APP_API_BASE_URL=$(terraform -chdir=../..//env/${ENV} output --raw api_base_url)
export REACT_APP_PFQ_BASE_URL=http://localhost:5000-tf
export REACT_APP_LOCAL_CRYPTO_SECRET=CRYPTO_SECRET-tf

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

