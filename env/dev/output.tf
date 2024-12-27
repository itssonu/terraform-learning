output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.project_sonu.vpc_id
}

output "www-bucket-id" {
  value       = module.project_sonu.www-bucket-id
}