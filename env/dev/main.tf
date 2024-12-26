module "vpc" {
  source = "../../modules/vpc"
  project_name = var.project_name
  env = var.env
  aws_region = var.aws_region
}