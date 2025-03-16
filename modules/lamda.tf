data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "iam_for_lambda" {
  name               = "iam_for_lambda"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# If you need basic Lambda execution permissions as well (for CloudWatch Logs, etc.)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.iam_for_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "api" {
  function_name = "${local.name_prefix}-api"
  role          = aws_iam_role.iam_for_lambda.arn
  image_uri = "${aws_ecr_repository.api.repository_url}:latest"
  package_type = "Image"
  vpc_config {
    subnet_ids = module.vpc.private_subnets
    security_group_ids = [aws_security_group.allow-in.id]
  }
  environment {
    variables = {
      foo = "bar"
    }
  }

  depends_on = [ aws_security_group.allow-in, aws_iam_role.iam_for_lambda, aws_ecr_repository.api ]
}