resource "aws_ecr_repository" "api" {
  name                 = "${local.name_prefix}-api"
  force_delete = true
}