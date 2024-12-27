locals {
  name_prefix = "${var.project_name}-${var.env}"
  
  common_tags = {
    Project     = var.project_name
    Environment = var.env
    ManagedBy   = "terraform"
  }
}