module "project_sonu" {
  source = "../../modules"
  project_name = var.project_name
  env = var.env
  aws_region = var.aws_region
}