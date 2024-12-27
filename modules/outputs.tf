output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "www-bucket-id" {
  value       = aws_s3_bucket.wwww.id
}