output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "s3_www-id" {
  value       = aws_s3_bucket.wwww.id
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.www.domain_name
}
output "api_base_url" {
  value = aws_lambda_function_url.api.function_url
}