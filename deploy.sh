#!/bin/bash

ENV=$1
S3_BUCKET="www-project-sonu-${ENV}"
CLOUDFRONT_DISTRIBUTION_ID="E16OGHJL4NQ8R7"

echo "deploying in $ENV"

terraform -chdir=./env/${ENV} init

terraform -chdir=./env/${ENV} apply -auto-approve

echo "setting env variables ui..."

export REACT_APP_FE_BASE_URL=$(terraform -chdir=./env/${ENV} output --raw cloudfront_domain_name)
export REACT_APP_API_BASE_URL=$(terraform -chdir=./env/${ENV} output --raw api_base_url)
export REACT_APP_PFQ_BASE_URL=http://localhost:5000-tf
export REACT_APP_LOCAL_CRYPTO_SECRET=CRYPTO_SECRET-tf

cd ./codeBase/auto-settlement-pro-ui
rm -rf build
npm i --force
npm run build
aws s3 rm s3://$S3_BUCKET --recursive
aws s3 sync ./build/ s3://$S3_BUCKET

echo "Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*" --query 'Invalidation.Id' --output text)


echo "API image push"

