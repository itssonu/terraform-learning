module "project_sonu" {
  source = "../../modules"
  project_name = var.project_name
  env = var.env
  aws_region = var.aws_region
  domain_name = var.domain_name
  sendgrid_api_key = var.sendgrid_api_key
  sendgrid_email_sender = var.sendgrid_email_sender
  anthropic_api_key = var.anthropic_api_key
}