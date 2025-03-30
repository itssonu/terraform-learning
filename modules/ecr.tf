resource "aws_ecr_repository" "api" {
  name                 = "${local.name_prefix}-api"
  force_delete = true
}

resource "aws_ecr_repository" "pfq" {
  name                 = "${local.name_prefix}-pfq"
  force_delete = true
}