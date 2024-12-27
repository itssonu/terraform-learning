output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.project_sonu.vpc_id
}

output "www-bucket-id" {
  value       = module.project_sonu.s3_www-id
}
output "website_url" {
  value       = module.project_sonu.cloudfront_domain_name
}